import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";
import api from "../services/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const clearError = () => setError(null);

  const clearUserState = () => {
    setUser(null);
    setBackendUser(null);
    setError(null);
  };

  // Optimized backend sync
  const syncUserWithBackend = async (firebaseUser) => {
    try {
      const idToken = await firebaseUser.getIdToken(false); // Use cached token
      const response = await api.post("/auth/google-signin", { idToken });
      setBackendUser(response.data.user);
      return { user: response.data.user, isNewUser: response.data.isNewUser };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Backend sync failed:", error);
      }
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      clearUserState();

      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      provider.setCustomParameters({
        prompt: "select_account",
        // Add parameters to help with COOP issues
        hd: undefined, // Remove hosted domain restriction
      });

      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
      });

      const syncResult = await syncUserWithBackend(firebaseUser);

      return {
        firebaseUser,
        backendUser: syncResult.user,
        isNewUser: syncResult.isNewUser,
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Google Sign-In Error:", error);
      }
      clearUserState();

      let errorMessage = "Sign-in failed. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in was cancelled.";
      } else if (error.code === "auth/popup-blocked") {
        errorMessage =
          "Pop-up was blocked. Please allow pop-ups for this site.";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);

      // Call backend logout first (before clearing state)
      try {
        await api.post("/auth/logout");
      } catch (backendError) {
        // Ignore backend logout errors as they're not critical
        if (process.env.NODE_ENV === "development") {
          console.log("Backend logout error (ignored):", backendError.message);
        }
      }

      // Clear state and sign out from Firebase
      clearUserState();
      await signOut(auth);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Logout error:", error);
      }
      // Don't show error for logout - just clear state
      clearUserState();
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/me");
      setBackendUser(response.data.user);
      return response.data.user;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to fetch user profile:", error);
      }
      return null;
    }
  };

  const updateUserProfile = async (userData) => {
    try {
      const response = await api.put("/auth/profile", userData);
      setBackendUser(response.data.user);
      return response.data.user;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Failed to update user profile:", error);
      }
      throw error;
    }
  };

  // Optimized auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          });

          // Only sync if we don't have backend user or it's different
          if (!backendUser || backendUser.firebaseUID !== firebaseUser.uid) {
            await syncUserWithBackend(firebaseUser);
          }
        } else {
          clearUserState();
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Auth state change error:", error);
        }
        setError("Authentication error occurred");
      } finally {
        setInitializing(false);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [backendUser]);

  // Auto-clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const value = {
    user,
    backendUser,
    loading,
    initializing,
    error,
    isAuthenticated: !!user,
    signInWithGoogle,
    logout,
    fetchUserProfile,
    updateUserProfile,
    setError,
    clearError,
    refreshUserData: fetchUserProfile,
    hasUser: !!user,
    hasBackendUser: !!backendUser,
    userEmail: user?.email || backendUser?.email,
    userName: user?.displayName || backendUser?.name,
    userPhoto: user?.photoURL || backendUser?.photoURL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};