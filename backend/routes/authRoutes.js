const express = require("express");
const router = express.Router();
const admin = require("../firebase/admin");
const User = require("../models/User");
const verifyToken = require("../middlewares/authMiddleware");

// Google Sign-In Route
router.post("/google-signin", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("Google signin request received");
    }

    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: "ID token is required" });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Extract user information from the token
    const { uid, email, name, picture, email_verified } = decodedToken;

    if (!email) {
      return res
        .status(400)
        .json({ error: "Email is required from Google account" });
    }

    // Find or create user in our database
    const user = await User.findOrCreateGoogleUser({
      uid,
      email,
      name,
      picture,
      email_verified,
    });

    // Return user data (excluding sensitive information)
    res.status(200).json({
      success: true,
      message: "Google sign-in successful",
      user: user.getSafeUserData(),
    });
  } catch (error) {
    // Handle specific Firebase auth errors
    if (error.code === "auth/id-token-expired") {
      return res
        .status(401)
        .json({ error: "Token expired. Please sign in again." });
    }

    if (error.code === "auth/invalid-id-token") {
      return res
        .status(401)
        .json({ error: "Invalid token. Please sign in again." });
    }

    res.status(500).json({
      error: "Google sign-in failed",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
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
      user: user.getSafeUserData(),
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
      user: user.getSafeUserData(),
    });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Logout endpoint - made optional auth to handle expired tokens
router.post("/logout", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    // Only update user activity if we have a valid token
    if (token) {
      try {
        const admin = require("../firebase/admin");
        const decoded = await admin.auth().verifyIdToken(token);

        const user = await User.findOne({ firebaseUID: decoded.uid });
        if (user) {
          user.lastLogin = new Date();
          await user.save();
        }
      } catch (tokenError) {
        // Token might be expired during logout, which is fine
        if (process.env.NODE_ENV === "development") {
          console.log(
            "Token verification failed during logout (expected):",
            tokenError.message,
          );
        }
      }
    }

    // Always return success for logout
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    // Still return success for logout even if there's an error
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  }
});

module.exports = router;