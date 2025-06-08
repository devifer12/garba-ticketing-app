const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
    maxlength: [100, 'Event name cannot exceed 100 characters']
  },
  
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true,
    validate: {
      validator: function(value) {
        // Validate time format (e.g., "6:00 PM", "18:00")
        const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
        return timeRegex.test(value);
      },
      message: 'Start time must be in format "HH:MM AM/PM" (e.g., "6:00 PM")'
    }
  },
  
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true,
    validate: {
      validator: function(value) {
        // Validate time format (e.g., "10:00 PM", "22:00")
        const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s?(AM|PM)$/i;
        return timeRegex.test(value);
      },
      message: 'End time must be in format "HH:MM AM/PM" (e.g., "10:00 PM")'
    }
  },
  
  venue: {
    type: String,
    required: [true, 'Event venue is required'],
    trim: true,
    maxlength: [200, 'Venue name cannot exceed 200 characters']
  },
  
  ticketPrice: {
    type: Number,
    required: [true, 'Ticket price is required'],
    min: [0, 'Ticket price cannot be negative'],
    max: [50000, 'Ticket price cannot exceed ₹50,000']
  },
  
  totalTickets: {
    type: Number,
    required: [true, 'Total tickets count is required'],
    min: [1, 'Total tickets must be at least 1'],
    max: [10000, 'Total tickets cannot exceed 10,000']
  },
  
  availableTickets: {
    type: Number,
    default: function() {
      return this.totalTickets;
    },
    min: [0, 'Available tickets cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.totalTickets;
      },
      message: 'Available tickets cannot exceed total tickets'
    }
  },
  
  eventImage: {
    type: String,
    trim: true,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
        return urlRegex.test(value);
      },
      message: 'Event image must be a valid image URL (jpg, jpeg, png, gif, webp)'
    }
  },
  
  features: {
    type: [String],
    default: [],
    validate: {
      validator: function(array) {
        return array.length <= 10;
      },
      message: 'Cannot have more than 10 features'
    }
  },
  
  aboutText: {
    type: String,
    trim: true,
    maxlength: [2000, 'About text cannot exceed 2000 characters'],
    default: ''
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Event creator is required']
  }
});

// Pre-save middleware to update the updatedAt field
eventSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  next();
});

// Pre-update middleware to update the updatedAt field
eventSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Virtual field to get formatted date
eventSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual field to get time range
eventSchema.virtual('timeRange').get(function() {
  return `${this.startTime} - ${this.endTime}`;
});

// Virtual field to get sold tickets count
eventSchema.virtual('soldTickets').get(function() {
  return this.totalTickets - this.availableTickets;
});

// Virtual field to check if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.availableTickets === 0;
});

// Virtual field to check if event is today
eventSchema.virtual('isToday').get(function() {
  const today = new Date();
  const eventDate = new Date(this.date);
  return today.toDateString() === eventDate.toDateString();
});

// Virtual field to check if event is upcoming
eventSchema.virtual('isUpcoming').get(function() {
  return this.date > new Date();
});

// Ensure virtual fields are serialized
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Index for better query performance
eventSchema.index({ isActive: 1, date: 1 });
eventSchema.index({ createdBy: 1 });
eventSchema.index({ date: 1 });

// Static method to get current active event
eventSchema.statics.getCurrentActiveEvent = async function() {
  return await this.findOne({
    isActive: true,
    date: { $gte: new Date() }
  }).sort({ date: 1 }).populate('createdBy', 'name email');
};

// Static method to get all active events
eventSchema.statics.getActiveEvents = async function() {
  return await this.find({
    isActive: true,
    date: { $gte: new Date() }
  }).sort({ date: 1 }).populate('createdBy', 'name email');
};

// Instance method to update available tickets
eventSchema.methods.updateAvailableTickets = async function(ticketsSold) {
  if (ticketsSold > this.availableTickets) {
    throw new Error('Not enough tickets available');
  }
  
  this.availableTickets -= ticketsSold;
  return await this.save();
};

// Instance method to check if user can purchase tickets
eventSchema.methods.canPurchaseTickets = function(quantity = 1) {
  return this.isActive && 
         this.isUpcoming && 
         this.availableTickets >= quantity;
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;