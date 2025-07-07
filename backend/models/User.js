const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  // Firebase UID (primary identifier for Google auth)
  firebaseUID: {
    type: String,
    required: true,
    unique: true,
  },

  // Basic user information
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },

  // Google-specific fields
  profilePicture: {
    type: String, // URL to Google profile picture
    default: null,
  },

  // Verification status
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  // User role for authorization
  role: {
    type: String,
    enum: ["guest", "admin", "manager", "qrchecker"],
    default: "guest",
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

// ENHANCED: Static method to find or create user from Google auth
userSchema.statics.findOrCreateGoogleUser = async function (googleUserData) {
  const { uid, email, name, picture, email_verified } = googleUserData;
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 findOrCreateGoogleUser called with:", { uid, email, name });
  }

  try {
    // First, try to find user by Firebase UID
    let user = await this.findOne({ firebaseUID: uid });

    if (user) {
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Existing user found by UID:", user.email);
      }

      // Update last login time only
      user.lastLogin = new Date();
      await user.save();

      return user;
    }

    // If not found by UID, check if there's a user with this email (migration case)
    const existingEmailUser = await this.findOne({ email: email });

    if (existingEmailUser) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "📧 Found user by email, updating with Firebase UID:",
          email,
        );
      }

      // Update existing user with Firebase UID (for migration)
      existingEmailUser.firebaseUID = uid;
      existingEmailUser.lastLogin = new Date();

      // Update profile picture if provided and not already set
      if (picture && !existingEmailUser.profilePicture) {
        existingEmailUser.profilePicture = picture;
      }

      // Update email verification if Google says it's verified
      if (email_verified) {
        existingEmailUser.isEmailVerified = true;
      }

      await existingEmailUser.save();
      if (process.env.NODE_ENV === "development") {
        console.log("✅ Existing email user updated with Firebase UID");
      }

      return existingEmailUser;
    }

    // Create completely new user
    if (process.env.NODE_ENV === "development") {
      console.log("🆕 Creating brand new user for:", email);
    }

    const newUserData = {
      firebaseUID: uid,
      name: name || email.split("@")[0],
      email: email,
      profilePicture: picture || null,
      isEmailVerified: email_verified || false,
      role: "guest", // Set default role
      lastLogin: new Date(),
      createdAt: new Date(),
    };

    if (process.env.NODE_ENV === "development") {
      console.log("📝 New user data being created:", newUserData);
    }

    const newUser = new this(newUserData);
    const savedUser = await newUser.save();

    if (process.env.NODE_ENV === "development") {
      console.log("✅ New user created successfully:", {
        id: savedUser._id,
        email: savedUser.email,
        firebaseUID: savedUser.firebaseUID,
        name: savedUser.name,
      });
    }

    return savedUser;
  } catch (error) {
    console.error(
      "Error in findOrCreateGoogleUser:",
      process.env.NODE_ENV === "development" ? error : error.message,
    );

    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      if (process.env.NODE_ENV === "development") {
        console.log("🔍 Duplicate key error detected");
      }

      // Try to find the conflicting user and return it
      try {
        const conflictUser = await this.findOne({
          $or: [{ firebaseUID: uid }, { email: email }],
        });

        if (conflictUser) {
          if (process.env.NODE_ENV === "development") {
            console.log(
              "✅ Found conflicting user, returning it:",
              conflictUser.email,
            );
          }

          // Update Firebase UID if missing
          if (!conflictUser.firebaseUID) {
            conflictUser.firebaseUID = uid;
            conflictUser.lastLogin = new Date();
            await conflictUser.save();
          }

          return conflictUser;
        }
      } catch (findError) {
        console.error(
          "Failed to resolve duplicate key error:",
          process.env.NODE_ENV === "development"
            ? findError
            : findError.message,
        );
      }
    }

    throw error;
  }
};

// Method to get safe user data (excluding sensitive fields)
userSchema.methods.getSafeUserData = function () {
  return {
    id: this._id,
    firebaseUID: this.firebaseUID,
    name: this.name,
    email: this.email,
    profilePicture: this.profilePicture,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin,
  };
};

// Static method to find user by Firebase UID
userSchema.statics.findByFirebaseUID = async function (uid) {
  try {
    const user = await this.findOne({ firebaseUID: uid });

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Finding user by Firebase UID:", uid);
      if (user) {
        console.log("✅ User found by Firebase UID:", user.email);
      } else {
        console.log("❌ No user found with Firebase UID:", uid);
      }
    }

    return user;
  } catch (error) {
    console.error(
      "Error finding user by Firebase UID:",
      process.env.NODE_ENV === "development" ? error : error.message,
    );
    throw error;
  }
};

module.exports = mongoose.model("User", userSchema);