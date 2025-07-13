// Performance monitoring middleware

const performanceMiddleware = (req, res, next) => {
  const start = Date.now();

  // Add request ID for tracking
  req.requestId = Math.random().toString(36).substr(2, 9);

  // Override res.json to measure response time
  const originalJson = res.json;
  res.json = function (data) {
    const duration = Date.now() - start;

    // Log slow requests - use environment variable for threshold
    const slowQueryThreshold =
      parseInt(process.env.SLOW_QUERY_THRESHOLD) || 1000;
    if (duration > slowQueryThreshold) {
      console.warn(
        `Slow request detected: ${req.method} ${req.path} - ${duration}ms`,
      );
    }

    // Add performance headers
    res.set({
      "X-Response-Time": `${duration}ms`,
      "X-Request-ID": req.requestId,
    });

    // Development logging
    if (process.env.NODE_ENV === "development") {
      console.log(`${req.method} ${req.path} - ${duration}ms`);
    }

    return originalJson.call(this, data);
  };

  next();
};

// Database query performance monitoring
const dbPerformanceMiddleware = (req, res, next) => {
  const enableLogging =
    process.env.LOG_SLOW_QUERIES === "true" ||
    process.env.NODE_ENV === "development";

  if (enableLogging) {
    const mongoose = require("mongoose");

    // Monitor slow queries
    mongoose.set("debug", (collectionName, method, query, doc) => {
      const start = Date.now();
      if (process.env.NODE_ENV === "development") {
        console.log(`DB Query: ${collectionName}.${method}`, query);
      }

      // You can add query timing here if needed
      setTimeout(() => {
        const duration = Date.now() - start;
        const slowDbThreshold =
          parseInt(process.env.SLOW_DB_QUERY_THRESHOLD) || 100;
        if (duration > slowDbThreshold) {
          console.warn(
            `Slow DB query: ${collectionName}.${method} - ${duration}ms`,
          );
        }
      }, 0);
    });
  }

  next();
};

// Memory usage monitoring
const memoryMonitoringMiddleware = (req, res, next) => {
  const enableMonitoring =
    process.env.ENABLE_PERFORMANCE_MONITORING === "true" ||
    process.env.NODE_ENV === "development";

  if (enableMonitoring) {
    const memUsage = process.memoryUsage();
    const memoryThreshold = parseInt(process.env.MEMORY_THRESHOLD_MB) || 100;

    // Log memory usage for heavy requests
    if (memUsage.heapUsed > memoryThreshold * 1024 * 1024) {
      console.warn("High memory usage detected:", {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
        external: Math.round(memUsage.external / 1024 / 1024) + " MB",
        threshold: memoryThreshold + " MB",
      });
    }
  }

  next();
};

// Rate limiting for performance
const createRateLimiter = () => {
  const rateLimit = require("express-rate-limit");

  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === "/api/health" || req.path === "/api/status",
  });
};

module.exports = {
  performanceMiddleware,
  dbPerformanceMiddleware,
  memoryMonitoringMiddleware,
  createRateLimiter,
};