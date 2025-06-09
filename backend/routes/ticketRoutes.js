const express = require('express');
const router = express.Router();
const Ticket = require('../models/Tickets');
const User = require('../models/User');
const verifyToken = require('../middlewares/authMiddleware');

// Create a ticket (protected route)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { price = 399 } = req.body; // Default price for Garba event
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user already has a ticket (if you want to limit to one ticket per user)
    const existingTicket = await Ticket.findOne({ 
      user: user._id, 
      status: { $in: ['active', 'used'] } 
    });

    if (existingTicket) {
      return res.status(400).json({ 
        error: "You already have a ticket for this event",
        ticket: existingTicket
      });
    }

    // Create new ticket
    const ticket = await Ticket.create({ 
      user: user._id, 
      price: price 
    });

    // Populate user details for response
    await ticket.populate('user', 'name email ');

    res.status(201).json({
      success: true,
      message: "Ticket booked successfully!",
      ticket: {
        id: ticket._id,
        eventName: ticket.eventName,
        price: ticket.price,
        status: ticket.status,
        createdAt: ticket.createdAt,
        user: {
          name: ticket.user.name,
          email: ticket.user.email
        }
      }
    });

  } catch (error) {
    console.error("Ticket creation error:", error);
    res.status(500).json({ 
      error: "Failed to book ticket",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user's tickets (protected route)
router.get('/my-tickets', verifyToken, async (req, res) => {
  try {
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get all tickets for this user
    const tickets = await Ticket.find({ user: user._id })
      .populate('user', 'name email ')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets: tickets.map(ticket => ({
        id: ticket._id,
        eventName: ticket.eventName,
        price: ticket.price,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt
      }))
    });

  } catch (error) {
    console.error("Fetch tickets error:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// Get specific ticket by ID (protected route)
router.get('/:ticketId', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find ticket and ensure it belongs to the requesting user
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      user: user._id 
    }).populate('user', 'name email ');

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.status(200).json({
      success: true,
      ticket: {
        id: ticket._id,
        eventName: ticket.eventName,
        price: ticket.price,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        user: {
          name: ticket.user.name,
          email: ticket.user.email
        }
      }
    });

  } catch (error) {
    console.error("Fetch ticket error:", error);
    res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

// Cancel ticket (protected route)
router.patch('/:ticketId/cancel', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find ticket and ensure it belongs to the requesting user
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      user: user._id,
      status: 'active' // Only active tickets can be cancelled
    });

    if (!ticket) {
      return res.status(404).json({ 
        error: "Active ticket not found or already cancelled" 
      });
    }

    // Update ticket status
    ticket.status = 'cancelled';
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully",
      ticket: {
        id: ticket._id,
        eventName: ticket.eventName,
        status: ticket.status,
        updatedAt: ticket.updatedAt
      }
    });

  } catch (error) {
    console.error("Cancel ticket error:", error);
    res.status(500).json({ error: "Failed to cancel ticket" });
  }
});

// Admin routes (for managing all tickets)
const { isAdmin, isManager } = require('../middlewares/roleMiddleware');

// Get all tickets (Admin/Manager only)
router.get('/admin/all', verifyToken, isManager, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    let query = {};
    if (status) {
      query.status = status;
    }

    const tickets = await Ticket.find(query)
      .populate('user', 'name email ')
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
      tickets
    });

  } catch (error) {
    console.error("Admin fetch tickets error:", error);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// Update ticket status (Admin only)
router.patch('/admin/:ticketId/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['active', 'used', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    ).populate('user', 'name email ');

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket
    });

  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({ error: "Failed to update ticket status" });
  }
});

module.exports = router;