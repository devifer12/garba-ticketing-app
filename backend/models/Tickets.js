const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',  // Links to the User model
    required: true 
  },
  eventName: { 
    type: String, 
    default: "Garba Night 2025" 
  },
  price: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'used', 'cancelled'], 
    default: 'active' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);