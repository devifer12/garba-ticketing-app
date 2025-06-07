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
  // User role for authorization
  role: {
    type: String,
    enum: ['guest', 'admin', 'manager', 'qrchecker'],
    default: 'guest'
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

// ENHANCED: Static method to find or create user from Google auth
userSchema.statics.findOrCreateGoogleUser = async function(googleUserData) {
  const { uid, email, name, picture, email_verified } = googleUserData;
  console.log('🔍 findOrCreateGoogleUser called with:', { uid, email });

  try {
    // Try to find user by Firebase UID first
    let user = await this.findOne({ firebaseUID: uid });

    // If not found by UID, try finding by email
    if (!user) {
      user = await this.findOne({ email: email });
    }

    if (user) {
      console.log('✅ Existing user found:', user.email);

      // Update user data with latest info from Google
      user.firebaseUID = uid;
      user.lastLogin = new Date();
      user.isEmailVerified = email_verified || user.isEmailVerified;
      user.profilePicture = picture || user.profilePicture;

      if (name && name !== user.name) {
        console.log(`📝 Updating name from "${user.name}" to "${name}"`);
        user.name = name;
      }

      await user.save();
      console.log('✅ User updated successfully');
      return user;
    }

    // Create completely new user if not found
    console.log('🆕 Creating new user for:', email);
    const newUserData = {
      firebaseUID: uid,
      name: name || email.split('@')[0],
      email: email,
      profilePicture: picture || null,
      isEmailVerified: email_verified || false,
      lastLogin: new Date(),
      createdAt: new Date()
    };

    console.log('📝 New user data:', newUserData);
    const newUser = new this(newUserData);
    await newUser.save();

    console.log('✅ New user created successfully:', {
      id: newUser._id,
      email: newUser.email,
      firebaseUID: newUser.firebaseUID
    });

    return newUser;

  } catch (error) {
    console.error('❌ Error in findOrCreateGoogleUser:', error);

    if (error.code === 11000) {
      console.log('🔍 Duplicate key error, analyzing...');
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      const duplicateValue = error.keyValue?.[duplicateField];

      console.log('Duplicate detected:', { field: duplicateField, value: duplicateValue });

      try {
        const query = {};
        query[duplicateField] = duplicateValue;

        const existingUser = await this.findOne(query);

        if (existingUser) {
          console.log('✅ Found conflicting user, updating:', existingUser.email);

          existingUser.firebaseUID = uid;
          existingUser.isEmailVerified = email_verified || existingUser.isEmailVerified;
          existingUser.profilePicture = picture || existingUser.profilePicture;
          existingUser.lastLogin = new Date();

          if (name && name !== existingUser.name) {
            existingUser.name = name;
          }

          await existingUser.save();
          console.log('✅ Conflicting user updated successfully');
          return existingUser;
        }
      } catch (updateError) {
        console.error('❌ Failed to resolve duplicate key error:', updateError);
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
    profilePicture: this.profilePicture,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

// ENHANCED: Static method to find user by Firebase UID with better error handling
userSchema.statics.findByFirebaseUID = async function(uid) {
  try {
    console.log('🔍 Finding user by Firebase UID:', uid);
    const user = await this.findOne({ firebaseUID: uid });
    
    if (user) {
      console.log('✅ User found by Firebase UID:', user.email);
    } else {
      console.log('❌ No user found with Firebase UID:', uid);
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error finding user by Firebase UID:', error);
    throw error;
  }
};

// ENHANCED: Add index for better performance
userSchema.index({ firebaseUID: 1 });
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);