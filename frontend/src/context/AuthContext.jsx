// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../firebase';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [syncInProgress, setSyncInProgress] = useState(false); // Add sync state

  // Clear error function
  const clearError = () => {
    setError(null);
  };

  // Clear all user state - FIXED: Complete state reset
  const clearUserState = () => {
    console.log('🧹 Clearing all user state...');
    setUser(null);
    setBackendUser(null);
    setSyncInProgress(false);
    setError(null);
  };

  // Sync user with backend - FIXED: Always sync, don't skip
  const syncUserWithBackend = async (firebaseUser, force = false) => {
    // Prevent multiple simultaneous syncs for the same user
    if (syncInProgress && !force) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    try {
      setSyncInProgress(true);
      console.log('🔄 Syncing user with backend:', firebaseUser.uid);
      
      // Get fresh Firebase ID token
      const idToken = await firebaseUser.getIdToken(true); // Force refresh
      
      const requestData = {
        idToken: idToken
      };
      
      console.log('📤 Sending to backend:', { idToken: 'present', uid: firebaseUser.uid });
      
      // Send to backend
      const response = await api.post('/auth/google-signin', requestData);
      
      console.log('✅ Backend sync successful:', {
        email: response.data.user.email,
        uid: response.data.user.firebaseUID
      });
      
      setBackendUser(response.data.user);
      
      return {
        user: response.data.user,
        isNewUser: response.data.isNewUser
      };
      
    } catch (error) {
      console.error('❌ Backend sync failed:', error);
      
      // Create fallback user data from Firebase
      const fallbackUser = {
        name: firebaseUser.displayName || '',
        email: firebaseUser.email,
        firebaseUID: firebaseUser.uid,
        photoURL: firebaseUser.photoURL || '',
        emailVerified: firebaseUser.emailVerified,
        _fromFirebase: true
      };
      
      setBackendUser(fallbackUser);
      
      // Don't throw error - allow app to continue with Firebase data
      return { user: fallbackUser, isNewUser: false };
    } finally {
      setSyncInProgress(false);
    }
  };

  // Enhanced Google Sign-In
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🚀 Starting Google Sign-In...');
      
      // FIXED: Clear existing state before new sign-in
      clearUserState();
      
      // Configure Google Auth Provider
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      console.log('🔥 Firebase authentication successful:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });
      
      // Set Firebase user immediately
      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
      });
      
      // Sync with backend with force flag
      const syncResult = await syncUserWithBackend(firebaseUser, true);
      
      console.log('✅ User sign-in complete:', {
        firebaseUID: firebaseUser.uid,
        backendEmail: syncResult.user.email
      });
      
      return {
        firebaseUser,
        backendUser: syncResult.user,
        isNewUser: syncResult.isNewUser
      };
      
    } catch (error) {
      console.error('❌ Google Sign-In Error:', error);
      
      // Clear state on error
      clearUserState();
      
      // Handle specific Firebase errors
      let errorMessage = 'Sign-in failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked. Please allow pop-ups for this site.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in was cancelled.';
      } else if (error.code === 'auth/internal-error') {
        errorMessage = 'Authentication error. Please try again.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout - FIXED: Complete state cleanup
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🚪 Starting logout...');
      
      // Clear local state first
      clearUserState();
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Notify backend (optional, don't wait)
      api.post('/auth/logout').catch(err => {
        console.warn('⚠️ Backend logout notification failed:', err);
      });
      
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError('Logout failed. Please try refreshing the page.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      console.log('📊 Fetching user profile...');
      const response = await api.get('/auth/me');
      setBackendUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    try {
      console.log('📝 Updating user profile:', userData);
      const response = await api.put('/auth/profile', userData);
      setBackendUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
      throw error;
    }
  };

  // Auth state listener - FIXED: Always sync when user changes
  useEffect(() => {
    console.log('👂 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('🔄 Auth state changed:', firebaseUser ? `User: ${firebaseUser.email}` : 'No user');
        
        if (firebaseUser) {
          // Set Firebase user
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
          });

          // FIXED: Always sync with backend, check if it's a different user
          const shouldSync = !backendUser || 
                           backendUser.firebaseUID !== firebaseUser.uid ||
                           backendUser.email !== firebaseUser.email;
          
          if (shouldSync) {
            console.log('🔄 Syncing with backend - user changed or no backend user');
            await syncUserWithBackend(firebaseUser, true);
          } else {
            console.log('✅ Backend user already synced for this Firebase user');
          }
          
        } else {
          // User signed out - clear all state
          console.log('🚪 User signed out, clearing state');
          clearUserState();
        }
        
      } catch (error) {
        console.error('❌ Auth state change error:', error);
        setError('Authentication error occurred');
      }
    });

    // Mark initialization as complete after first auth check
    const initTimer = setTimeout(() => {
      setInitializing(false);
      setLoading(false);
    }, 1000);

    return () => {
      unsubscribe();
      clearTimeout(initTimer);
    };
  }, []); // FIXED: Remove backendUser dependency to prevent stale closures

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Context value
  const value = {
    // User data
    user,
    backendUser,
    userData: backendUser || user,
    
    // Auth state
    loading,
    initializing,
    error,
    isAuthenticated: !!user,
    syncInProgress,
    
    // Auth methods
    signInWithGoogle,
    logout,
    
    // Profile methods
    fetchUserProfile,
    updateUserProfile,
    
    // Utility methods
    setError,
    clearError,
    clearUserState, // Add this for manual state clearing
    
    // Helper methods
    refreshUserData: fetchUserProfile,
    
    // Convenience methods
    hasUser: !!user,
    hasBackendUser: !!backendUser,
    userEmail: user?.email || backendUser?.email,
    userName: user?.displayName || backendUser?.name,
    userPhoto: user?.photoURL || backendUser?.photoURL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};