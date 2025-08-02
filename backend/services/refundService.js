const Razorpay = require("razorpay");
const Refund = require("../models/Refund");
const Ticket = require("../models/Tickets");
const User = require("../models/User");
const emailService = require("./emailService");
require("dotenv").config({ path: "../.env" });

class RefundService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  // Create refund request and initiate with Razorpay
  async initiateRefund(ticketId, userId, reason, metadata = {}) {
    try {
      console.log("🔄 Initiating refund for ticket:", ticketId);

      // Find ticket and user
      const [ticket, user] = await Promise.all([
        Ticket.findById(ticketId).populate("user"),
        User.findById(userId),
      ]);

      if (!ticket) {
        throw new Error("Ticket not found");
      }

      if (!user) {
        throw new Error("User not found");
      }

      // Verify ticket belongs to user
      if (ticket.user._id.toString() !== userId.toString()) {
        throw new Error("Ticket does not belong to this user");
      }

      // Check if ticket can be refunded
      if (ticket.status === "cancelled") {
        throw new Error("Ticket is already cancelled");
      }

      if (ticket.status === "used") {
        throw new Error("Cannot refund a used ticket");
      }

      if (!ticket.paymentId) {
        throw new Error("No payment ID found for this ticket");
      }

      // Check if refund already exists
      const existingRefund = await Refund.findOne({ ticket: ticketId });
      if (existingRefund) {
        throw new Error("Refund request already exists for this ticket");
      }

      // Create refund record
      const refund = await Refund.createRefundRequest(ticket, user, reason);
      refund.metadata = { ...refund.metadata, ...metadata };
      await refund.save();

      console.log("📝 Refund request created:", refund.refundId);

      // Initiate refund with Razorpay
      try {
        console.log("💳 Initiating Razorpay refund...");
        
        const razorpayRefund = await this.razorpay.payments.refund(ticket.paymentId, {
          amount: refund.refundAmount * 100, // Convert to paise
          speed: "normal", // or "optimum" for faster processing
          notes: {
            refund_id: refund.refundId,
            ticket_id: ticket.ticketId,
            reason: reason.substring(0, 100), // Razorpay has character limits
            user_email: user.email,
          },
        });

        console.log("✅ Razorpay refund initiated:", razorpayRefund.id);

        // Update refund with Razorpay details
        refund.razorpayRefundId = razorpayRefund.id;
        refund.status = "processing";
        await refund.save();

        // Cancel the ticket
        await ticket.cancelTicket(reason);

        console.log("🎫 Ticket cancelled successfully");

        // Send refund initiated email
        try {
          await emailService.sendRefundInitiatedEmail(user, ticket, refund);
          console.log("📧 Refund initiated email sent");
        } catch (emailError) {
          console.error("Failed to send refund email:", emailError);
          // Don't fail the refund process if email fails
        }

        return {
          success: true,
          refund: refund.getSafeRefundData(),
          razorpayRefund,
        };

      } catch (razorpayError) {
        console.error("❌ Razorpay refund failed:", razorpayError);
        
        // Update refund status to failed
        refund.status = "failed";
        refund.failureReason = razorpayError.message;
        await refund.save();

        throw new Error(`Refund processing failed: ${razorpayError.message}`);
      }

    } catch (error) {
      console.error("❌ Refund initiation failed:", error);
      throw error;
    }
  }

  // Handle webhook events from Razorpay
  async handleWebhookEvent(event) {
    try {
      console.log("🔔 Processing webhook event:", event.event);

      const { event: eventType, payload } = event;

      // Handle refund-related events
      if (eventType.startsWith("refund.")) {
        await this.handleRefundWebhook(eventType, payload);
      }

      return { success: true };
    } catch (error) {
      console.error("❌ Webhook processing failed:", error);
      throw error;
    }
  }

  // Handle refund-specific webhook events
  async handleRefundWebhook(eventType, payload) {
    try {
      const refundEntity = payload.refund.entity;
      const razorpayRefundId = refundEntity.id;

      console.log("🔍 Processing refund webhook:", {
        eventType,
        refundId: razorpayRefundId,
        status: refundEntity.status,
      });

      // Find refund by Razorpay refund ID
      const refund = await Refund.findByRazorpayRefundId(razorpayRefundId);

      if (!refund) {
        console.warn("⚠️ Refund not found for webhook:", razorpayRefundId);
        return;
      }

      // Add webhook event to refund record
      await refund.addWebhookEvent(eventType, refundEntity.id, payload);

      let newStatus = refund.status;
      let emailRequired = false;

      // Update status based on webhook event
      switch (eventType) {
        case "refund.processed":
          newStatus = "processed";
          emailRequired = true;
          console.log("✅ Refund processed successfully");
          break;

        case "refund.failed":
          newStatus = "failed";
          refund.failureReason = refundEntity.error_description || "Refund failed";
          emailRequired = true;
          console.log("❌ Refund failed");
          break;

        case "refund.speed_changed":
          console.log("🔄 Refund speed changed");
          break;

        default:
          console.log("ℹ️ Unhandled refund event:", eventType);
      }

      // Update refund status if changed
      if (newStatus !== refund.status) {
        await refund.updateStatus(newStatus);
        console.log(`📊 Refund status updated: ${refund.status} → ${newStatus}`);
      }

      // Send email notification if required
      if (emailRequired) {
        try {
          if (newStatus === "processed") {
            await emailService.sendRefundCompletedEmail(
              refund.user,
              refund.ticket,
              refund
            );
          } else if (newStatus === "failed") {
            await emailService.sendRefundFailedEmail(
              refund.user,
              refund.ticket,
              refund
            );
          }
          console.log("📧 Refund status email sent");
        } catch (emailError) {
          console.error("Failed to send refund status email:", emailError);
        }
      }

    } catch (error) {
      console.error("❌ Refund webhook processing failed:", error);
      throw error;
    }
  }

  // Get refund status
  async getRefundStatus(refundId) {
    try {
      const refund = await Refund.findOne({ refundId })
        .populate("ticket", "ticketId eventName")
        .populate("user", "name email");

      if (!refund) {
        throw new Error("Refund not found");
      }

      return refund.getSafeRefundData();
    } catch (error) {
      console.error("Failed to get refund status:", error);
      throw error;
    }
  }

  // Get all refunds for a user
  async getUserRefunds(userId) {
    try {
      const refunds = await Refund.find({ user: userId })
        .populate("ticket", "ticketId eventName")
        .sort({ createdAt: -1 });

      return refunds.map(refund => refund.getSafeRefundData());
    } catch (error) {
      console.error("Failed to get user refunds:", error);
      throw error;
    }
  }

  // Admin: Get all refunds with pagination
  async getAllRefunds(filters = {}) {
    try {
      const { page = 1, limit = 20, status, search } = filters;
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(50, Math.max(1, parseInt(limit)));

      let query = {};

      // Filter by status
      if (status && status !== "all") {
        query.status = status;
      }

      // Search by user name or email
      if (search) {
        const users = await User.find({
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }).select("_id");

        query.user = { $in: users.map(u => u._id) };
      }

      const [refunds, total] = await Promise.all([
        Refund.find(query)
          .populate("ticket", "ticketId eventName")
          .populate("user", "name email")
          .sort({ createdAt: -1 })
          .limit(limitNum)
          .skip((pageNum - 1) * limitNum),
        Refund.countDocuments(query),
      ]);

      return {
        refunds: refunds.map(refund => refund.getSafeRefundData()),
        pagination: {
          current: pageNum,
          total: Math.ceil(total / limitNum),
          count: refunds.length,
          totalRefunds: total,
        },
      };
    } catch (error) {
      console.error("Failed to get all refunds:", error);
      throw error;
    }
  }

  // Verify webhook signature
  verifyWebhookSignature(body, signature, secret) {
    const crypto = require("crypto");
    
    // Ensure body is a Buffer or string for HMAC calculation
    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
    
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyBuffer)
      .digest("hex");

    return expectedSignature === signature;
  }
}

// Create singleton instance
const refundService = new RefundService();

module.exports = refundService;