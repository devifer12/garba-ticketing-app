const express = require("express");
const compression = require("compression");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./config/db.js");
require("dotenv").config();

const app = express();
// Trust the first proxy (required for Vercel and express-rate-limit)
app.set("trust proxy", 1);
app.use(compression());

// Enhanced CORS configuration
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? [
          process.env.FRONTEND_URL,
          "https://hyyevents.com",
          "https://www.hyyevents.com",
          "https://api-preprod.phonepe.com/apis/pg-sandbox",
          "https://mercury-uat.phonepe.com."
        ]
      : [
          process.env.FRONTEND_URL,
          "http://localhost:3000",
          "http://127.0.0.1:5173",
          "http://localhost:5174",
          "https://garba-ticketing-app.vercel.app",
          "https://hyyevents.vercel.app",
          "https://www.hyyevents.com",
          "https://api-preprod.phonepe.com/apis/pg-sandbox",
          "https://mercury-uat.phonepe.com."
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

// Log CORS info only in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log("Incoming request origin:", req.headers.origin);
    next();
  });
  console.log("Allowed frontend URL:", process.env.FRONTEND_URL);
}

// Apply CORS middleware first
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Body parsing middleware with optimized limits
app.use(express.json({ limit: "2mb" })); // Further reduced for production
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ✅ FIXED: Proper static file serving with correct MIME types
if (process.env.NODE_ENV === "production") {
  const staticPath = path.join(__dirname, "../frontend/dist");

  // Custom middleware to set correct MIME types
  app.use(
    express.static(staticPath, {
      setHeaders: (res, filePath) => {
        // Set correct MIME type for JavaScript files
        if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
          res.setHeader("Content-Type", "application/javascript");
        }
        // Set correct MIME type for CSS files
        else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        }
        // Set correct MIME type for JSON files
        else if (filePath.endsWith(".json")) {
          res.setHeader("Content-Type", "application/json");
        }
        // Set correct MIME type for images
        else if (filePath.endsWith(".png")) {
          res.setHeader("Content-Type", "image/png");
        } else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) {
          res.setHeader("Content-Type", "image/jpeg");
        } else if (filePath.endsWith(".webp")) {
          res.setHeader("Content-Type", "image/webp");
        } else if (filePath.endsWith(".svg")) {
          res.setHeader("Content-Type", "image/svg+xml");
        }

        // Enable caching for static assets (but not index.html)
        if (!filePath.includes("index.html")) {
          res.setHeader("Cache-Control", "public, max-age=31536000");
        } else {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }),
  );
}

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Database connection
connectDB();

// Import middleware
const verifyFirebaseToken = require("./middlewares/authMiddleware");
const errorHandler = require("./middlewares/errorMiddleware");
const {
  performanceMiddleware,
  dbPerformanceMiddleware,
  memoryMonitoringMiddleware,
  createRateLimiter,
} = require("./middlewares/performanceMiddleware");

// Apply performance middleware
app.use(performanceMiddleware);
app.use(dbPerformanceMiddleware);
app.use(memoryMonitoringMiddleware);

// Apply rate limiting
if (process.env.NODE_ENV === "production") {
  app.use("/api/", createRateLimiter());
}

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
        cancelTicket: "PATCH /api/tickets/cancel/:ticketId",
        checkPaymentStatus: "GET /api/tickets/payment-status/:merchantOrderId",
        paymentCallback: "POST /api/tickets/payment-callback",
        initiatePayment: "/api/tickets/initiate-payment",
        webhook: "POST /api/tickets/webhook",
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
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"), {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  });
} else {
  // For development, serve a simple API status response
  app.get("/", (req, res) => {
    res.json({
      message: "Garba Ticketing App Backend is running!",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development",
      authentication: "Google Authentication Only",
      endpoints: {
        health: "/api/health",
        status: "/api/status",
      },
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(
    "Global error handler:",
    process.env.NODE_ENV === "development" ? err : err.message,
  );

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
  console.error(
    "Uncaught Exception:",
    process.env.NODE_ENV === "development" ? err : err.message,
  );
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error(
    "Unhandled Rejection:",
    process.env.NODE_ENV === "development" ? err : err.message,
  );
  process.exit(1);
});

// Start server for all environments (including production)
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔐 Authentication: Google Sign-In Only`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`💡 API status: http://localhost:${PORT}/api/status`);
  }
});

// Graceful shutdown handlers
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Process terminated");
    process.exit(0);
  });
});

// Keep the module export for testing purposes
module.exports = app;