const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const verifyToken = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// GET /api/event - Get the current event details (public)
router.get('/', async (req, res) => {
  try {
    const event = await Event.findOne();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    res.status(200).json({
      success: true,
      data: event
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      details: error.message
    });
  }
});

// POST /api/event - Create the event (admin only, first time setup)
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    // Check if event already exists
    const existingEvent = await Event.findOne();
    if (existingEvent) {
      return res.status(400).json({
        success: false,
        error: 'Event already exists. Use PUT to update it.'
      });
    }

    const {
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      ticketPrice,
      totalTickets,
      eventImage,
      features,
      aboutText
    } = req.body;

    // Validate required fields
    if (!name || !description || !date || !startTime || !endTime || !venue || ticketPrice === undefined || !totalTickets) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create event data
    const eventData = {
      name: name.trim(),
      description: description.trim(),
      date: new Date(date),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      venue: venue.trim(),
      ticketPrice: parseFloat(ticketPrice),
      totalTickets: parseInt(totalTickets),
      availableTickets: parseInt(totalTickets), // Initially all tickets are available
      eventImage: eventImage?.trim() || '',
      features: Array.isArray(features) ? features.map(f => f.trim()).filter(f => f) : [],
      aboutText: aboutText?.trim() || '',
      createdBy: req.user.uid // From Firebase UID
    };

    // Find the user in MongoDB to get ObjectId
    const User = require('../models/User');
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    eventData.createdBy = user._id;

    // Create the event
    const event = new Event(eventData);
    const savedEvent = await event.save();

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: savedEvent
    });

  } catch (error) {
    console.error('Create event error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create event',
      details: error.message
    });
  }
});

// PUT /api/event - Update the existing event (admin only)
router.put('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const updateData = req.body;

    // Find the event
    const event = await Event.findOne();
    
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Validate if updating ticket counts
    if (updateData.totalTickets !== undefined) {
      const newTotalTickets = parseInt(updateData.totalTickets);
      const soldTickets = event.totalTickets - event.availableTickets;
      
      if (newTotalTickets < soldTickets) {
        return res.status(400).json({
          success: false,
          error: `Cannot reduce total tickets below sold tickets (${soldTickets})`
        });
      }
      
      // Update available tickets proportionally
      updateData.availableTickets = newTotalTickets - soldTickets;
    }

    // Process features array
    if (updateData.features && Array.isArray(updateData.features)) {
      updateData.features = updateData.features.map(f => f.trim()).filter(f => f);
    }

    // Update the event
    const updatedEvent = await Event.findOneAndUpdate(
      {},
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Update event error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update event',
      details: error.message
    });
  }
});

// GET /api/event/exists - Check if event already exists
router.get('/exists', async (req, res) => {
  try {
    const event = await Event.findOne();
    
    res.status(200).json({
      success: true,
      exists: !!event
    });

  } catch (error) {
    console.error('Check event exists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check event existence',
      details: error.message
    });
  }
});

module.exports = router;