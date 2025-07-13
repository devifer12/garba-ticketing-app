// Database indexing script for performance optimization
const mongoose = require("mongoose");
require("dotenv").config();

const createIndexes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB for indexing...");

    const db = mongoose.connection.db;

    // User collection indexes
    await db
      .collection("users")
      .createIndex({ firebaseUID: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("users").createIndex({ role: 1 });
    await db.collection("users").createIndex({ createdAt: -1 });
    console.log("✅ User indexes created");

    // Ticket collection indexes
    await db
      .collection("tickets")
      .createIndex({ ticketId: 1 }, { unique: true });
    await db.collection("tickets").createIndex({ userId: 1 });
    await db.collection("tickets").createIndex({ eventId: 1 });
    await db.collection("tickets").createIndex({ status: 1 });
    await db.collection("tickets").createIndex({ createdAt: -1 });
    await db
      .collection("tickets")
      .createIndex({ qrCode: 1 }, { unique: true, sparse: true });

    // Compound indexes for common queries
    await db.collection("tickets").createIndex({ userId: 1, status: 1 });
    await db.collection("tickets").createIndex({ eventId: 1, status: 1 });
    await db.collection("tickets").createIndex({ status: 1, createdAt: -1 });
    console.log("✅ Ticket indexes created");

    // Event collection indexes
    await db.collection("events").createIndex({ isActive: 1 });
    await db.collection("events").createIndex({ date: 1 });
    await db.collection("events").createIndex({ createdAt: -1 });
    console.log("✅ Event indexes created");

    console.log("🎉 All indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating indexes:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

// Run the script
if (require.main === module) {
  createIndexes();
}

module.exports = createIndexes;