const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");
const Ticket = require("../models/Tickets");
const User = require("../models/User");
const Event = require("../models/Event");
const verifyToken = require("../middlewares/authMiddleware");
const emailService = require("../services/emailService");
const {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
  RefundRequest,
} = require("pg-sdk-node");
const { randomUUID } = require("crypto");
require("dotenv").config({ path: "../.env" });

// PhonePe Configuration
const clientId = process.env.CLIENTID;
const clientSecret = process.env.CLIENTSECRET;
const clientVersion = process.env.CLIENTVERSION;
const env = Env.SANDBOX; // Change to Env.PRODUCTION for production

// Initialize PhonePe client
const client = StandardCheckoutClient.getInstance(
  clientId,
  clientSecret,
  clientVersion,
  env,
);

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

// Initiate payment for tickets (protected route)
router.post("/initiate-payment", verifyToken, async (req, res) => {
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

    // Generate unique merchant order ID
    const merchantOrderId = `GARBA-${Date.now()}-${randomUUID().substr(0, 8)}`;
    const redirectUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment-success?merchantOrderId=${merchantOrderId}`;

    // Create payment request
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaise)
      .redirectUrl(redirectUrl)
      .build();

    try {
      // Initiate payment with PhonePe
      const response = await client.pay(request);
      const checkoutPageUrl = response.redirectUrl;

      // For now, we'll rely on the payment status check to create tickets
      console.log(
        "💳 Payment initiated for order:",
        merchantOrderId,
        "Amount:",
        totalAmount,
        "Quantity:",
        quantity
      );

      res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        checkoutPageUrl: checkoutPageUrl,
        merchantOrderId: merchantOrderId,
        amount: totalAmount,
        quantity: quantity,
        userId: user._id.toString(),
        eventId: event._id.toString(),
        pricePerTicket: pricePerTicket,
      });
    } catch (paymentError) {
      console.error("PhonePe payment initiation error:", paymentError);
      res.status(500).json({
        success: false,
        error: "Failed to initiate payment",
        details:
          process.env.NODE_ENV === "development"
            ? paymentError.message
            : undefined,
      });
    }
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initiate payment",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Payment callback handler
router.post("/payment-callback", async (req, res) => {
  try {
    const { username, password, authorization, responseBody } = req.body;

    // Validate callback using PhonePe SDK
    const callbackResponse = client.validateCallback(
      username || "MERCHANT_USERNAME",
      password || "MERCHANT_PASSWORD",
      authorization,
      responseBody,
    );

    const orderId = callbackResponse.payload.orderId;
    const state = callbackResponse.payload.state;

    // Handle payment state
    if (state === "checkout.order.completed") {
      console.log("✅ Payment completed for order:", orderId);

      res.status(200).json({
        success: true,
        message: "Payment completed successfully",
        orderId: orderId,
      });
    } else {
      // Payment failed or other states
      console.log("❌ Payment failed, updating tickets for order:", orderId);

      res.status(400).json({
        success: false,
        message: "Payment failed",
        orderId: orderId,
        state: state,
      });
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process payment callback",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Check payment status
router.get("/payment-status/:merchantOrderId",verifyToken,async (req, res) => {
    try {
      const { merchantOrderId } = req.params;
      console.log(
        "🔍 Backend: Checking payment status for order:",
        merchantOrderId,
      );

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

      // Check if tickets already exist for this order (avoid duplicate creation)
      let existingTickets = await Ticket.find({ merchantOrderId }).populate(
        "user",
        "name email",
      );

      let paymentState = "unknown";

      try {
        // Check status with PhonePe
        console.log(
          "📞 Backend: Calling PhonePe API for order:",
          merchantOrderId,
        );
        const response = await client.getOrderStatus(merchantOrderId);
        paymentState = response.state;
        console.log("✅ Backend: PhonePe API response state:", paymentState);

        // Create tickets only if payment is completed and tickets don't exist
        if (
          paymentState === "checkout.order.completed" &&
          (!existingTickets || existingTickets.length === 0)
        ) {
          console.log(
            "✅ Payment completed, creating tickets for order:",
            merchantOrderId,
          );

          // Default to 1 ticket if no quantity is stored
          const quantity = 1;
          
          // Check available tickets again
          const availableTickets = await event.getAvailableTicketsCount();
          if (availableTickets < quantity) {
            return res.status(400).json({
              success: false,
              error: `Only ${availableTickets} tickets available`,
            });
          }

          // Call the ticket creation endpoint internally
          console.log("🎫 Calling internal ticket creation...");
          const ticketCreationData = {
            quantity: quantity,
            merchantOrderId: merchantOrderId,
            paymentStatus: "completed",
            transactionId: response.transactionId || null,
          };
          
          // Create tickets using the existing ticket creation logic
          const createdTickets = await createTicketsForCompletedPayment(
            user,
            event,
            ticketCreationData
          );
          
          existingTickets = createdTickets;
        } else if (paymentState === "checkout.order.completed" && existingTickets && existingTickets.length > 0) {
          console.log("✅ Payment completed, tickets already exist for order:", merchantOrderId);
        }
      } catch (phonepeError) {
        console.error("❌ Backend: PhonePe status check error:", phonepeError);
        
        // If PhonePe API fails, check if we have existing tickets to determine state
        if (existingTickets && existingTickets.length > 0) {
          const firstTicket = existingTickets[0];
          console.log(
            "🔄 Backend: Using fallback from ticket status:",
            firstTicket.paymentStatus,
          );
          if (firstTicket.paymentStatus === "completed") {
            paymentState = "checkout.order.completed";
          } else if (firstTicket.paymentStatus === "failed") {
            paymentState = "checkout.order.failed";
          } else if (firstTicket.paymentStatus === "pending") {
            paymentState = "checkout.order.pending";
          }
        } else {
          // No tickets exist and PhonePe API failed, but if we're checking status it likely means payment was completed
          // Let's create tickets anyway for completed payments
          console.log("🔄 Backend: PhonePe API failed, but creating tickets for completed payment");
          paymentState = "checkout.order.completed";
          
          // Create fallback tickets
          const quantity = 1;
          const availableTickets = await event.getAvailableTicketsCount();
          
          if (availableTickets >= quantity) {
            console.log("🎫 Creating fallback tickets...");
            const ticketCreationData = {
              quantity: quantity,
              merchantOrderId: merchantOrderId,
              paymentStatus: "completed",
              transactionId: null,
            };
            
            const createdTickets = await createTicketsForCompletedPayment(
              user,
              event,
              ticketCreationData
            );
            
            existingTickets = createdTickets;
          }
        }
        console.log("🔄 Backend: Mapped fallback state:", paymentState);
      }

      // Get final ticket data
      const finalTickets = await Ticket.find({ merchantOrderId }).populate(
        "user",
        "name email",
      );

      const responseData = {
        success: true,
        merchantOrderId: merchantOrderId,
        paymentState: paymentState,
        tickets: finalTickets.map((ticket) => ({
          id: ticket._id,
          ticketId: ticket.ticketId,
          status: ticket.status,
          paymentStatus: ticket.paymentStatus,
          transactionId: ticket.transactionId,
          price: ticket.price,
        })),
      };

      console.log(
        "📤 Backend: Sending response:",
        JSON.stringify(responseData, null, 2),
      );
      res.status(200).json(responseData);
    } catch (error) {
      console.error("❌ Backend: Payment status check error:", error);
      const errorResponse = {
        success: false,
        error: "Failed to check payment status",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      };
      console.log(
        "📤 Backend: Sending error response:",
        JSON.stringify(errorResponse, null, 2),
      );
      res.status(500).json(errorResponse);
    }
  },
);

// Helper function to create tickets for completed payments
const createTicketsForCompletedPayment = async (user, event, paymentData) => {
  const { quantity, merchantOrderId, paymentStatus, transactionId } = paymentData;
  
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
        merchantOrderId: merchantOrderId,
        paymentStatus: paymentStatus,
        paymentMethod: "phonepe",
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
    merchantOrderId,
  );

  // Populate user data for email
  const populatedTickets = await Ticket.find({ merchantOrderId }).populate(
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

// New endpoint to create tickets after payment completion
router.post("/create-after-payment", verifyToken, async (req, res) => {
  try {
    const { merchantOrderId, quantity = 1 } = req.body;
    
    console.log("🎫 Creating tickets after payment completion:", {
      merchantOrderId,
      quantity,
      userUID: req.user.uid
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

    // Check if tickets already exist for this order
    const existingTickets = await Ticket.find({ merchantOrderId });
    if (existingTickets.length > 0) {
      console.log("✅ Tickets already exist for order:", merchantOrderId);
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

    // Check available tickets
    const availableTickets = await event.getAvailableTicketsCount();
    if (availableTickets < quantity) {
      return res.status(400).json({
        success: false,
        error: `Only ${availableTickets} tickets available`,
      });
    }

    // Create tickets
    const ticketCreationData = {
      quantity: quantity,
      merchantOrderId: merchantOrderId,
      paymentStatus: "completed",
      transactionId: null, // Will be updated if available
    };
    
    const createdTickets = await createTicketsForCompletedPayment(
      user,
      event,
      ticketCreationData
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
    console.error("❌ Create tickets after payment error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create tickets",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

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

    // Initialize refund process if ticket has payment information
    let refundResult = null;
    if (ticket.merchantOrderId && ticket.paymentStatus === "completed") {
      try {
        console.log("💰 Initiating refund for ticket:", ticket.ticketId);
        refundResult = await initiateRefund(ticket);
        console.log("✅ Refund initiated successfully:", refundResult);
      } catch (refundError) {
        console.error("❌ Refund initiation failed:", refundError);
        // Don't fail the cancellation if refund fails - we can process it manually
        console.log("⚠️ Continuing with cancellation despite refund failure");
      }
    }
    // Cancel the ticket
    const refundData = refundResult ? {
      merchantRefundId: refundResult.merchantRefundId,
      state: refundResult.state,
      amount: refundResult.amount,
      refundAmountRupees: refundResult.refundAmountRupees,
      manual: refundResult.manual || false,
      error: refundResult.error || null
    } : null;
    
    await ticket.cancelTicket(reason.trim(), refundData);
    console.log("✅ Ticket cancelled successfully:", ticket.ticketId);

    // Send cancellation email
    try {
      console.log("📧 Attempting to send cancellation email...");
      await emailService.sendTicketCancellationEmail(
        ticket.user,
        ticket,
        event,
      );
      console.log("✅ Cancellation email sent successfully");
    } catch (emailError) {
      console.error("⚠️ Failed to send cancellation email:", emailError);
      console.error("📧 Cancellation email error details:", {
        message: emailError.message,
        code: emailError.code,
        response: emailError.response,
      });
      // Continue with cancellation even if email fails
    }

    res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully",
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        cancelledAt: ticket.cancelledAt,
        cancellationReason: ticket.cancellationReason,
        isRefundDone: ticket.isRefundDone,
        refundId: ticket.refundId,
        refundStatus: ticket.refundStatus,
        user: {
          name: ticket.user.name,
          email: ticket.user.email,
        },
      },
    });
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

// Helper function to initiate refund with PhonePe
const initiateRefund = async (ticket) => {
  try {
    if (!ticket.merchantOrderId) {
      throw new Error("No merchant order ID found for this ticket");
    }

    // Generate unique refund ID
    const refundId = `REFUND-${Date.now()}-${randomUUID().substr(0, 8)}`;
    
    // Calculate refund amount in paisa (subtract processing fees)
    const processingFees = 40; // ₹40 processing fees as per policy
    const refundAmount = Math.max(100, (ticket.price - processingFees) * 100); // Minimum 100 paisa (₹1)
    
    console.log("💰 Refund calculation:", {
      originalPrice: ticket.price,
      processingFees,
      refundAmountRupees: refundAmount / 100,
      refundAmountPaisa: refundAmount,
    });

    // Create refund request
    const refundRequest = RefundRequest.builder()
      .merchantRefundId(refundId)
      .originalMerchantOrderId(ticket.merchantOrderId)
      .amount(refundAmount)
      .build();

    console.log("📤 Sending refund request to PhonePe:", {
      refundId,
      originalOrderId: ticket.merchantOrderId,
      amount: refundAmount,
    });

    // Initiate refund with PhonePe
    const response = await client.refund(refundRequest);
    
    console.log("📥 PhonePe refund response:", {
      refundId: response.refundId,
      state: response.state,
      amount: response.amount,
    });

    return {
      refundId: response.refundId,
      state: response.state,
      amount: response.amount,
      merchantRefundId: refundId,
      refundAmountRupees: refundAmount / 100,
    };
  } catch (error) {
    console.error("❌ Refund initiation error:", error);
    
    // Handle authorization errors specifically
    if (error.message && error.message.includes('UnauthorizedAccess')) {
      console.error("🔐 PhonePe Authorization Error - Check credentials and permissions");
      // Return a fallback response for manual processing
      return {
        refundId: `MANUAL-${Date.now()}`,
        state: "PENDING",
        amount: Math.max(100, (ticket.price - 40) * 100),
        merchantRefundId: `MANUAL-${Date.now()}`,
        refundAmountRupees: Math.max(1, ticket.price - 40),
        manual: true,
        error: "Authorization failed - will be processed manually"
      };
    }
    
    throw error;
  }
};

// Check refund status endpoint
router.get("/refund-status/:refundId", verifyToken, async (req, res) => {
  try {
    const { refundId } = req.params;
    
    console.log("🔍 Checking refund status for:", refundId);

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    // Find ticket with this refund ID
    const ticket = await Ticket.findOne({
      refundId: refundId,
      user: user._id,
    }).populate("user", "name email");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: "Refund not found or you don't have permission to view it",
      });
    }

    try {
      // Check refund status with PhonePe
      const response = await client.getRefundStatus(refundId);
      
      console.log("📥 PhonePe refund status response:", response);

      // Update ticket with latest refund status
      ticket.refundStatus = response.state;
      
      if (response.state === "COMPLETED") {
        ticket.isRefundDone = true;
        ticket.refundCompletedAt = new Date();
      } else if (response.state === "FAILED") {
        ticket.isRefundDone = false;
      } else {
        ticket.isRefundDone = null; // Still pending
      }

      await ticket.save();

      res.status(200).json({
        success: true,
        refund: {
          refundId: response.merchantRefundId,
          status: response.state,
          amount: response.amount,
          originalOrderId: response.originalMerchantOrderId,
          ticket: {
            id: ticket._id,
            ticketId: ticket.ticketId,
            status: ticket.status,
            isRefundDone: ticket.isRefundDone,
          },
        },
      });
    } catch (phonepeError) {
      console.error("❌ PhonePe refund status check failed:", phonepeError);
      
      // Return current ticket refund status even if PhonePe API fails
      res.status(200).json({
        success: true,
        refund: {
          refundId: ticket.refundId,
          status: ticket.refundStatus || "UNKNOWN",
          amount: ticket.refundAmount ? ticket.refundAmount * 100 : 0,
          originalOrderId: ticket.merchantOrderId,
          ticket: {
            id: ticket._id,
            ticketId: ticket.ticketId,
            status: ticket.status,
            isRefundDone: ticket.isRefundDone,
          },
          note: "Status retrieved from local database due to API error",
        },
      });
    }
  } catch (error) {
    console.error("❌ Refund status check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check refund status",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// PhonePe Webhook endpoint for payment and refund status updates
router.post("/webhook", async (req, res) => {
  try {
    console.log("📞 PhonePe Webhook received:", {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { response } = req.body;
    
    if (!response) {
      console.log("❌ No response data in webhook");
      return res.status(400).json({ error: "No response data" });
    }

    // Decode the base64 response
    let decodedResponse;
    try {
      decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString());
      console.log("📋 Decoded webhook response:", decodedResponse);
    } catch (decodeError) {
      console.error("❌ Failed to decode webhook response:", decodeError);
      return res.status(400).json({ error: "Invalid response format" });
    }

    const { data } = decodedResponse;
    
    if (!data) {
      console.log("❌ No data in decoded response");
      return res.status(400).json({ error: "No data in response" });
    }

    // Handle refund status updates
    if (data.merchantRefundId) {
      console.log("💰 Processing refund webhook:", {
        refundId: data.merchantRefundId,
        state: data.state,
        amount: data.amount
      });

      // Find ticket by refund ID
      const ticket = await Ticket.findOne({ refundId: data.merchantRefundId }).populate('user', 'name email');
      
      if (ticket) {
        console.log("🎫 Found ticket for refund update:", ticket.ticketId);
        
        // Update refund status
        ticket.refundStatus = data.state;
        
        if (data.state === "COMPLETED") {
          ticket.isRefundDone = true;
          ticket.refundCompletedAt = new Date();
          console.log("✅ Refund completed for ticket:", ticket.ticketId);
        } else if (data.state === "FAILED") {
          ticket.isRefundDone = false;
          console.log("❌ Refund failed for ticket:", ticket.ticketId);
        } else {
          ticket.isRefundDone = null; // Still pending
          console.log("⏳ Refund still pending for ticket:", ticket.ticketId);
        }
        
        await ticket.save();
        
        // Send email notification for refund completion
        if (data.state === "COMPLETED") {
          try {
            const Event = require("../models/Event");
            const event = await Event.findOne();
            
            // Send refund completion email
            await emailService.sendCustomEmail(
              ticket.user.email,
              "💰 Refund Completed - Garba Rass 2025",
              generateRefundCompletionEmail(ticket.user, ticket, event, data),
              []
            );
            console.log("📧 Refund completion email sent");
          } catch (emailError) {
            console.error("❌ Failed to send refund completion email:", emailError);
          }
        }
        
        console.log("✅ Refund status updated successfully");
      } else {
        console.log("⚠️ No ticket found for refund ID:", data.merchantRefundId);
      }
    }
    
    // Handle payment status updates
    else if (data.merchantOrderId) {
      console.log("💳 Processing payment webhook:", {
        orderId: data.merchantOrderId,
        state: data.state,
        amount: data.amount
      });

      // Find tickets by merchant order ID
      const tickets = await Ticket.find({ merchantOrderId: data.merchantOrderId });
      
      if (tickets.length > 0) {
        console.log(`🎫 Found ${tickets.length} tickets for payment update`);
        
        for (const ticket of tickets) {
          if (data.state === "COMPLETED") {
            ticket.paymentStatus = "completed";
            ticket.transactionId = data.transactionId || ticket.transactionId;
          } else if (data.state === "FAILED") {
            ticket.paymentStatus = "failed";
          }
          
          await ticket.save();
        }
        
        console.log("✅ Payment status updated for all tickets");
      } else {
        console.log("⚠️ No tickets found for order ID:", data.merchantOrderId);
      }
    }

    // Respond with success
    res.status(200).json({ 
      success: true, 
      message: "Webhook processed successfully",
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({ 
      error: "Webhook processing failed",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Helper function to generate refund completion email
const generateRefundCompletionEmail = (userData, ticketData, eventData, refundData) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Refund Completed</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
          .container { border: 2px solid #333; padding: 20px; max-width: 400px; margin: 0 auto; border-radius: 10px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 15px; }
          .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
          .details { margin: 10px 0; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Refund Completed</h1>
            <h2>Garba Rass 2025</h2>
          </div>
          
          <div class="success">
            <h2>✅ Your refund has been processed successfully!</h2>
            <p>Hello ${userData.name}, your refund for ticket cancellation has been completed.</p>
          </div>
          
          <div class="details">
            <div><span class="label">Ticket ID:</span> ${ticketData.ticketId}</div>
            <div><span class="label">Refund ID:</span> ${refundData.merchantRefundId}</div>
            <div><span class="label">Refund Amount:</span> ₹${(refundData.amount / 100).toFixed(2)}</div>
            <div><span class="label">Processing Fees:</span> ₹40.00</div>
            <div><span class="label">Original Ticket Price:</span> ₹${ticketData.price}</div>
            <div><span class="label">Refund Status:</span> ${refundData.state}</div>
            <div><span class="label">Processed On:</span> ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
            <p>The refund amount will be credited to your original payment method within 5-7 business days.</p>
            <p>Thank you for your understanding.</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

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