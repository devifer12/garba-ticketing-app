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
  const [backendUser, setBackendUser] = useState(null); // Store backend user data

  // Google Sign-In with enhanced error handling
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      // Set custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      
      // Prepare user data for backend
      const userData = {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber || '',
        firebaseUID: firebaseUser.uid,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified
      };
      
      // Send user data to backend for registration/login
      try {
        const response = await api.post('/auth/google-signin', userData);
        setBackendUser(response.data.user);
        
        console.log('User registered/logged in successfully:', response.data);
        
        // Show success message if needed
        if (response.data.isNewUser) {
          console.log('Welcome! Your account has been created.');
        } else {
          console.log('Welcome back!');
        }
        
        return {
          firebaseUser,
          backendUser: response.data.user,
          isNewUser: response.data.isNewUser
        };
        
      } catch (backendError) {
        console.error('Backend registration failed:', backendError);
        
        // Handle different backend error scenarios
        if (backendError.response?.status === 409) {
          // User already exists, try to fetch user data
          try {
            const userResponse = await api.get('/auth/me');
            setBackendUser(userResponse.data.user);
            return {
              firebaseUser,
              backendUser: userResponse.data.user,
              isNewUser: false
            };
          } catch (fetchError) {
            console.error('Failed to fetch user data:', fetchError);
            throw new Error('Authentication succeeded but failed to sync user data');
          }
        } else {
          throw new Error(backendError.response?.data?.message || 'Failed to sync with backend');
        }
      }
      
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Handle different Firebase error codes
      let errorMessage = 'Sign-in failed. Please try again.';
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Pop-up was blocked. Please allow pop-ups and try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced logout function
  const logout = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear local state
      setUser(null);
      setBackendUser(null);
      
      // Optional: Notify backend about logout
      try {
        await api.post('/auth/logout');
      } catch (logoutError) {
        console.warn('Backend logout notification failed:', logoutError);
        // Don't throw error here as Firebase logout was successful
      }
      
      console.log('Successfully logged out');
      
    } catch (error) {
      console.error('Logout error:', error);
      setError('Logout failed. Please try again.');
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

  // Check if user has completed profile
  const isProfileComplete = () => {
    if (!backendUser) return false;
    return !!(backendUser.name && backendUser.email && backendUser.phone);
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in to Firebase
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            phoneNumber: firebaseUser.phoneNumber
          });

          // Fetch user data from backend
          await fetchUserProfile();
          
        } else {
          // User is signed out
          setUser(null);
          setBackendUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
        setError('Authentication state error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Clear error after some time
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const value = {
    // Firebase user data
    user,
    
    // Backend user data
    backendUser,
    
    // States
    loading,
    error,
    
    // Auth methods
    signInWithGoogle,
    logout,
    
    // Profile methods
    fetchUserProfile,
    updateUserProfile,
    isProfileComplete,
    
    // Utility methods
    setError,
    clearError: () => setError(null),
    
    // Combined user data for convenience
    isAuthenticated: !!(user && backendUser),
    userData: backendUser || user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};