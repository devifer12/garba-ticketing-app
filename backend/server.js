const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db.js');
require('dotenv').config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000', // In case you use different dev port
    'http://127.0.0.1:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Database connection
connectDB();

// Import middleware
const verifyFirebaseToken = require('./middlewares/authMiddleware');
const errorHandler = require('./middlewares/errorMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const authRoutes = require('./routes/authRoutes'); // Traditional auth (keep for backward compatibility)
const googleAuthRoutes = require('./routes/googleAuth'); // Google auth routes

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Garba Ticketing App Backend is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: ['Google Authentication', 'Ticket Booking', 'User Management'],
    endpoints: {
      auth: '/api/google-auth',
      tickets: '/api/tickets',
      users: '/api/users'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes); // Traditional auth routes (backward compatibility)
app.use('/api/google-auth', googleAuthRoutes); // Primary Google auth routes
app.use('/api/users', userRoutes); // User management routes
app.use('/api/tickets', ticketRoutes); // Ticket routes (protected)

// Protected test route for debugging
app.get('/api/protected', verifyFirebaseToken, (req, res) => {
  res.json({ 
    message: 'Access granted to protected route',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name || 'No name provided'
    },
    timestamp: new Date().toISOString()
  });
});

// API status route with more details
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    database: 'connected',
    firebase: 'initialized',
    environment: process.env.NODE_ENV || 'development',
    routes: {
      googleAuth: {
        signin: 'POST /api/google-auth/google-signin',
        profile: 'GET /api/google-auth/profile',
        updateProfile: 'PUT /api/google-auth/profile',
        deleteAccount: 'DELETE /api/google-auth/account',
        signout: 'POST /api/google-auth/signout'
      },
      tickets: {
        create: 'POST /api/tickets',
        myTickets: 'GET /api/tickets/my-tickets',
        getTicket: 'GET /api/tickets/:ticketId',
        cancelTicket: 'PATCH /api/tickets/:ticketId/cancel'
      },
      admin: {
        allTickets: 'GET /api/tickets/admin/all',
        updateTicketStatus: 'PATCH /api/tickets/admin/:ticketId/status'
      }
    }
  });
});

// Preflight OPTIONS handler for complex CORS requests
app.options('*', cors(corsOptions));

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/status',
      'POST /api/google-auth/google-signin',
      'GET /api/google-auth/profile',
      'PUT /api/google-auth/profile',
      'POST /api/tickets',
      'GET /api/tickets/my-tickets',
      'GET /api/protected'
    ]
  });
});

// Global error handling middleware (should be last)
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running for garba-ticketing-app on http://localhost:${PORT}`);
  console.log(`📱 Google Auth endpoints: http://localhost:${PORT}/api/google-auth`);
  console.log(`🎫 Ticket endpoints: http://localhost:${PORT}/api/tickets`);
  console.log(`💡 API status: http://localhost:${PORT}/api/status`);
  console.log(`🌐 CORS enabled for: ${corsOptions.origin}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

module.exports = app;