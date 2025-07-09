const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Event name is required"],
    trim: true,
    maxlength: [100, "Event name cannot exceed 100 characters"],
  },

  description: {
    type: String,
    required: [true, "Event description is required"],
    trim: true,
    maxlength: [1000, "Description cannot exceed 1000 characters"],
  },

  date: {
    type: Date,
    required: [true, "Event date is required"],
    validate: {
      validator: function (value) {
        // Allow dates from today onwards (not strictly future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(value) >= today;
      },
      message: "Event date must be today or in the future",
    },
  },

  startTime: {
    type: String,
    required: [true, "Start time is required"],
    trim: true,
    validate: {
      validator: function (value) {
        // More flexible time format validation
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(value);
      },
      message: 'Start time must be in format "HH:MM" (e.g., "18:00" or "6:00")',
    },
  },

  endTime: {
    type: String,
    required: [true, "End time is required"],
    trim: true,
    validate: {
      validator: function (value) {
        // More flexible time format validation
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(value);
      },
      message: 'End time must be in format "HH:MM" (e.g., "22:00" or "10:00")',
    },
  },

  venue: {
    type: String,
    required: [true, "Event venue is required"],
    trim: true,
    maxlength: [200, "Venue name cannot exceed 200 characters"],
  },

  ticketPrice: {
    type: Number,
    required: [true, "Ticket price is required"],
    min: [0, "Ticket price cannot be negative"],
    max: [50000, "Ticket price cannot exceed ₹50,000"],
  },

  groupPrice6: {
    type: Number,
    required: [true, "Group price for 6+ tickets is required"],
    min: [0, "Group price cannot be negative"],
    max: [50000, "Group price cannot exceed ₹50,000"],
  },

  totalTickets: {
    type: Number,
    required: [true, "Total tickets count is required"],
    min: [1, "Total tickets must be at least 1"],
    max: [10000, "Total tickets cannot exceed 10,000"],
  },

  eventImage: {
    type: String,
    trim: true,
    default: "",
    validate: {
      validator: function (value) {
        if (!value || value === "") return true; // Optional field
        // Check if it's a valid base64 image data URL
        const base64ImageRegex =
          /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
        return base64ImageRegex.test(value);
      },
      message:
        "Event image must be a valid base64 image data URL (JPEG, PNG, GIF, or WebP)",
    },
  },

  features: {
    type: [String],
    default: [],
    validate: {
      validator: function (array) {
        return array.length <= 10;
      },
      message: "Cannot have more than 10 features",
    },
  },

  aboutText: {
    type: String,
    trim: true,
    maxlength: [2000, "About text cannot exceed 2000 characters"],
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Event creator is required"],
  },
});

// Pre-save middleware to update the updatedAt field and prevent multiple events
eventSchema.pre("save", async function (next) {
  // Update timestamp
  if (!this.isNew) {
    this.updatedAt = new Date();
  }

  // Prevent creating multiple events
  if (this.isNew) {
    const existingEvent = await this.constructor.findOne();
    if (existingEvent) {
      const error = new Error("Only one event can exist in the system");
      return next(error);
    }
  }

  next();
});

// Pre-update middleware to update the updatedAt field
eventSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual field to get formatted date
eventSchema.virtual("formattedDate").get(function () {
  return this.date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

// Virtual field to get time range
eventSchema.virtual("timeRange").get(function () {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual field to get sold tickets count (calculated from actual tickets)
eventSchema.virtual("soldTickets").get(function () {
  // This will be populated by the static method when needed
  return this._soldTickets || 0;
});

// Virtual field to get available tickets (calculated)
eventSchema.virtual("availableTickets").get(function () {
  const sold = this._soldTickets || 0;
  return Math.max(0, this.totalTickets - sold);
});

// Virtual field to check if event is sold out
eventSchema.virtual("isSoldOut").get(function () {
  const sold = this._soldTickets || 0;
  return sold >= this.totalTickets;
});

// Virtual field to check if event is today
eventSchema.virtual("isToday").get(function () {
  const today = new Date();
  const eventDate = new Date(this.date);
  return today.toDateString() === eventDate.toDateString();
});

// Virtual field to check if event is upcoming
eventSchema.virtual("isUpcoming").get(function () {
  return this.date > new Date();
});

// Ensure virtual fields are serialized
eventSchema.set("toJSON", { virtuals: true });
eventSchema.set("toObject", { virtuals: true });

// Static method to get the current event with proper ticket counts (optimized)
eventSchema.statics.getCurrentEvent = async function () {
  const [event, soldTicketsCount] = await Promise.all([
    this.findOne().populate("createdBy", "name email").lean(), // Use lean for better performance
    this.model("Ticket").countDocuments({
      status: { $in: ["active", "used"] },
    }),
  ]);

  if (event) {
    // Set the sold tickets count for virtual calculations
    event._soldTickets = soldTicketsCount;
    // Calculate derived fields
    event.soldTickets = soldTicketsCount;
    event.availableTickets = Math.max(0, event.totalTickets - soldTicketsCount);
    event.isSoldOut = soldTicketsCount >= event.totalTickets;
  }
  return event;
};

// Static method to get event with ticket counts (optimized)
eventSchema.statics.getEventWithTicketCounts = async function () {
  const [event, soldTicketsCount] = await Promise.all([
    this.findOne().lean(),
    this.model("Ticket").countDocuments({
      status: { $in: ["active", "used"] },
    }),
  ]);

  if (event) {
    // Set the sold tickets count for virtual calculations
    event._soldTickets = soldTicketsCount;
    event.soldTickets = soldTicketsCount;
    event.availableTickets = Math.max(0, event.totalTickets - soldTicketsCount);
    event.isSoldOut = soldTicketsCount >= event.totalTickets;
  }
  return event;
};

// Instance method to check available tickets
eventSchema.methods.getAvailableTicketsCount = async function () {
  const Ticket = require("./Tickets");
  const soldTicketsCount = await Ticket.countDocuments({
    status: { $in: ["active", "used"] },
  });

  return Math.max(0, this.totalTickets - soldTicketsCount);
};

// Instance method to check if user can purchase tickets
eventSchema.methods.canPurchaseTickets = async function (quantity = 1) {
  if (!this.isUpcoming) return false;

  const availableTickets = await this.getAvailableTicketsCount();
  return availableTickets >= quantity;
};

// Instance method to get ticket availability info
eventSchema.methods.getTicketAvailability = async function () {
  const Ticket = require("./Tickets");
  const soldTicketsCount = await Ticket.countDocuments({
    status: { $in: ["active", "used"] },
  });

  const availableTickets = Math.max(0, this.totalTickets - soldTicketsCount);

  return {
    totalTickets: this.totalTickets,
    soldTickets: soldTicketsCount,
    availableTickets: availableTickets,
    isSoldOut: soldTicketsCount >= this.totalTickets,
    soldPercentage: Math.round((soldTicketsCount / this.totalTickets) * 100),
  };
};

// Instance method to calculate price based on quantity
eventSchema.methods.calculatePrice = function (quantity) {
  if (quantity >= 6) {
    return this.groupPrice6;
  } else {
    return this.ticketPrice;
  }
};

// Instance method to calculate total amount
eventSchema.methods.calculateTotalAmount = function (quantity) {
  const pricePerTicket = this.calculatePrice(quantity);
  return pricePerTicket * quantity;
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;