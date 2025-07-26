const mongoose = require("mongoose");

const paymentOrderSchema = new mongoose.Schema(
  {
    merchantOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    pricePerTicket: {
      type: Number,
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    status: {
      type: String,
      enum: ["initiated", "completed", "failed", "cancelled"],
      default: "initiated",
    },
    paymentMethod: {
      type: String,
      default: "phonepe",
    },
    transactionId: {
      type: String,
      default: null,
    },
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
  },
);

module.exports = mongoose.model("PaymentOrder", paymentOrderSchema);
