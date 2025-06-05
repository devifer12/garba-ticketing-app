const express = require("express");
const router = express.Router();
const admin = require("../firebase/admin");
const User = require("../models/User");
const verifyToken = require("../middlewares/authMiddleware");

// Google Sign-In Route
router.post("/google-signin", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
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
      user: {
        id: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        authMethod: user.authMethod,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error("Google sign-in error:", error);
    
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
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        role: user.role,
        authMethod: user.authMethod,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// Update user profile (protected route)
router.put("/profile", verifyToken, async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (phone) {
      // Check if phone number is already taken by another user
      const existingUser = await User.findOne({ 
        phone: phone, 
        _id: { $ne: user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
      
      user.phone = phone;
      user.isPhoneVerified = false; // Reset verification status
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        firebaseUID: user.firebaseUID,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        role: user.role,
        authMethod: user.authMethod,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
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

// Sign out (mainly for logging purposes)
router.post("/signout", verifyToken, async (req, res) => {
  try {
    // Update last activity or perform any cleanup
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (user) {
      user.lastLogin = new Date();
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Signed out successfully"
    });

  } catch (error) {
    console.error("Sign out error:", error);
    res.status(500).json({ error: "Sign out failed" });
  }
});

module.exports = router;