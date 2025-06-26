const express = require("express");
const router = express.Router();
const admin = require("../firebase/admin");
const User = require("../models/User");
const verifyToken = require("../middlewares/authMiddleware");

// Google Sign-In Route
router.post("/google-signin", async (req, res) => {
  try {
    console.log('Google signin request received:', req.body);
    
    const { idToken } = req.body;

    if (!idToken) {
      console.error('No idToken provided');
      return res.status(400).json({ error: "ID token is required" });
    }
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Extract user information from the token
    const { uid, email, name, picture, email_verified } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: "Email is required from Google account" });
    }

    // Find or create user in our database
    const user = await User.findOrCreateGoogleUser({
      uid,
      email,
      name,
      picture,
      email_verified
    });

    // Return user data (excluding sensitive information)
    res.status(200).json({
      success: true,
      message: "Google sign-in successful",
      user: user.getSafeUserData()
    });

  } catch (error) {
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ error: "Token expired. Please sign in again." });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ error: "Invalid token. Please sign in again." });
    }

    res.status(500).json({ 
      error: "Google sign-in failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get current user profile (protected route)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: user.getSafeUserData()
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile (protected route)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update allowed fields
    if (name) user.name = name;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: user.getSafeUserData()
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Logout endpoint
router.post("/logout", verifyToken, async (req, res) => {
  try {
    // Update last activity
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (user) {
      user.lastLogin = new Date();
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// Delete user account (protected route)
router.delete("/account", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete user from Firebase Auth
    await admin.auth().deleteUser(req.user.uid);
    
    // Delete user from MongoDB
    await User.findByIdAndDelete(user._id);
    
    res.status(200).json({
      success: true,
      message: "Account deleted successfully"
    });

  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
});

module.exports = router;