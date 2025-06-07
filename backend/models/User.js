const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Firebase UID (primary identifier for Google auth)
  firebaseUID: {
    type: String,
    required: true,
    unique: true
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
  
  // Phone is optional since Google auth might not provide it
  phone: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  
  // Google-specific fields
  profilePicture: {
    type: String, // URL to Google profile picture
    default: null
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

// Static method to find or create user from Google auth
userSchema.statics.findOrCreateGoogleUser = async function(googleUserData) {
  const { uid, email, name, picture, email_verified } = googleUserData;
  
  console.log('findOrCreateGoogleUser called with:', {
    uid,
    email,
    name,
    picture: picture ? 'provided' : 'not provided',
    email_verified
  });
  
  try {
    // First, try to find user by Firebase UID
    let user = await this.findOne({ firebaseUID: uid });
    
    if (user) {
      console.log('Existing user found by Firebase UID:', user.email);
      // Update last login and return existing user
      user.lastLogin = new Date();
      user.isEmailVerified = email_verified || user.isEmailVerified;
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
      }
      // Update name if it's different
      if (name && name !== user.name) {
        user.name = name;
      }
      await user.save();
      console.log('User updated successfully');
      return user;
    }
    
    // If not found by UID, check by email (for migration scenarios)
    user = await this.findOne({ email: email });
    
    if (user && !user.firebaseUID) {
      console.log('Existing user found by email, linking to Google:', user.email);
      // Existing user, add Google auth to their account
      user.firebaseUID = uid;
      user.isEmailVerified = email_verified;
      user.profilePicture = picture;
      user.lastLogin = new Date();
      if (name && name !== user.name) {
        user.name = name;
      }
      await user.save();
      console.log('User linked to Google successfully');
      return user;
    }
    
    // Create new user
    console.log('Creating new user for:', email);
    const newUser = new this({
      firebaseUID: uid,
      name: name || email.split('@')[0], // Fallback to email prefix if no name
      email: email,
      profilePicture: picture,
      isEmailVerified: email_verified || false,
      lastLogin: new Date()
    });
    
    await newUser.save();
    console.log('New user created successfully:', newUser.email);
    return newUser;
    
  } catch (error) {
    console.error('Error in findOrCreateGoogleUser:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      console.log('Duplicate key error, attempting to find existing user');
      const duplicateField = Object.keys(error.keyPattern)[0];
      const duplicateValue = error.keyValue[duplicateField];
      
      // Try to find the existing user
      const existingUser = await this.findOne({ [duplicateField]: duplicateValue });
      if (existingUser) {
        console.log('Found existing user after duplicate error:', existingUser.email);
        // Update the existing user with Google data
        existingUser.firebaseUID = uid;
        existingUser.isEmailVerified = email_verified || existingUser.isEmailVerified;
        existingUser.profilePicture = picture || existingUser.profilePicture;
        existingUser.lastLogin = new Date();
        if (name && name !== existingUser.name) {
          existingUser.name = name;
        }
        await existingUser.save();
        return existingUser;
      }
    }
    
    throw error;
  }
};

// Method to get safe user data (excluding sensitive fields)
userSchema.methods.getSafeUserData = function() {
  return {
    id: this._id,
    firebaseUID: this.firebaseUID,
    name: this.name,
    email: this.email,
    phone: this.phone,
    profilePicture: this.profilePicture,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    isPhoneVerified: this.isPhoneVerified,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

// Static method to find user by Firebase UID
userSchema.statics.findByFirebaseUID = async function(uid) {
  try {
    return await this.findOne({ firebaseUID: uid });
  } catch (error) {
    console.error('Error finding user by Firebase UID:', error);
    throw error;
  }
};

module.exports = mongoose.model("User", userSchema);