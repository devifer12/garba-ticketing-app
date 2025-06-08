const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticateToken } = require('../middlewares/authMiddlewares');
const { requireRole } = require('../middlewares/roleMiddlewares');

// Input validation helpers
const validateEventInput = (req, res, next) => {
  const { name, description, date, startTime, endTime, venue, ticketPrice, totalTickets } = req.body;
  
  const errors = [];
  
  if (!name || name.trim().length === 0) {
    errors.push('Event name is required');
  }
  
  if (!description || description.trim().length === 0) {
    errors.push('Event description is required');
  }
  
  if (!date) {
    errors.push('Event date is required');
  } else {
    const eventDate = new Date(date);
    if (eventDate <= new Date()) {
      errors.push('Event date must be in the future');
    }
  }
  
  if (!startTime || !endTime) {
    errors.push('Start time and end time are required');
  }
  
  if (!venue || venue.trim().length === 0) {
    errors.push('Event venue is required');
  }
  
  if (ticketPrice === undefined || ticketPrice < 0) {
    errors.push('Valid ticket price is required');
  }
  
  if (!totalTickets || totalTickets < 1) {
    errors.push('Total tickets must be at least 1');
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }
  
  next();
};

// 1. GET /api/events/active - Get current active event (for home page display)
router.get('/active', async (req, res) => {
  try {
    const activeEvent = await Event.getCurrentActiveEvent();
    
    if (!activeEvent) {
      return res.status(404).json({
        success: false,
        message: 'No active event found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: activeEvent
    });
  } catch (error) {
    console.error('Error fetching active event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active event',
      error: error.message
    });
  }
});

// 2. GET /api/events - Get all active events
router.get('/', async (req, res) => {
  try {
    const activeEvents = await Event.getActiveEvents();
    
    res.status(200).json({
      success: true,
      count: activeEvents.length,
      data: activeEvents
    });
  } catch (error) {
    console.error('Error fetching active events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active events',
      error: error.message
    });
  }
});

// 3. GET /api/events/:id - Get specific event details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id).populate('createdBy', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: error.message
    });
  }
});

// 4. GET /api/events/admin/all - Get all events including inactive (admin/manager only)
router.get('/admin/all', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === 'true';
    }
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { venue: { $regex: req.query.search, $options: 'i' } }
      ];
    }
    
    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalEvents = await Event.countDocuments(filter);
    const totalPages = Math.ceil(totalEvents / limit);
    
    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        currentPage: page,
        totalPages,
        totalEvents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events',
      error: error.message
    });
  }
});

// 5. POST /api/events - Create new event (admin/manager only)
router.post('/', authenticateToken, requireRole(['admin', 'manager']), validateEventInput, async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      ticketPrice,
      totalTickets,
      availableTickets,
      eventImage,
      features,
      aboutText,
      isActive
    } = req.body;
    
    // Create new event
    const newEvent = new Event({
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      ticketPrice,
      totalTickets,
      availableTickets: availableTickets || totalTickets,
      eventImage: eventImage?.trim(),
      features: features || [],
      aboutText: aboutText?.trim() || '',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.uid
    });
    
    const savedEvent = await newEvent.save();
    await savedEvent.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: savedEvent
    });
  } catch (error) {
    console.error('Error creating event:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: error.message
    });
  }
});

// 6. PUT /api/events/:id - Update event (admin only)
router.put('/:id', authenticateToken, requireRole(['admin']), validateEventInput, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      ticketPrice,
      totalTickets,
      availableTickets,
      eventImage,
      features,
      aboutText,
      isActive
    } = req.body;
    
    // Find the event first
    const existingEvent = await Event.findById(id);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if totalTickets is being reduced below sold tickets
    const soldTickets = existingEvent.totalTickets - existingEvent.availableTickets;
    if (totalTickets < soldTickets) {
      return res.status(400).json({
        success: false,
        message: `Cannot reduce total tickets below ${soldTickets} (already sold tickets)`
      });
    }
    
    // Update event
    const updateData = {
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      ticketPrice,
      totalTickets,
      availableTickets: availableTickets !== undefined ? availableTickets : (totalTickets - soldTickets),
      eventImage: eventImage?.trim(),
      features: features || [],
      aboutText: aboutText?.trim() || '',
      isActive: isActive !== undefined ? isActive : existingEvent.isActive
    };
    
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: error.message
    });
  }
});

// 7. DELETE /api/events/:id - Delete event (admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    // Check if event has sold tickets
    const soldTickets = event.totalTickets - event.availableTickets;
    if (soldTickets > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete event with ${soldTickets} sold tickets. Deactivate instead.`
      });
    }
    
    await Event.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
});

// Additional utility routes

// PATCH /api/events/:id/toggle-active - Toggle event active status (admin only)
router.patch('/:id/toggle-active', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    event.isActive = !event.isActive;
    await event.save();
    
    res.status(200).json({
      success: true,
      message: `Event ${event.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: event.isActive }
    });
  } catch (error) {
    console.error('Error toggling event status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle event status',
      error: error.message
    });
  }
});

// GET /api/events/:id/stats - Get event statistics (admin/manager only)
router.get('/:id/stats', authenticateToken, requireRole(['admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    const stats = {
      totalTickets: event.totalTickets,
      availableTickets: event.availableTickets,
      soldTickets: event.soldTickets,
      soldPercentage: ((event.soldTickets / event.totalTickets) * 100).toFixed(1),
      revenue: event.soldTickets * event.ticketPrice,
      isSoldOut: event.isSoldOut,
      isUpcoming: event.isUpcoming,
      daysUntilEvent: Math.ceil((event.date - new Date()) / (1000 * 60 * 60 * 24))
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching event stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event statistics',
      error: error.message
    });
  }
});

module.exports = router;