const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register a new user (automatically as 'guest')
router.post('/register', async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.create({ 
      name, 
      email,
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