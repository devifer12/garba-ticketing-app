const express = require("express");
const router = express.Router();
const admin = require("../firebase/admin");
const User = require("../models/User");

// Google Sign-In Route - FIXED: Added this route here
router.post("/google-signin", async (req, res) => {
  try {
    console.log('Google signin request received:', req.body);
    
    const { idToken } = req.body;

    if (!idToken) {
      console.error('No idToken provided');
      return res.status(400).json({ error: "ID token is required" });
    }

    console.log('Verifying Firebase ID token...');
    
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token verified successfully:', {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name
    });
    
    // Extract user information from the token
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return res.status(400).json({ error: "Email is required from Google account" });
    }

    console.log('Finding or creating user...');
    
    // Find or create user in our database
    const user = await User.findOrCreateGoogleUser({
      uid,
      email,
      name,
      picture,
    });

    console.log('User processing complete:', user.email);

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

module.exports = router;