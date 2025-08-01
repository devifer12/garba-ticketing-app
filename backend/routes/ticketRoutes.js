const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const Ticket = require("../models/Tickets");
const User = require("../models/User");
const Event = require("../models/Event");
const verifyToken = require("../middlewares/authMiddleware");
const emailService = require("../services/emailService");
const Razorpay = require("razorpay");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "../.env" });

// Razorpay Configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Helper function to generate QR code image
const generateQRCodeImage = async (qrData) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "M",
      type: "image/png",
      quality: 0.92,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      width: 256,
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error("QR Code generation error:", error);
    throw new Error("Failed to generate QR code image");
  }
};

// Create Razorpay order (protected route)
router.post("/create-order", verifyToken, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get event details
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Check if enough tickets are available
    const availableTickets = await event.getAvailableTicketsCount();
    if (availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${availableTickets} tickets available`,
      });
    }

    // Calculate total amount
    const totalAmount = event.calculateTotalAmount(quantity);
    const amountInPaise = Math.round(totalAmount * 100); // Convert to paise
    const pricePerTicket = event.calculatePrice(quantity);

    // Generate unique receipt ID
    const receiptId = `GARBA-${Date.now()}-${randomUUID().substr(0, 8)}`;

    try {
      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
        notes: {
          eventId: event._id.toString(),
          userId: user._id.toString(),
          quantity: quantity.toString(),
          pricePerTicket: pricePerTicket.toString(),
          eventName: event.name,
        },
      });

      console.log(
        "💳 Razorpay order created:",
        order.id,
        "Amount:",
        totalAmount,
        "Quantity:",
        quantity
      );

      res.status(200).json({
        success: true,
        message: "Order created successfully",
        orderId: order.id,
        amount: totalAmount,
        quantity: quantity,
        userId: user._id.toString(),
        eventId: event._id.toString(),
        pricePerTicket: pricePerTicket,
        currency: "INR",
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (razorpayError) {
      console.error("Razorpay order creation error:", razorpayError);
      res.status(500).json({
        success: false,
        error: "Failed to create payment order",
        details:
          process.env.NODE_ENV === "development"
            ? razorpayError.message
            : undefined,
      });
    }
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create order",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Verify Razorpay payment and create tickets
router.post("/verify-payment", verifyToken, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      quantity,
    } = req.body;

    console.log("🔍 Payment verification request:", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      quantity,
    });

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get event details
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Verify payment signature
    const crypto = require("crypto");
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error("❌ Payment signature verification failed");
      return res.status(400).json({
        success: false,
        error: "Payment verification failed",
      });
    }

    // Check if tickets already exist for this order (avoid duplicate creation)
    let existingTickets = await Ticket.find({ 
      paymentId: razorpay_payment_id 
    }).populate("user", "name email");

    if (existingTickets.length > 0) {
      console.log("✅ Tickets already exist for payment:", razorpay_payment_id);
      return res.status(200).json({
        success: true,
        message: "Tickets already created",
        tickets: existingTickets.map((ticket) => ({
          id: ticket._id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          price: ticket.price,
        })),
      });
    }

    // Check available tickets again
    const availableTickets = await event.getAvailableTicketsCount();
    if (availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${availableTickets} tickets available`,
      });
    }

    // Create tickets
    const createdTickets = await createTicketsForCompletedPayment(
      user,
      event,
      {
        quantity: quantity,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        paymentStatus: "completed",
        transactionId: razorpay_payment_id,
      }
    );

    res.status(201).json({
      success: true,
      message: `${quantity} ticket(s) created successfully!`,
      tickets: createdTickets.map((ticket) => ({
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        price: ticket.price,
      })),
    });
  } catch (error) {
    console.error("❌ Payment verification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify payment",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Helper function to create tickets for completed payments
const createTicketsForCompletedPayment = async (user, event, paymentData) => {
  const { quantity, paymentId, orderId, paymentStatus, transactionId } = paymentData;
  
  // Calculate pricing
  const pricePerTicket = event.calculatePrice(quantity);
  const totalAmount = event.calculateTotalAmount(quantity);

  // Create tickets
  const ticketCreationPromises = [];
  for (let i = 0; i < quantity; i++) {
    const ticketPromise = (async () => {
      const qrCode = Ticket.generateQRCode();
      const qrCodeImage = await generateQRCodeImage(qrCode);

      const ticket = new Ticket({
        user: user._id,
        eventName: event.name,
        price: pricePerTicket,
        qrCode: qrCode,
        qrCodeImage: qrCodeImage,
        status: "active",
        paymentId: paymentId,
        orderId: orderId,
        paymentStatus: paymentStatus,
        paymentMethod: "razorpay",
        transactionId: transactionId,
        metadata: {
          purchaseMethod: "online",
          deviceInfo: "",
          ipAddress: "",
          quantity: quantity,
          totalAmount: totalAmount,
        },
      });

      return await ticket.save();
    })();
    ticketCreationPromises.push(ticketPromise);
  }

  const createdTickets = await Promise.all(ticketCreationPromises);
  console.log(
    "🎫 Created tickets:",
    createdTickets.length,
    "for order:",
    orderId,
  );

  // Populate user data for email
  const populatedTickets = await Ticket.find({ paymentId }).populate(
    "user",
    "name email",
  );

  // Send confirmation email after successful ticket creation
  try {
    console.log("📧 Sending purchase confirmation email...");
    await emailService.sendTicketPurchaseEmail(
      user,
      populatedTickets,
      event,
      totalAmount,
      quantity,
    );
    console.log("✅ Purchase confirmation email sent successfully");
  } catch (emailError) {
    console.error(
      "❌ Failed to send purchase confirmation email:",
      emailError,
    );
    // Don't fail the entire process if email fails
  }

  return populatedTickets;
};

// Create a ticket (protected route) - Keep original for backward compatibility
router.post("/", verifyToken, async (req, res) => {
  try {
    const { quantity = 1, eventId } = req.body;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get event details (assuming single event for now)
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Check if enough tickets are available
    const availableTickets = await event.getAvailableTicketsCount();
    if (availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${availableTickets} tickets available`,
      });
    }

    // Create tickets array
    const ticketCreationPromises = [];

    for (let i = 0; i < quantity; i++) {
      const ticketPromise = (async () => {
        // Generate unique QR code
        const qrCode = Ticket.generateQRCode();

        // Generate QR code image
        const qrCodeImage = await generateQRCodeImage(qrCode);

        // Calculate price based on quantity (tiered pricing)
        const pricePerTicket = event.calculatePrice(quantity);

        // Create ticket
        const ticket = new Ticket({
          user: user._id,
          eventName: event.name,
          price: pricePerTicket,
          qrCode: qrCode,
          qrCodeImage: qrCodeImage,
          metadata: {
            purchaseMethod: "online",
            deviceInfo: req.headers["user-agent"] || "",
            ipAddress: req.ip || req.connection.remoteAddress || "",
            quantity: quantity,
            totalAmount: event.calculateTotalAmount(quantity),
          },
        });

        const savedTicket = await ticket.save();
        await savedTicket.populate("user", "name email");

        return savedTicket;
      })();

      ticketCreationPromises.push(ticketPromise);
    }

    // Wait for all tickets to be created
    const createdTickets = await Promise.all(ticketCreationPromises);

    // Prepare response data
    const responseTickets = createdTickets.map((ticket) => ({
      id: ticket._id,
      ticketId: ticket.ticketId,
      qrCode: ticket.qrCode,
      qrCodeImage: ticket.qrCodeImage,
      eventName: ticket.eventName,
      price: ticket.price,
      status: ticket.status,
      createdAt: ticket.createdAt,
      user: {
        name: ticket.user.name,
        email: ticket.user.email,
      },
    }));

    // Get updated event data
    const updatedEvent = await Event.getEventWithTicketCounts();
    const totalAmount = event.calculateTotalAmount(quantity);
    const pricePerTicket = event.calculatePrice(quantity);

    // Send email notification
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("📧 Attempting to send purchase confirmation email...");
      }

      await emailService.sendTicketPurchaseEmail(
        user,
        createdTickets,
        event,
        totalAmount,
        quantity,
      );
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Purchase confirmation email sent successfully");
      }
    } catch (emailError) {
      console.error(
        "Failed to send purchase confirmation email:",
        process.env.NODE_ENV === "development"
          ? emailError
          : emailError.message,
      );
      // Don't fail the ticket creation if email fails
    }

    res.status(201).json({
      success: true,
      message: `${quantity} ticket(s) booked successfully!`,
      tickets: responseTickets,
      totalAmount: totalAmount,
      pricePerTicket: pricePerTicket,
      pricing: {
        quantity: quantity,
        pricePerTicket: pricePerTicket,
        totalAmount: totalAmount,
        appliedTier: quantity >= 4 ? "group4" : "individual",
      },
      event: {
        name: updatedEvent.name,
        date: updatedEvent.date,
        venue: updatedEvent.venue,
        totalTickets: updatedEvent.totalTickets,
        soldTickets: updatedEvent._soldTickets || 0,
        availableTickets: updatedEvent.availableTickets,
      },
    });
  } catch (error) {
    console.error("Ticket creation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to book ticket(s)",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user's tickets (protected route)
router.get("/my-tickets", verifyToken, async (req, res) => {
  try {
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Get all tickets for this user
    const tickets = await Ticket.find({ user: user._id })
      .populate("user", "name email")
      .populate("scannedBy", "name email")
      .sort({ createdAt: -1 });

    const responseTickets = tickets.map((ticket) => ({
      id: ticket._id,
      ticketId: ticket.ticketId,
      qrCode: ticket.qrCode,
      qrCodeImage: ticket.qrCodeImage,
      eventName: ticket.eventName,
      price: ticket.price,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      entryTime: ticket.entryTime,
      scannedAt: ticket.scannedAt,
      isScanned: ticket.isScanned,
      hasEntered: ticket.hasEntered,
      scannedBy: ticket.scannedBy
        ? {
            name: ticket.scannedBy.name,
            email: ticket.scannedBy.email,
          }
        : null,
    }));

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets: responseTickets,
    });
  } catch (error) {
    console.error("Fetch tickets error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tickets",
    });
  }
});

// Get specific ticket by ID (protected route)
router.get("/:ticketId", verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Find ticket and ensure it belongs to the requesting user
    const ticket = await Ticket.findOne({
      _id: ticketId,
      user: user._id,
    })
      .populate("user", "name email")
      .populate("scannedBy", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    res.status(200).json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        qrCode: ticket.qrCode,
        qrCodeImage: ticket.qrCodeImage,
        eventName: ticket.eventName,
        price: ticket.price,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        entryTime: ticket.entryTime,
        scannedAt: ticket.scannedAt,
        isScanned: ticket.isScanned,
        hasEntered: ticket.hasEntered,
        user: {
          name: ticket.user.name,
          email: ticket.user.email,
        },
        scannedBy: ticket.scannedBy
          ? {
              name: ticket.scannedBy.name,
              email: ticket.scannedBy.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Fetch ticket error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ticket",
    });
  }
});

// QR Code verification endpoint (for checkers)
router.post("/verify-qr", verifyToken, async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 QR Verification Request:", {
        qrCode: qrCode ? qrCode.substring(0, 20) + "..." : "null",
        userUID: req.user.uid,
      });
    }

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: "QR code is required",
      });
    }

    // Validate QR code format
    const isValidFormat = Ticket.isValidQRCode(qrCode);

    if (!isValidFormat) {
      return res.status(400).json({
        success: false,
        error: "Invalid QR code format",
      });
    }

    // Find ticket by QR code
    const ticket = await Ticket.findOne({ qrCode: qrCode })
      .populate("user", "name email role")
      .populate("scannedBy", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    // Check ticket status
    if (ticket.status === "used") {
      return res.status(400).json({
        success: false,
        error: "This ticket has already been used",
        ticket: {
          ticketId: ticket.ticketId,
          usedAt: ticket.entryTime,
          scannedAt: ticket.scannedAt,
        },
      });
    }

    // Return ticket information for verification
    res.status(200).json({
      success: true,
      message: "Valid ticket found",
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        qrCode: ticket.qrCode,
        eventName: ticket.eventName,
        status: ticket.status,
        user: {
          name: ticket.user.name,
          email: ticket.user.email,
        },
        createdAt: ticket.createdAt,
        isScanned: ticket.isScanned,
        hasEntered: ticket.hasEntered,
      },
    });
  } catch (error) {
    console.error(
      "QR verification error:",
      process.env.NODE_ENV === "development" ? error : error.message,
    );
    res.status(500).json({
      success: false,
      error: "Failed to verify QR code",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Mark ticket as used (for checkers)
router.post("/mark-used", verifyToken, async (req, res) => {
  try {
    const { qrCode } = req.body;

    if (process.env.NODE_ENV === "development") {
      console.log("🎯 Mark as used request:", {
        qrCode: qrCode ? qrCode.substring(0, 20) + "..." : "null",
        userUID: req.user.uid,
      });
    }

    if (!qrCode) {
      return res.status(400).json({
        success: false,
        error: "QR code is required",
      });
    }

    // Find checker user
    const checker = await User.findOne({ firebaseUID: req.user.uid });
    if (!checker) {
      return res.status(404).json({
        success: false,
        error: "Checker not found",
      });
    }

    // Check if user has permission to mark tickets as used
    if (!["admin", "qrchecker", "manager"].includes(checker.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions to mark tickets as used",
      });
    }

    // Find ticket by QR code
    const ticket = await Ticket.findOne({ qrCode: qrCode }).populate(
      "user",
      "name email",
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    // Check if ticket is already used
    if (ticket.status === "used") {
      return res.status(400).json({
        success: false,
        error: "Ticket has already been used",
        ticket: {
          ticketId: ticket.ticketId,
          usedAt: ticket.entryTime,
          scannedBy: ticket.scannedBy,
        },
      });
    }

    // Mark ticket as used
    await ticket.markAsUsed(checker._id);

    res.status(200).json({
      success: true,
      message: "Ticket marked as used successfully",
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        entryTime: ticket.entryTime,
        scannedAt: ticket.scannedAt,
        user: {
          name: ticket.user.name,
          email: ticket.user.email,
        },
        scannedBy: {
          name: checker.name,
          email: checker.email,
        },
      },
    });
  } catch (error) {
    console.error(
      "Mark ticket as used error:",
      process.env.NODE_ENV === "development" ? error : error.message,
    );
    res.status(500).json({
      success: false,
      error: "Failed to mark ticket as used",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Cancel ticket endpoint (for users)
router.patch("/cancel/:ticketId", verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { reason } = req.body;

    console.log("🚫 Cancel ticket request:", {
      ticketId,
      reason: reason ? reason.substring(0, 50) + "..." : "No reason provided",
      userUID: req.user.uid,
    });

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        error: "Cancellation reason is required",
      });
    }

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Find ticket and ensure it belongs to the requesting user
    const ticket = await Ticket.findOne({
      _id: ticketId,
      user: user._id,
    }).populate("user", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found or you don't have permission to cancel it",
      });
    }

    // Check if ticket is already cancelled or used
    if (ticket.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "This ticket has already been cancelled",
      });
    }

    if (ticket.status === "used") {
      return res.status(400).json({
        success: false,
        error: "Cannot cancel a ticket that has already been used",
      });
    }

    // Get event details to check cancellation policy
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({
        success: false,
        error: "Event not found",
      });
    }

    // Check if cancellation is allowed (at least 10 days before event)
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const daysDifference = Math.ceil(
      (eventDate - currentDate) / (1000 * 60 * 60 * 24),
    );

    console.log("📅 Cancellation policy check:", {
      eventDate: eventDate.toISOString(),
      currentDate: currentDate.toISOString(),
      daysDifference,
      minDaysRequired: 10,
    });

    if (daysDifference < 10) {
      return res.status(400).json({
        success: false,
        error: `Tickets can only be cancelled at least 10 days before the event. Only ${daysDifference} days remaining.`,
      });
    }

    // Initiate refund process instead of just cancelling
    try {
      console.log("💰 Initiating refund process...");
      
      const metadata = {
        ipAddress: req.ip || req.connection.remoteAddress || "",
        userAgent: req.headers["user-agent"] || "",
      };

      const refundResult = await refundService.initiateRefund(
        ticketId,
        user._id,
        reason.trim(),
        metadata
      );

      console.log("✅ Refund initiated successfully:", refundResult.refund.refundId);

      res.status(200).json({
        success: true,
        message: "Ticket cancelled and refund initiated successfully",
        ticket: {
          id: ticket._id,
          ticketId: ticket.ticketId,
          status: "cancelled",
          cancelledAt: new Date(),
          cancellationReason: reason.trim(),
          user: {
            name: ticket.user.name,
            email: ticket.user.email,
          },
        },
        refund: refundResult.refund,
      });

    } catch (refundError) {
      console.error("❌ Refund initiation failed:", refundError);
      
      // Fallback: Cancel ticket without refund
      await ticket.cancelTicket(reason.trim());
      console.log("✅ Ticket cancelled (without refund):", ticket.ticketId);

      // Send regular cancellation email
      try {
        await emailService.sendTicketCancellationEmail(ticket.user, ticket, event);
        console.log("✅ Cancellation email sent successfully");
      } catch (emailError) {
        console.error("⚠️ Failed to send cancellation email:", emailError);
      }

      res.status(200).json({
        success: true,
        message: "Ticket cancelled successfully. Refund will be processed manually.",
        ticket: {
          id: ticket._id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          cancelledAt: ticket.cancelledAt,
          cancellationReason: ticket.cancellationReason,
          user: {
            name: ticket.user.name,
            email: ticket.user.email,
          },
        },
        refundNote: "Refund will be processed manually within 5-7 business days",
      });
    }

  } catch (error) {
    console.error("❌ Cancel ticket error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel ticket",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Admin routes (for managing all tickets)
const { isAdmin, isManager } = require("../middlewares/roleMiddleware");

// Get all tickets (Admin/Manager only)
router.get("/admin/all", verifyToken, isManager, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    // Search by user name, email, or ticket ID
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { ticketId: { $regex: search, $options: "i" } },
      ];
    }

    const tickets = await Ticket.find(query)
      .populate("user", "name email role")
      .populate("scannedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ticket.countDocuments(query);

    res.status(200).json({
      success: true,
      count: tickets.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      tickets: tickets.map((ticket) => ticket.getSafeTicketData()),
    });
  } catch (error) {
    console.error("Admin fetch tickets error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tickets",
    });
  }
});

// Update ticket status (Admin only)
router.patch(
  "/admin/:ticketId/status",
  verifyToken,
  isAdmin,
  async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;

      if (!["active", "used", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status",
        });
      }

      const ticket = await Ticket.findByIdAndUpdate(
        ticketId,
        { status },
        { new: true },
      ).populate("user", "name email");

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: "Ticket not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Ticket status updated successfully",
        ticket: ticket.getSafeTicketData(),
      });
    } catch (error) {
      console.error("Update ticket status error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update ticket status",
      });
    }
  },
);

// Delete ticket (Admin only)
router.delete("/admin/:ticketId", verifyToken, isAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await Ticket.findById(ticketId).populate(
      "user",
      "name email",
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Ticket not found",
      });
    }

    // Get event data for email
    const event = await Event.findOne();

    // Send cancellation email before deleting
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("📧 Attempting to send cancellation email...");
      }
      await emailService.sendTicketCancellationEmail(
        ticket.user,
        ticket,
        event,
      );
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Cancellation email sent successfully");
      }
    } catch (emailError) {
      console.error(
        "Failed to send cancellation email:",
        process.env.NODE_ENV === "development"
          ? emailError
          : emailError.message,
      );
      // Continue with deletion even if email fails
    }

    // Delete the ticket
    await Ticket.findByIdAndDelete(ticketId);

    res.status(200).json({
      success: true,
      message: "Ticket cancelled and deleted successfully",
      ticket: ticket.getSafeTicketData(),
    });
  } catch (error) {
    console.error("Delete ticket error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete ticket",
    });
  }
});

// Get ticket statistics
router.get("/admin/stats", verifyToken, isManager, async (req, res) => {
  try {
    const stats = await Ticket.getTicketStats();

    // Get recent bookings
    const recentBookings = await Ticket.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      ...stats,
      recentBookings: recentBookings.map((ticket) =>
        ticket.getSafeTicketData(),
      ),
    });
  } catch (error) {
    console.error("Get ticket stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch ticket statistics",
    });
  }
});

module.exports = router;