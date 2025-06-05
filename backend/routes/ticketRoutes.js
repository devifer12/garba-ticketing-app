const express = require('express');
const router = express.Router();
const Ticket = require('../models/Tickets');

// Create a ticket (linked to user)
router.post('/', async (req, res) => {
  try {
    const { userId, price } = req.body;
    const ticket = await Ticket.create({ user: userId, price });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;