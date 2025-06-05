const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db.js');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Database connection
connectDB();

// Import middleware and routes
const verifyFirebaseToken = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const authRoutes = require('./routes/authRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', verifyFirebaseToken, ticketRoutes);

// Protected test route
app.get('/api/protected', verifyFirebaseToken, (req, res) => {
  res.json({ 
    message: 'Access granted',
    user: req.user 
  });
});

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Garba Ticketing App Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running for garba-ticketing-app on http://localhost:${PORT}`);
});