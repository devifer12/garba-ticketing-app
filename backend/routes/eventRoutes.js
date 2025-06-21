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

    // Enhanced validation
    const validationErrors = [];

    // Required field validations
    if (!name || !name.trim()) validationErrors.push({ field: 'name', message: 'Event name is required' });
    if (!description || !description.trim()) validationErrors.push({ field: 'description', message: 'Event description is required' });
    if (!date) validationErrors.push({ field: 'date', message: 'Event date is required' });
    if (!startTime || !startTime.trim()) validationErrors.push({ field: 'startTime', message: 'Start time is required' });
    if (!endTime || !endTime.trim()) validationErrors.push({ field: 'endTime', message: 'End time is required' });
    if (!venue || !venue.trim()) validationErrors.push({ field: 'venue', message: 'Event venue is required' });
    if (ticketPrice === undefined || ticketPrice === null || ticketPrice === '') {
      validationErrors.push({ field: 'ticketPrice', message: 'Ticket price is required' });
    }
    if (totalTickets === undefined || totalTickets === null || totalTickets === '') {
      validationErrors.push({ field: 'totalTickets', message: 'Total tickets count is required' });
    }

    // Numeric validations
    const parsedTicketPrice = parseFloat(ticketPrice);
    const parsedTotalTickets = parseInt(totalTickets);

    if (isNaN(parsedTicketPrice) || parsedTicketPrice < 0) {
      validationErrors.push({ field: 'ticketPrice', message: 'Ticket price must be a valid number greater than or equal to 0' });
    }
    if (isNaN(parsedTotalTickets) || parsedTotalTickets < 1) {
      validationErrors.push({ field: 'totalTickets', message: 'Total tickets must be a valid number greater than 0' });
    }

    // Date validation
    if (date) {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        validationErrors.push({ field: 'date', message: 'Event date cannot be in the past' });
      }
    }

    // Time format validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (startTime && !timeRegex.test(startTime.trim())) {
      validationErrors.push({ field: 'startTime', message: 'Start time must be in HH:MM format (e.g., 18:00)' });
    }
    
    if (endTime && !timeRegex.test(endTime.trim())) {
      validationErrors.push({ field: 'endTime', message: 'End time must be in HH:MM format (e.g., 22:00)' });
    }

    // Time logic validation
    if (startTime && endTime && timeRegex.test(startTime.trim()) && timeRegex.test(endTime.trim())) {
      const [startHour, startMin] = startTime.trim().split(':').map(Number);
      const [endHour, endMin] = endTime.trim().split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        validationErrors.push({ field: 'endTime', message: 'End time must be after start time' });
      }
    }

    // URL validation for event image
    if (eventImage && eventImage.trim()) {
      const formatRegex = /^(jpg|jpeg|png|gif|webp)$/i;
      if (!formatRegex.test(eventImage.trim())) {
        validationErrors.push({ field: 'eventImage', message: 'Event image must be a valid format (jpg, jpeg, png, gif, webp)' });
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Find the user in MongoDB to get ObjectId
    const User = require('../models/User');
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
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
      ticketPrice: parsedTicketPrice,
      totalTickets: parsedTotalTickets,
      availableTickets: parsedTotalTickets, // Initially all tickets are available
      eventImage: eventImage?.trim() || '',
      features: Array.isArray(features) ? features.map(f => f.trim()).filter(f => f) : [],
      aboutText: aboutText?.trim() || '',
      createdBy: user._id
    };

    console.log('Creating event with data:', eventData);

    // Create the event
    const event = new Event(eventData);
    const savedEvent = await event.save();

    console.log('Event created successfully:', savedEvent._id);

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: savedEvent
    });

  } catch (error) {
    console.error('Create event error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Event already exists'
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

    // Enhanced validation for updates
    const validationErrors = [];

    // If updating required fields, validate them
    if (updateData.name !== undefined && (!updateData.name || !updateData.name.trim())) {
      validationErrors.push({ field: 'name', message: 'Event name cannot be empty' });
    }
    if (updateData.description !== undefined && (!updateData.description || !updateData.description.trim())) {
      validationErrors.push({ field: 'description', message: 'Event description cannot be empty' });
    }
    if (updateData.venue !== undefined && (!updateData.venue || !updateData.venue.trim())) {
      validationErrors.push({ field: 'venue', message: 'Event venue cannot be empty' });
    }

    // Numeric validations
    if (updateData.ticketPrice !== undefined) {
      const parsedTicketPrice = parseFloat(updateData.ticketPrice);
      if (isNaN(parsedTicketPrice) || parsedTicketPrice < 0) {
        validationErrors.push({ field: 'ticketPrice', message: 'Ticket price must be a valid number greater than or equal to 0' });
      }
    }

    if (updateData.totalTickets !== undefined) {
      const parsedTotalTickets = parseInt(updateData.totalTickets);
      if (isNaN(parsedTotalTickets) || parsedTotalTickets < 1) {
        validationErrors.push({ field: 'totalTickets', message: 'Total tickets must be a valid number greater than 0' });
      } else {
        // Validate if updating ticket counts
        const soldTickets = event.totalTickets - event.availableTickets;
        
        if (parsedTotalTickets < soldTickets) {
          validationErrors.push({ 
            field: 'totalTickets', 
            message: `Cannot reduce total tickets below sold tickets (${soldTickets})` 
          });
        } else {
          // Update available tickets proportionally
          updateData.availableTickets = parsedTotalTickets - soldTickets;
        }
      }
    }

    // Date validation
    if (updateData.date) {
      const eventDate = new Date(updateData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        validationErrors.push({ field: 'date', message: 'Event date cannot be in the past' });
      }
    }

    // Time format validation
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (updateData.startTime !== undefined && updateData.startTime && !timeRegex.test(updateData.startTime.trim())) {
      validationErrors.push({ field: 'startTime', message: 'Start time must be in HH:MM format (e.g., 18:00)' });
    }
    
    if (updateData.endTime !== undefined && updateData.endTime && !timeRegex.test(updateData.endTime.trim())) {
      validationErrors.push({ field: 'endTime', message: 'End time must be in HH:MM format (e.g., 22:00)' });
    }

    // Time logic validation
    const startTime = updateData.startTime || event.startTime;
    const endTime = updateData.endTime || event.endTime;
    
    if (startTime && endTime && timeRegex.test(startTime.trim()) && timeRegex.test(endTime.trim())) {
      const [startHour, startMin] = startTime.trim().split(':').map(Number);
      const [endHour, endMin] = endTime.trim().split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      
      if (endMinutes <= startMinutes) {
        validationErrors.push({ field: 'endTime', message: 'End time must be after start time' });
      }
    }

    // File format validation for event image
    if (updateData.eventImage !== undefined && updateData.eventImage) {
      const formatRegex = /^(webp|png|jpg|jpeg)$/i;
      if (!formatRegex.test(updateData.eventImage)) {
        validationErrors.push({ field: 'eventImage', message: 'Event image must be a valid format (webp, png, jpg, jpeg)' });
      }
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      });
    }

    // Process features array
    if (updateData.features && Array.isArray(updateData.features)) {
      updateData.features = updateData.features.map(f => f.trim()).filter(f => f);
    }

    // Clean string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.venue) updateData.venue = updateData.venue.trim();
    if (updateData.startTime) updateData.startTime = updateData.startTime.trim();
    if (updateData.endTime) updateData.endTime = updateData.endTime.trim();
    if (updateData.eventImage) updateData.eventImage = updateData.eventImage.trim();
    if (updateData.aboutText) updateData.aboutText = updateData.aboutText.trim();

    console.log('Updating event with data:', updateData);

    // Update the event
    const updatedEvent = await Event.findOneAndUpdate(
      {},
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    console.log('Event updated successfully:', updatedEvent._id);

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Update event error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
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