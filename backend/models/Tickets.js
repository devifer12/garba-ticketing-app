const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const ticketSchema = new mongoose.Schema(
  {
    // Unique ticket identifier
    ticketId: {
      type: String,
      unique: true,
      default: () =>
        `GARBA-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      required: true,
    },

    // QR Code data
    qrCode: {
      type: String,
      required: true,
      unique: true,
    },

    // QR Code data URL (base64 image)
    qrCodeImage: {
      type: String,
      required: true,
    },

    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Event details
    eventName: {
      type: String,
      default: "Garba Rass 2025",
    },

    // Ticket details
    price: {
      type: Number,
      required: true,
    },

    // Ticket status
    status: {
      type: String,
      enum: ["active", "used", "cancelled"],
      default: "active",
    },

    // Entry tracking
    entryTime: {
      type: Date,
      default: null,
    },

    // QR scan tracking
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    scannedAt: {
      type: Date,
      default: null,
    },

    // Cancellation tracking
    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      default: null,
    },

    isRefundDone: {
      type: Boolean,
      default: null,
    },

    // Payment information
    paymentId: {
      type: String,
      default: null,
    },

    merchantOrderId: {
      type: String,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      default: "phonepe",
    },

    transactionId: {
      type: String,
      default: null,
    },

    // Additional metadata
    metadata: {
      purchaseMethod: {
        type: String,
        default: "online",
      },
      deviceInfo: {
        type: String,
        default: "",
      },
      ipAddress: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual for formatted ticket ID
ticketSchema.virtual("formattedTicketId").get(function () {
  return this.ticketId;
});

// Virtual for QR scan status
ticketSchema.virtual("isScanned").get(function () {
  return !!this.scannedAt;
});

// Virtual for entry status
ticketSchema.virtual("hasEntered").get(function () {
  return !!this.entryTime;
});

// Virtual for cancellation status
ticketSchema.virtual("isCancelled").get(function () {
  return this.status === "cancelled";
});

// Virtual for ticket age
ticketSchema.virtual("ticketAge").get(function () {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
  return diffInHours;
});

// Static method to generate unique QR code data
ticketSchema.statics.generateQRCode = function () {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 12).toUpperCase();
  const uuid = uuidv4().replace(/-/g, "").substr(0, 8).toUpperCase();

  return `GARBA2025-${timestamp}-${randomString}-${uuid}`;
};

// Static method to validate QR code format
ticketSchema.statics.isValidQRCode = function (qrCode) {
  if (!qrCode || typeof qrCode !== "string") {
    console.log("❌ QR Code validation failed: Invalid input type");
    return false;
  }

  // More flexible pattern matching
  const patterns = [
    /^GARBA2025-\d{13}-[A-Z0-9]{12}-[A-Z0-9]{8}$/, // Standard format
    /^GARBA-\d{13}-[A-Z0-9]{9}$/, // Alternative format from ticketId
    /^GARBA2025-.*$/, // Fallback for any GARBA2025 prefix
  ];

  const isValid = patterns.some((pattern) => pattern.test(qrCode));

  if (process.env.NODE_ENV === "development") {
    console.log("🔍 QR Code validation:", {
      qrCode: qrCode.substring(0, 20) + "...",
      isValid,
      length: qrCode.length,
    });
  }

  return isValid;
};

// Instance method to mark ticket as used
ticketSchema.methods.markAsUsed = async function (scannedByUserId = null) {
  this.status = "used";
  this.entryTime = new Date();
  this.scannedAt = new Date();
  if (scannedByUserId) {
    this.scannedBy = scannedByUserId;
  }
  return await this.save();
};

// Instance method to cancel ticket
ticketSchema.methods.cancelTicket = async function (reason = null) {
  this.status = "cancelled";
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.isRefundDone = null; // Set to null initially
  return await this.save();
};

// Instance method to get safe ticket data (for API responses)
ticketSchema.methods.getSafeTicketData = function () {
  return {
    id: this._id,
    ticketId: this.ticketId,
    qrCode: this.qrCode,
    qrCodeImage: this.qrCodeImage,
    eventName: this.eventName,
    price: this.price,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    entryTime: this.entryTime,
    scannedAt: this.scannedAt,
    isScanned: this.isScanned,
    hasEntered: this.hasEntered,
    ticketAge: this.ticketAge,
    cancelledAt: this.cancelledAt,
    cancellationReason: this.cancellationReason,
    isRefundDone: this.isRefundDone,
    isCancelled: this.isCancelled,
    user: {
      name: this.user?.name,
      email: this.user?.email,
    },
  };
};

// Pre-save middleware to ensure QR code uniqueness
ticketSchema.pre("save", async function (next) {
  if (this.isNew && !this.qrCode) {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const qrCode = this.constructor.generateQRCode();
      const existingTicket = await this.constructor.findOne({ qrCode });

      if (!existingTicket) {
        this.qrCode = qrCode;
        if (process.env.NODE_ENV === "development") {
          console.log(
            "✅ Generated unique QR code:",
            qrCode.substring(0, 20) + "...",
          );
        }
        break;
      }

      attempts++;
      if (process.env.NODE_ENV === "development") {
        console.log(`⚠️ QR code collision, attempt ${attempts}/${maxAttempts}`);
      }
    }

    if (!this.qrCode) {
      return next(
        new Error("Failed to generate unique QR code after multiple attempts"),
      );
    }
  }

  next();
});

// Static method to find ticket by QR code
ticketSchema.statics.findByQRCode = async function (qrCode) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      "🔍 Searching for ticket with QR code:",
      qrCode ? qrCode.substring(0, 20) + "..." : "null",
    );
  }

  if (!qrCode) {
    return null;
  }

  try {
    // Try exact match first
    let ticket = await this.findOne({ qrCode: qrCode }).populate(
      "user",
      "name email role",
    );

    if (ticket) {
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Found ticket by exact QR match");
      }
      return ticket;
    }

    // If no exact match, try case-insensitive search
    ticket = await this.findOne({
      qrCode: {
        $regex: `^${qrCode.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        $options: "i",
      },
    }).populate("user", "name email role");

    if (ticket) {
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Found ticket by case-insensitive QR match");
      }
      return ticket;
    }

    return null;
  } catch (error) {
    console.error(
      "Error searching for ticket by QR code:",
      process.env.NODE_ENV === "development" ? error : error.message,
    );
    throw error;
  }
};

// Static method to get user's active tickets
ticketSchema.statics.getUserActiveTickets = async function (userId) {
  return await this.find({
    user: userId,
    status: { $in: ["active", "used"] },
  }).sort({ createdAt: -1 });
};

// Static method to get ticket statistics
ticketSchema.statics.getTicketStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$price" },
      },
    },
  ]);

  const result = {
    total: 0,
    active: 0,
    used: 0,
    cancelled: 0,
    totalRevenue: 0,
  };

  stats.forEach((stat) => {
    result.total += stat.count;
    result[stat._id] = stat.count;
    // Only count revenue from active and used tickets
    if (stat._id === "active" || stat._id === "used") {
      result.totalRevenue += stat.totalRevenue;
    }
  });

  return result;
};

module.exports = mongoose.model("Ticket", ticketSchema);