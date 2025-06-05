const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register a new user (automatically as 'guest')
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    
    const user = await User.create({ 
      name, 
      email,
      phone
      // Omit firebaseUID entirely - don't set it to undefined or null
    });
    
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ 
      error: "Registration failed",
      details: err.message 
    });
  }
});

module.exports = router;