// frontend/src/services/api.js
import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000, // Increased timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Get fresh token
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
      // Continue with request even if token fails
    }
    
    // Add timestamp to prevent caching issues
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle unauthorized access
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = auth.currentUser;
        if (user) {
          // Try to refresh the token
          const newToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry the original request
          return api(originalRequest);
        } else {
          // User is not authenticated, redirect to login
          console.log('User not authenticated - need to sign in');
          // You can dispatch a logout action here if using Redux
          // or trigger a re-authentication flow
        }
      } catch (tokenError) {
        console.error('Token refresh failed:', tokenError);
        // Force logout if token refresh fails
        try {
          await auth.signOut();
        } catch (signOutError) {
          console.error('Sign out failed:', signOutError);
        }
      }
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your connection and try again.',
      });
    }
    
    // Handle server errors
    if (error.response.status >= 500) {
      console.error('Server error:', error.response.data);
      return Promise.reject({
        ...error,
        message: 'Server error. Please try again later.',
      });
    }
    
    // Handle validation errors
    if (error.response.status === 400) {
      console.error('Validation error:', error.response.data);
    }
    
    // Handle forbidden access
    if (error.response.status === 403) {
      console.error('Forbidden access:', error.response.data);
    }
    
    // Handle not found
    if (error.response.status === 404) {
      console.error('Resource not found:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for common API calls
export const authAPI = {
  // Google Sign-In
  googleSignIn: (userData) => api.post('/auth/google-signin', userData),
  
  // Get current user
  getCurrentUser: () => api.get('/auth/me'),
  
  // Update user profile
  updateProfile: (userData) => api.put('/auth/profile', userData),
  
  // Logout
  logout: () => api.post('/auth/logout'),
  
  // Verify email
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  
  // Resend verification email
  resendVerification: () => api.post('/auth/resend-verification'),
};

export const ticketAPI = {
  // Get available tickets
  getTickets: () => api.get('/tickets'),
  
  // Book tickets
  bookTickets: (bookingData) => api.post('/tickets/book', bookingData),
  
  // Get user's bookings
  getUserBookings: () => api.get('/tickets/my-bookings'),
  
  // Cancel booking
  cancelBooking: (bookingId) => api.delete(`/tickets/booking/${bookingId}`),
  
  // Get booking details
  getBookingDetails: (bookingId) => api.get(`/tickets/booking/${bookingId}`),
};

export const eventAPI = {
  // Get event details
  getEventDetails: () => api.get('/events/garba-2025'),
  
  // Get event updates
  getUpdates: () => api.get('/events/updates'),
  
  // Subscribe to notifications
  subscribeNotifications: (data) => api.post('/events/subscribe', data),
};

// Export default api instance
export default api;