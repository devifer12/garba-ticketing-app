const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const Ticket = require('../models/Tickets');
const User = require('../models/User');
const Event = require('../models/Event');
const verifyToken = require('../middlewares/authMiddleware');

// Helper function to generate QR code image
const generateQRCodeImage = async (qrData) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    return qrCodeDataURL;
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code image');
  }
};

// Create a ticket (protected route)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { quantity = 1, eventId } = req.body;
    
    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({ 
        success: false,
        error: "Quantity must be between 1 and 10 tickets" 
      });
    }
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    // Get event details (assuming single event for now)
    const event = await Event.findOne();
    if (!event) {
      return res.status(404).json({ 
        success: false,
        error: "Event not found" 
      });
    }

    // Check if enough tickets are available
    if (event.availableTickets < quantity) {
      return res.status(400).json({ 
        success: false,
        error: `Only ${event.availableTickets} tickets available` 
      });
    }

    // Check if user already has active tickets (optional limit)
    const existingActiveTickets = await Ticket.countDocuments({ 
      user: user._id, 
      status: { $in: ['active', 'used'] } 
    });

    const maxTicketsPerUser = 5; // Configurable limit
    if (existingActiveTickets + quantity > maxTicketsPerUser) {
      return res.status(400).json({ 
        success: false,
        error: `Maximum ${maxTicketsPerUser} tickets allowed per user. You currently have ${existingActiveTickets} tickets.` 
      });
    }

    // Create tickets array
    const tickets = [];
    const ticketCreationPromises = [];

    for (let i = 0; i < quantity; i++) {
      const ticketPromise = (async () => {
        // Generate unique QR code
        const qrCode = Ticket.generateQRCode();
        
        // Generate QR code image
        const qrCodeImage = await generateQRCodeImage(qrCode);
        
        // Create ticket
        const ticket = new Ticket({
          user: user._id,
          eventName: event.name,
          price: event.ticketPrice,
          qrCode: qrCode,
          qrCodeImage: qrCodeImage,
          metadata: {
            purchaseMethod: 'online',
            deviceInfo: req.headers['user-agent'] || '',
            ipAddress: req.ip || req.connection.remoteAddress || ''
          }
        });

        const savedTicket = await ticket.save();
        await savedTicket.populate('user', 'name email');
        
        return savedTicket;
      })();
      
      ticketCreationPromises.push(ticketPromise);
    }

    // Wait for all tickets to be created
    const createdTickets = await Promise.all(ticketCreationPromises);

    // Update event available tickets
    event.availableTickets -= quantity;
    await event.save();

    // Prepare response data
    const responseTickets = createdTickets.map(ticket => ({
      id: ticket._id,
      ticketId: ticket.ticketId,
      qrCode: ticket.qrCode,
      qrCodeImage: ticket.qrCodeImage,
      eventName: ticket.eventName,
      price: ticket.price,
      status: ticket.status,
      createdAt: ticket.createdAt,
      user: {
        name: ticket.user.name,
        email: ticket.user.email
      }
    }));

    res.status(201).json({
      success: true,
      message: `${quantity} ticket(s) booked successfully!`,
      tickets: responseTickets,
      totalAmount: event.ticketPrice * quantity,
      event: {
        name: event.name,
        date: event.date,
        venue: event.venue,
        availableTickets: event.availableTickets
      }
    });

  } catch (error) {
    console.error("Ticket creation error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to book ticket(s)",
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
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    // Get all tickets for this user
    const tickets = await Ticket.find({ user: user._id })
      .populate('user', 'name email')
      .populate('scannedBy', 'name email')
      .sort({ createdAt: -1 });

    const responseTickets = tickets.map(ticket => ({
      id: ticket._id,
      ticketId: ticket.ticketId,
      qrCode: ticket.qrCode,
      qrCodeImage: ticket.qrCodeImage,
      eventName: ticket.eventName,
      price: ticket.price,
      status: ticket.status,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      entryTime: ticket.entryTime,
      scannedAt: ticket.scannedAt,
      isScanned: ticket.isScanned,
      hasEntered: ticket.hasEntered,
      scannedBy: ticket.scannedBy ? {
        name: ticket.scannedBy.name,
        email: ticket.scannedBy.email
      } : null
    }));

    res.status(200).json({
      success: true,
      count: tickets.length,
      tickets: responseTickets
    });

  } catch (error) {
    console.error("Fetch tickets error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch tickets" 
    });
  }
});

// Get specific ticket by ID (protected route)
router.get('/:ticketId', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    // Find ticket and ensure it belongs to the requesting user
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      user: user._id 
    })
    .populate('user', 'name email')
    .populate('scannedBy', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        error: "Ticket not found" 
      });
    }

    res.status(200).json({
      success: true,
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        qrCode: ticket.qrCode,
        qrCodeImage: ticket.qrCodeImage,
        eventName: ticket.eventName,
        price: ticket.price,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        entryTime: ticket.entryTime,
        scannedAt: ticket.scannedAt,
        isScanned: ticket.isScanned,
        hasEntered: ticket.hasEntered,
        user: {
          name: ticket.user.name,
          email: ticket.user.email
        },
        scannedBy: ticket.scannedBy ? {
          name: ticket.scannedBy.name,
          email: ticket.scannedBy.email
        } : null
      }
    });

  } catch (error) {
    console.error("Fetch ticket error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch ticket" 
    });
  }
});

