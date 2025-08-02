const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const connectDB = async () => {
  try {
    // Use environment variables for connection pool settings
    const maxPoolSize = parseInt(process.env.MONGODB_MAX_POOL_SIZE) || 10; // Reduced pool size
    const minPoolSize = parseInt(process.env.MONGODB_MIN_POOL_SIZE) || 5;

    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize, // Use environment variable or default
      minPoolSize, // Use environment variable or default
      serverSelectionTimeoutMS: 15000, // Further increased timeout
      socketTimeoutMS: 45000, // Optimized socket timeout
      connectTimeoutMS: 10000, // Connection timeout
      bufferCommands: true,
      // Performance optimizations
      maxIdleTimeMS: 60000, // Increased idle time for better connection reuse
      heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
    });

    // Connection event handlers
    mongoose.connection.on("connected", () => {
      if (process.env.NODE_ENV !== "production") {
        console.log("✅ MongoDB Connected to hyyevents database");
      }
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB Disconnected");
    });
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };