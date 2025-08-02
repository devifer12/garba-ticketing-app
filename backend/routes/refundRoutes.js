const express = require("express");
const router = express.Router();
const refundService = require("../services/refundService");
const Refund = require("../models/Refund");
const Ticket = require("../models/Tickets");
const User = require("../models/User");
const verifyToken = require("../middlewares/authMiddleware");
const { isAdmin, isAdminOrManager } = require("../middlewares/roleMiddleware");

// Create refund request (protected route)
router.post("/create", verifyToken, async (req, res) => {
  try {
    const { ticketId, reason } = req.body;

    if (!ticketId || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Ticket ID and reason are required",
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

    // Get client metadata
    const metadata = {
      ipAddress: req.ip || req.connection.remoteAddress || "",
      userAgent: req.headers["user-agent"] || "",
    };

    // Initiate refund
    const result = await refundService.initiateRefund(
      ticketId,
      user._id,
      reason.trim(),
      metadata
    );

    res.status(201).json({
      success: true,
      message: "Refund request created and processing initiated",
      refund: result.refund,
    });

  } catch (error) {
    console.error("Refund creation error:", error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get user's refunds (protected route)
router.get("/my-refunds", verifyToken, async (req, res) => {
  try {
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const refunds = await refundService.getUserRefunds(user._id);

    res.status(200).json({
      success: true,
      refunds,
      count: refunds.length,
    });

  } catch (error) {
    console.error("Get user refunds error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refunds",
    });
  }
});

// Get refund status by ID (protected route)
router.get("/status/:refundId", verifyToken, async (req, res) => {
  try {
    const { refundId } = req.params;

    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const refund = await Refund.findOne({ 
      refundId, 
      user: user._id 
    })
    .populate("ticket", "ticketId eventName")
    .populate("user", "name email");

    if (!refund) {
      return res.status(404).json({
        success: false,
        error: "Refund not found",
      });
    }

    res.status(200).json({
      success: true,
      refund: refund.getSafeRefundData(),
    });

  } catch (error) {
    console.error("Get refund status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refund status",
    });
  }
});

// Admin: Get all refunds (admin/manager only)
router.get("/admin/all", verifyToken, isAdminOrManager, async (req, res) => {
  try {
    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      status: req.query.status || "all",
      search: req.query.search || "",
    };

    const result = await refundService.getAllRefunds(filters);

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error("Get all refunds error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refunds",
    });
  }
});

// Admin: Update refund status (admin only)
router.patch("/admin/:refundId/status", verifyToken, isAdmin, async (req, res) => {
  try {
    const { refundId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ["pending", "processing", "processed", "failed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const refund = await Refund.findOne({ refundId })
      .populate("ticket", "ticketId eventName")
      .populate("user", "name email");

    if (!refund) {
      return res.status(404).json({
        success: false,
        error: "Refund not found",
      });
    }

    await refund.updateStatus(status, notes || "");

    res.status(200).json({
      success: true,
      message: "Refund status updated successfully",
      refund: refund.getSafeRefundData(),
    });

  } catch (error) {
    console.error("Update refund status error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update refund status",
    });
  }
});

// Webhook endpoint for Razorpay (public)
router.post("/webhook", async (req, res) => {
  try {
    // Get raw body for signature verification
    let rawBody;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === 'string') {
      rawBody = Buffer.from(req.body);
    } else {
      rawBody = Buffer.from(JSON.stringify(req.body));
    }

    const signature = req.headers["x-razorpay-signature"];

    console.log("🔔 Refund webhook received");

    // Verify webhook signature
    const isValid = refundService.verifyWebhookSignature(
      rawBody,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      console.error("❌ Invalid webhook signature");
      return res.status(400).json({ error: "Invalid signature" });
    }

    // Parse the event
    const event = typeof req.body === 'object' ? req.body : JSON.parse(rawBody.toString());

    // Process the webhook event
    await refundService.handleWebhookEvent(event);

    console.log("✅ Webhook processed successfully");

    res.status(200).json({ success: true });

  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

// Get refund statistics (admin/manager only)
router.get("/admin/stats", verifyToken, isAdminOrManager, async (req, res) => {
  try {
    const stats = await Refund.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$refundAmount" },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      cancelled: 0,
      totalRefundAmount: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      result[stat._id] = stat.count;
      if (stat._id === "processed") {
        result.totalRefundAmount += stat.totalAmount;
      }
    });

    // Get recent refunds
    const recentRefunds = await Refund.find()
      .populate("ticket", "ticketId eventName")
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      stats: result,
      recentRefunds: recentRefunds.map(refund => refund.getSafeRefundData()),
    });

  } catch (error) {
    console.error("Get refund stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch refund statistics",
    });
  }
});

module.exports = router;