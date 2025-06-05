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

// Import middleware
const verifyFirebaseToken = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const authRoutes = require('./routes/authRoutes'); // Traditional auth (keep for backward compatibility)
const googleAuthRoutes = require('./routes/googleAuth'); // New Google auth routes

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Garba Ticketing App Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['Google Authentication', 'Ticket Booking', 'User Management']
  });
});

// API Routes
app.use('/api/auth', authRoutes); // Traditional auth routes
app.use('/api/google-auth', googleAuthRoutes); // Google auth routes
app.use('/api/users', userRoutes); // User management routes
app.use('/api/tickets', ticketRoutes); // Ticket routes (now all protected)

// Protected test route
app.get('/api/protected', verifyFirebaseToken, (req, res) => {
  res.json({ 
    message: 'Access granted to protected route',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name
    },
    timestamp: new Date().toISOString()
  });
});

// API status route
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: 'connected',
    firebase: 'initialized',
    routes: {
      auth: '/api/auth',
      googleAuth: '/api/google-auth',
      users: '/api/users',
      tickets: '/api/tickets',
      protected: '/api/protected'
    }
  });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api/status',
      'POST /api/google-auth/google-signin',
      'GET /api/google-auth/profile',
      'PUT /api/google-auth/profile',
      'POST /api/tickets',
      'GET /api/tickets/my-tickets'
    ]
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running for garba-ticketing-app on http://localhost:${PORT}`);
  console.log(`📱 Google Auth endpoints available at http://localhost:${PORT}/api/google-auth`);
  console.log(`🎫 Ticket endpoints available at http://localhost:${PORT}/api/tickets`);
  console.log(`💡 API status: http://localhost:${PORT}/api/status`);
});