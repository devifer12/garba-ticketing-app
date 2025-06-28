const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db.js");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(compression());

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "https://garba-ticketing-app.onrender.com", // Add your Render URL
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
    "x-user-uid",
    "X-User-UID",
    "X-User-Email",
    "X-Request-Time",
  ],
  exposedHeaders: ["Authorization"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ✅ CRITICAL: Serve static files with correct MIME types
if (process.env.NODE_ENV === "production") {
  // Set correct MIME types for JavaScript modules
  express.static.mime.define({
    "application/javascript": ["js", "jsx", "mjs"],
    "text/javascript": ["js", "jsx"],
  });

  // Serve static files from the frontend build
  app.use(
    express.static(path.join(__dirname, "../frontend/dist"), {
      setHeaders: (res, filePath) => {
        // Set correct MIME type for JS/JSX files
        if (
          filePath.endsWith(".js") ||
          filePath.endsWith(".jsx") ||
          filePath.endsWith(".mjs")
        ) {
          res.setHeader("Content-Type", "application/javascript");
        }
        // Enable caching for static assets
        if (!filePath.includes("index.html")) {
          res.setHeader("Cache-Control", "public, max-age=31536000");
        }
      },
    })
  );
}

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log("Headers:", req.headers);
    if (req.body && Object.keys(req.body).length > 0) {
      console.log("Body:", req.body);
    }
    next();
  });
}

// Database connection
connectDB();

// Import middleware
const verifyFirebaseToken = require("./middlewares/authMiddleware");
const errorHandler = require("./middlewares/errorMiddleware");

// Import routes
const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const eventRoutes = require("./routes/eventRoutes");
const adminRoutes = require("./routes/adminRoutes");

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    message: "Garba Ticketing App Backend is running!",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    authentication: "Google Authentication Only",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/event", eventRoutes);
app.use("/api/admin", adminRoutes);

// Protected test route for debugging
app.get("/api/protected", verifyFirebaseToken, (req, res) => {
  res.json({
    message: "Access granted to protected route",
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name || "No name provided",
    },
    timestamp: new Date().toISOString(),
  });
});

// API status route
app.get("/api/status", (req, res) => {
  res.json({
    status: "online",
    database: "connected",
    firebase: "initialized",
    environment: process.env.NODE_ENV || "development",
    authentication: "Google Authentication Only",
    cors: {
      origins: corsOptions.origin,
      methods: corsOptions.methods,
    },
    routes: {
      auth: {
        signin: "POST /api/auth/google-signin",
        profile: "GET /api/auth/me",
        profileAlt: "GET /api/auth/profile",
        updateProfile: "PUT /api/auth/profile",
        logout: "POST /api/auth/logout",
      },
      tickets: {
        create: "POST /api/tickets",
        myTickets: "GET /api/tickets/my-tickets",
        getTicket: "GET /api/tickets/:ticketId",
        cancelTicket: "PATCH /api/tickets/:ticketId/cancel",
      },
      admin: {
        allTickets: "GET /api/tickets/admin/all",
        updateTicketStatus: "PATCH /api/tickets/admin/:ticketId/status",
        // NEW: Admin endpoints
        userCount: "GET /api/admin/users/count",
        allUsers: "GET /api/admin/users",
        updateUserRole: "PATCH /api/admin/users/:userId/role",
        deleteUser: "DELETE /api/admin/users/:userId",
        ticketStats: "GET /api/admin/tickets/stats",
        deleteTicket: " DELETE /api/admin/tickets/:ticketId",
        dashboardAnalytics: "GET /api/admin/analytics/dashboard",
        ticketManagement: "GET /api/admin/tickets/management",
        bulkUpdateTickets: "PATCH /api/admin/tickets/bulk-update",
        exportTickets: "GET /api/admin/tickets/export",
        systemHealth: "GET /api/admin/system/health",
      },
      event: {
        getEvent: "GET /api/event", // To fetch the current event
        createOrUpdate: "POST /api/event", // If using same endpoint to create/update
      },
    },
  });
});

// Handle 404 for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.originalUrl,
    method: req.method,
  });
});

// ✅ CRITICAL: Catch-all handler for SPA routing (must be AFTER API routes)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"), {
    headers: {
      "Content-Type": "text/html",
    },
  });
});

// For development, just serve a simple response
if (process.env.NODE_ENV !== "production") {
  app.get("/", (req, res) => {
    res.json({
      message: "Garba Ticketing App Backend is running!",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      authentication: "Google Authentication Only",
      note: "Frontend should be served separately in development",
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      error: "CORS policy violation",
      message: "Request blocked by CORS policy",
    });
  }

  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.use(errorHandler);

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔐 Authentication: Google Sign-In Only`);
  console.log(`💡 API status: http://localhost:${PORT}/api/status`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
  });
});

module.exports = app;