// Cancel ticket (protected route)
router.patch('/:ticketId/cancel', verifyToken, async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    // Find user by Firebase UID
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: "User not found" 
      });
    }

    // Find ticket and ensure it belongs to the requesting user
    const ticket = await Ticket.findOne({ 
      _id: ticketId, 
      user: user._id,
      status: 'active' // Only active tickets can be cancelled
    });

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        error: "Active ticket not found or already cancelled" 
      });
    }

    // Cancel the ticket
    await ticket.cancelTicket();

    // Update event available tickets
    const event = await Event.findOne();
    if (event) {
      event.availableTickets += 1;
      await event.save();
    }

    res.status(200).json({
      success: true,
      message: "Ticket cancelled successfully",
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        updatedAt: ticket.updatedAt
      }
    });

  } catch (error) {
    console.error("Cancel ticket error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to cancel ticket" 
    });
  }
});

// QR Code verification endpoint (for checkers)
router.post('/verify-qr', verifyToken, async (req, res) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({ 
        success: false,
        error: "QR code is required" 
      });
    }

    // Validate QR code format
    if (!Ticket.isValidQRCode(qrCode)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid QR code format" 
      });
    }

    // Find ticket by QR code
    const ticket = await Ticket.findByQRCode(qrCode);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        error: "Ticket not found" 
      });
    }

    // Check ticket status
    if (ticket.status === 'cancelled') {
      return res.status(400).json({ 
        success: false,
        error: "This ticket has been cancelled" 
      });
    }

    if (ticket.status === 'used') {
      return res.status(400).json({ 
        success: false,
        error: "This ticket has already been used",
        ticket: {
          ticketId: ticket.ticketId,
          usedAt: ticket.entryTime,
          scannedAt: ticket.scannedAt
        }
      });
    }

    // Return ticket information for verification
    res.status(200).json({
      success: true,
      message: "Valid ticket found",
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        eventName: ticket.eventName,
        status: ticket.status,
        user: {
          name: ticket.user.name,
          email: ticket.user.email
        },
        createdAt: ticket.createdAt,
        isScanned: ticket.isScanned,
        hasEntered: ticket.hasEntered
      }
    });

  } catch (error) {
    console.error("QR verification error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to verify QR code" 
    });
  }
});

// Mark ticket as used (for checkers)
router.post('/mark-used', verifyToken, async (req, res) => {
  try {
    const { qrCode } = req.body;
    
    if (!qrCode) {
      return res.status(400).json({ 
        success: false,
        error: "QR code is required" 
      });
    }

    // Find checker user
    const checker = await User.findOne({ firebaseUID: req.user.uid });
    if (!checker) {
      return res.status(404).json({ 
        success: false,
        error: "Checker not found" 
      });
    }

    // Check if user has permission to mark tickets as used
    if (!['admin', 'qrchecker', 'manager'].includes(checker.role)) {
      return res.status(403).json({ 
        success: false,
        error: "Insufficient permissions to mark tickets as used" 
      });
    }

    // Find ticket by QR code
    const ticket = await Ticket.findByQRCode(qrCode);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        error: "Ticket not found" 
      });
    }

    // Check if ticket is already used
    if (ticket.status === 'used') {
      return res.status(400).json({ 
        success: false,
        error: "Ticket has already been used",
        ticket: {
          ticketId: ticket.ticketId,
          usedAt: ticket.entryTime,
          scannedBy: ticket.scannedBy
        }
      });
    }

    // Check if ticket is cancelled
    if (ticket.status === 'cancelled') {
      return res.status(400).json({ 
        success: false,
        error: "Cannot use a cancelled ticket" 
      });
    }

    // Mark ticket as used
    await ticket.markAsUsed(checker._id);

    res.status(200).json({
      success: true,
      message: "Ticket marked as used successfully",
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        entryTime: ticket.entryTime,
        scannedAt: ticket.scannedAt,
        user: {
          name: ticket.user.name,
          email: ticket.user.email
        },
        scannedBy: {
          name: checker.name,
          email: checker.email
        }
      }
    });

  } catch (error) {
    console.error("Mark ticket as used error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to mark ticket as used" 
    });
  }
});

// Admin routes (for managing all tickets)
const { isAdmin, isManager } = require('../middlewares/roleMiddleware');

// Get all tickets (Admin/Manager only)
router.get('/admin/all', verifyToken, isManager, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    
    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    // Search by user name, email, or ticket ID
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.$or = [
        { user: { $in: users.map(u => u._id) } },
        { ticketId: { $regex: search, $options: 'i' } }
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('user', 'name email role')
      .populate('scannedBy', 'name email')
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
      tickets: tickets.map(ticket => ticket.getSafeTicketData())
    });

  } catch (error) {
    console.error("Admin fetch tickets error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch tickets" 
    });
  }
});

// Update ticket status (Admin only)
router.patch('/admin/:ticketId/status', verifyToken, isAdmin, async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['active', 'used', 'cancelled'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        error: "Invalid status" 
      });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    ).populate('user', 'name email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        error: "Ticket not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket status updated successfully",
      ticket: ticket.getSafeTicketData()
    });

  } catch (error) {
    console.error("Update ticket status error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to update ticket status" 
    });
  }
});

// Get ticket statistics
router.get('/admin/stats', verifyToken, isManager, async (req, res) => {
  try {
    const stats = await Ticket.getTicketStats();
    
    // Get recent bookings
    const recentBookings = await Ticket.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      ...stats,
      recentBookings: recentBookings.map(ticket => ticket.getSafeTicketData())
    });

  } catch (error) {
    console.error("Get ticket stats error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to fetch ticket statistics" 
    });
  }
});

module.exports = router;