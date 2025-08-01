const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    // Reference to the original ticket
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },

    // Reference to the user who requested refund
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Refund identification
    refundId: {
      type: String,
      unique: true,
      required: true,
      default: () => `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    },

    // Original payment details
    originalPaymentId: {
      type: String,
      required: true,
    },

    originalOrderId: {
      type: String,
      required: true,
    },

    originalAmount: {
      type: Number,
      required: true,
    },

    // Refund details
    refundAmount: {
      type: Number,
      required: true,
    },

    processingFee: {
      type: Number,
      default: 40, // ₹40 processing fee
    },

    // Razorpay refund details
    razorpayRefundId: {
      type: String,
      default: null,
    },

    // Refund status tracking
    status: {
      type: String,
      enum: [
        "pending",      // Refund request created
        "processing",   // Refund initiated with Razorpay
        "processed",    // Refund completed by Razorpay
        "failed",       // Refund failed
        "cancelled",    // Refund request cancelled
      ],
      default: "pending",
    },

    // Refund reason
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },

    // Status tracking timestamps
    statusHistory: [{
      status: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        default: "",
      },
    }],

    // Webhook tracking
    webhookEvents: [{
      eventType: String,
      eventId: String,
      timestamp: Date,
      data: mongoose.Schema.Types.Mixed,
    }],

    // Processing details
    processedAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    // Metadata
    metadata: {
      requestedBy: {
        type: String,
        default: "user", // "user" or "admin"
      },
      ipAddress: String,
      userAgent: String,
      refundMethod: {
        type: String,
        default: "razorpay",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for refund age
refundSchema.virtual("refundAge").get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
  return diffInHours;
});

// Virtual for processing time
refundSchema.virtual("processingTime").get(function () {
  if (!this.processedAt) return null;
  const processed = new Date(this.processedAt);
  const created = new Date(this.createdAt);
  const diffInHours = Math.floor((processed - created) / (1000 * 60 * 60));
  return diffInHours;
});

// Pre-save middleware to update status history
refundSchema.pre("save", function (next) {
  // If status changed, add to history
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: this.failureReason || "",
    });
  }

  // Set processedAt when status becomes processed
  if (this.status === "processed" && !this.processedAt) {
    this.processedAt = new Date();
  }

  next();
});

// Static method to create refund request
refundSchema.statics.createRefundRequest = async function (ticketData, userData, reason) {
  const refundAmount = Math.max(1, ticketData.price - 40); // Minimum ₹1 after processing fee

  const refund = new this({
    ticket: ticketData._id,
    user: userData._id,
    originalPaymentId: ticketData.paymentId,
    originalOrderId: ticketData.orderId,
    originalAmount: ticketData.price,
    refundAmount: refundAmount,
    reason: reason,
    status: "pending",
    metadata: {
      requestedBy: "user",
      refundMethod: "razorpay",
    },
  });

  return await refund.save();
};

// Instance method to update status
refundSchema.methods.updateStatus = async function (newStatus, notes = "") {
  this.status = newStatus;
  if (notes) {
    this.failureReason = notes;
  }
  return await this.save();
};

// Instance method to add webhook event
refundSchema.methods.addWebhookEvent = async function (eventType, eventId, data) {
  this.webhookEvents.push({
    eventType,
    eventId,
    timestamp: new Date(),
    data,
  });
  return await this.save();
};

// Static method to find refund by Razorpay refund ID
refundSchema.statics.findByRazorpayRefundId = async function (razorpayRefundId) {
  return await this.findOne({ razorpayRefundId }).populate("ticket user");
};

// Instance method to get safe refund data
refundSchema.methods.getSafeRefundData = function () {
  return {
    id: this._id,
    refundId: this.refundId,
    status: this.status,
    originalAmount: this.originalAmount,
    refundAmount: this.refundAmount,
    processingFee: this.processingFee,
    reason: this.reason,
    createdAt: this.createdAt,
    processedAt: this.processedAt,
    refundAge: this.refundAge,
    processingTime: this.processingTime,
    statusHistory: this.statusHistory,
    ticket: {
      ticketId: this.ticket?.ticketId,
      eventName: this.ticket?.eventName,
    },
    user: {
      name: this.user?.name,
      email: this.user?.email,
    },
  };
};

module.exports = mongoose.model("Refund", refundSchema);