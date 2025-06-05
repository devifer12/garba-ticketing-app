const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // Firebase UID (primary identifier for Google auth)
  firebaseUID: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  
  // Basic user information
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // Phone is now optional since Google auth might not provide it
  phone: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  
  // Password is now optional (not needed for Google auth)
  password: {
    type: String,
    required: function() {
      // Password required only if firebaseUID is not present (traditional auth)
      return !this.firebaseUID;
    }
  },
  
  // Google-specific fields
  profilePicture: {
    type: String, // URL to Google profile picture
    default: null
  },
  
  // Authentication method tracking
  authMethod: {
    type: String,
    enum: ['google', 'traditional'],
    default: 'traditional'
  },
  
  // Verification status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  
  // User role for authorization
  role: {
    type: String,
    enum: ['guest', 'user', 'admin', 'manager', 'qrchecker'],
    default: 'user'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (only for traditional auth)
userSchema.pre("save", async function(next) {
  // Only hash password if it exists and is modified
  if (!this.password || !this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password (for traditional auth)
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Static method to find or create user from Google auth
userSchema.statics.findOrCreateGoogleUser = async function(googleUserData) {
  const { uid, email, name, picture, email_verified } = googleUserData;
  
  try {
    // First, try to find user by Firebase UID
    let user = await this.findOne({ firebaseUID: uid });
    
    if (user) {
      // Update last login and return existing user
      user.lastLogin = new Date();
      user.isEmailVerified = email_verified || user.isEmailVerified;
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
      }
      await user.save();
      return user;
    }
    
    // If not found by UID, check by email (for migration scenarios)
    user = await this.findOne({ email: email });
    
    if (user && !user.firebaseUID) {
      // Existing user, add Google auth to their account
      user.firebaseUID = uid;
      user.authMethod = 'google';
      user.isEmailVerified = email_verified;
      user.profilePicture = picture;
      user.lastLogin = new Date();
      await user.save();
      return user;
    }
    
    // Create new user
    const newUser = new this({
      firebaseUID: uid,
      name: name,
      email: email,
      profilePicture: picture,
      authMethod: 'google',
      isEmailVerified: email_verified,
      lastLogin: new Date()
    });
    
    await newUser.save();
    return newUser;
    
  } catch (error) {
    console.error('Error in findOrCreateGoogleUser:', error);
    throw error;
  }
};

module.exports = mongoose.model("User", userSchema);