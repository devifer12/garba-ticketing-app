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

  // Enhanced Google Sign-In with proper error handling
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Configure provider for better UX
      provider.setCustomParameters({
        prompt: 'select_account',
        hd: undefined // Remove domain restriction
      });
      
      console.log('Starting Google sign-in...');
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      console.log('Firebase auth successful:', {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName
      });

      // Get Firebase ID token
      const idToken = await firebaseUser.getIdToken();
      
      // Prepare user data for backend
      const userData = {
        name: firebaseUser.displayName || '',
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || '',
        firebaseUID: firebaseUser.uid,
        photoURL: firebaseUser.photoURL || '',
        emailVerified: firebaseUser.emailVerified,
        idToken: idToken
      };
      
      console.log('Sending user data to backend:', userData);
      
      // Send to backend with retry logic
      let backendResponse = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries && !backendResponse) {
        try {
          backendResponse = await api.post('/auth/google-signin', userData);
          console.log('Backend response:', backendResponse.data);
          break;
        } catch (backendError) {
          retryCount++;
          console.error(`Backend sync attempt ${retryCount} failed:`, backendError);
          
          if (retryCount >= maxRetries) {
            // If backend sync fails completely, still allow Firebase auth
            console.warn('Backend sync failed after all retries, proceeding with Firebase auth only');
            setBackendUser({
              name: firebaseUser.displayName,
              email: firebaseUser.email,
              phone: firebaseUser.phoneNumber || '',
              firebaseUID: firebaseUser.uid,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              _fromFirebase: true // Flag to indicate this is Firebase-only data
            });
            break;
          }
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
      
      if (backendResponse) {
        setBackendUser(backendResponse.data.user);
        
        // Show appropriate welcome message
        if (backendResponse.data.isNewUser) {
          console.log('Welcome! Account created successfully.');
        } else {
          console.log('Welcome back!');
        }
      }
      
      return {
        firebaseUser,
        backendUser: backendResponse?.data?.user || backendUser,
        isNewUser: backendResponse?.data?.isNewUser || false
      };
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle specific Firebase errors
      let errorMessage = 'Sign-in failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up blocked. Please allow pop-ups for this site.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Check your connection.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Sign-in cancelled. Please try again.';
      } else if (error.code === 'auth/internal-error') {
        errorMessage = 'Authentication service error. Please try again.';
      } else if (error.message && error.message.includes('CORS')) {
        errorMessage = 'Browser security error. Please try refreshing the page.';
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout with proper cleanup
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('Starting logout process...');
      
      // Clear local state immediately
      setUser(null);
      setBackendUser(null);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Notify backend (don't wait for this)
      api.post('/auth/logout').catch(err => {
        console.warn('Backend logout notification failed:', err);
      });
      
      console.log('Logout successful');
      
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed. Please refresh the page.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile from backend
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setBackendUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Don't throw here, just return null
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      setBackendUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  // Check if user profile is complete
  const isProfileComplete = () => {
    if (!backendUser) return false;
    return !!(backendUser.name && backendUser.email);
  };

  // Enhanced auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        console.log('Auth state changed:', firebaseUser ? 'User signed in' : 'User signed out');
        
        if (firebaseUser) {
          // Set Firebase user data
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            phoneNumber: firebaseUser.phoneNumber
          });

          // Try to fetch backend user data
          const backendUserData = await fetchUserProfile();
          
          // If no backend user data, create fallback from Firebase
          if (!backendUserData) {
            console.log('No backend user data, using Firebase data');
            setBackendUser({
              name: firebaseUser.displayName || '',
              email: firebaseUser.email,
              phone: firebaseUser.phoneNumber || '',
              firebaseUID: firebaseUser.uid,
              photoURL: firebaseUser.photoURL || '',
              emailVerified: firebaseUser.emailVerified,
              _fromFirebase: true
            });
          }
          
        } else {
          // User signed out
          setUser(null);
          setBackendUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError('Authentication error occurred');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Auto-clear errors
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
    
    // Auth state
    loading,
    error,
    isAuthenticated: !!user,
    isProfileComplete: isProfileComplete(),
    
    // Auth methods
    signInWithGoogle,
    logout,
    
    // Profile methods
    fetchUserProfile,
    updateUserProfile,
    
    // Utility methods
    setError,
    clearError: () => setError(null),
    
    // Combined user data for convenience
    userData: backendUser || user,
    
    // Helper methods
    refreshUserData: fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};