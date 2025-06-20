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
        // Allow dates from today onwards (not strictly future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(value) >= today;
      },
      message: 'Event date must be today or in the future'
    }
  },
  
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true,
    validate: {
      validator: function(value) {
        // More flexible time format validation
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(value);
      },
      message: 'Start time must be in format "HH:MM" (e.g., "18:00" or "6:00")'
    }
  },
  
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true,
    validate: {
      validator: function(value) {
        // More flexible time format validation
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(value);
      },
      message: 'End time must be in format "HH:MM" (e.g., "22:00" or "10:00")'
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
  
  soldTickets: {
    type: Number,
    default: 0,
    min: [0, 'Sold tickets cannot be negative'],
    validate: {
      validator: function(value) {
        return value <= this.totalTickets;
      },
      message: 'Sold tickets cannot exceed total tickets'
    }
  },
  
  eventImage: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(value) {
        if (!value || value === '') return true; // Optional field
        const fileRegex = /\.(jpg|jpeg|png|gif|webp)$/i;
        return fileRegex.test(value);
      },
      message: 'Event image must be a valid image format (jpg, jpeg, png, gif, webp)'
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

// Pre-save middleware to update the updatedAt field and prevent multiple events
eventSchema.pre('save', async function(next) {
  // Update timestamp
  if (!this.isNew) {
    this.updatedAt = new Date();
  }
  
  // Prevent creating multiple events
  if (this.isNew) {
    const existingEvent = await this.constructor.findOne();
    if (existingEvent) {
      const error = new Error('Only one event can exist in the system');
      return next(error);
    }
  }
  
  next();
});

// Pre-update middleware to update the updatedAt field
eventSchema.pre(['findOneAndUpdate', 'updateOne'], function(next) {
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

// Virtual field to get available tickets (calculated)
eventSchema.virtual('availableTickets').get(function() {
  return Math.max(0, this.totalTickets - this.soldTickets);
});

// Virtual field to check if event is sold out
eventSchema.virtual('isSoldOut').get(function() {
  return this.soldTickets >= this.totalTickets;
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

// Static method to get the current event
eventSchema.statics.getCurrentEvent = async function() {
  return await this.findOne().populate('createdBy', 'name email');
};

// Instance method to sell tickets
eventSchema.methods.sellTickets = async function(quantity) {
  if (quantity <= 0) {
    throw new Error('Quantity must be greater than 0');
  }
  
  if (this.soldTickets + quantity > this.totalTickets) {
    throw new Error(`Not enough tickets available. Only ${this.totalTickets - this.soldTickets} tickets remaining`);
  }
  
  this.soldTickets += quantity;
  return await this.save();
};

// Instance method to check if user can purchase tickets
eventSchema.methods.canPurchaseTickets = function(quantity = 1) {
  return this.isUpcoming && (this.soldTickets + quantity <= this.totalTickets);
};

// Instance method to get ticket availability info
eventSchema.methods.getTicketAvailability = function() {
  return {
    totalTickets: this.totalTickets,
    soldTickets: this.soldTickets,
    availableTickets: this.totalTickets - this.soldTickets,
    isSoldOut: this.soldTickets >= this.totalTickets,
    soldPercentage: Math.round((this.soldTickets / this.totalTickets) * 100)
  };
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;