// frontend/src/services/api.js
import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Enable credentials for CORS
});

// Request interceptor - Enhanced token handling
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      
      if (user) {
        // Get fresh Firebase ID token
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
        
        // Add user context headers
        config.headers['X-User-UID'] = user.uid;
        config.headers['X-User-Email'] = user.email;
      }
      
      // Add request timestamp
      config.headers['X-Request-Time'] = new Date().toISOString();
      
      // Add cache-busting for GET requests
      if (config.method === 'get') {
        config.params = {
          ...config.params,
          _t: Date.now()
        };
      }
      
      // Log request in development
      if (import.meta.env.DEV) {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
          params: config.params
        });
      }
      
    } catch (error) {
      console.error('Request interceptor error:', error);
      // Continue without token if there's an error
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor failed:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Enhanced error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error details
    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle 401 Unauthorized - Token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const user = auth.currentUser;
        if (user) {
          console.log('Attempting token refresh...');
          const newToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          console.log('Token refreshed, retrying request...');
          return api(originalRequest);
        } else {
          console.log('No current user for token refresh');
          // Redirect to login or trigger auth flow
          window.location.href = '/';
        }
      } catch (tokenError) {
        console.error('Token refresh failed:', tokenError);
        
        // Force logout on token refresh failure
        try {
          await auth.signOut();
          window.location.href = '/';
        } catch (signOutError) {
          console.error('Force logout failed:', signOutError);
        }
      }
    }
    
    // Handle different error types
    const errorResponse = {
      ...error,
      isNetworkError: !error.response,
      isServerError: error.response?.status >= 500,
      isClientError: error.response?.status >= 400 && error.response?.status < 500,
      statusCode: error.response?.status,
      serverMessage: error.response?.data?.message || error.response?.data?.error
    };
    
    // Network errors
    if (!error.response) {
      console.error('Network error - no response received');
      errorResponse.message = 'Network error. Please check your connection and try again.';
    }
    
    // Server errors (5xx)
    else if (error.response.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data);
      errorResponse.message = 'Server error. Please try again later.';
    }
    
    // Client errors (4xx)
    else if (error.response.status >= 400) {
      const serverMsg = error.response.data?.message || error.response.data?.error;
      
      switch (error.response.status) {
        case 400:
          errorResponse.message = serverMsg || 'Invalid request. Please check your input.';
          break;
        case 403:
          errorResponse.message = serverMsg || 'Access forbidden. Please check your permissions.';
          break;
        case 404:
          errorResponse.message = serverMsg || 'Resource not found.';
          break;
        case 409:
          errorResponse.message = serverMsg || 'Conflict. Resource already exists.';
          break;
        case 429:
          errorResponse.message = 'Too many requests. Please wait and try again.';
          break;
        default:
          errorResponse.message = serverMsg || `Request failed (${error.response.status})`;
      }
    }
    
    return Promise.reject(errorResponse);
  }
);

// Helper function to check API health
export const checkAPIHealth = async () => {
  try {
    const response = await api.get('/status');
    console.log('API Health Check:', response.data);
    return response.data;
  } catch (error) {
    console.error('API Health Check Failed:', error);
    throw error;
  }
};

// Auth API endpoints
export const authAPI = {
  // Google Sign-In with enhanced error handling
  googleSignIn: async (userData) => {
    try {
      console.log('Calling Google Sign-In API...');
      const response = await api.post('/auth/google-signin', userData);
      console.log('Google Sign-In API Success:', response.data);
      return response;
    } catch (error) {
      console.error('Google Sign-In API Error:', error);
      throw error;
    }
  },
  
  // Get current user profile
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      console.error('Get current user failed:', error);
      throw error;
    }
  },
  
  // Alternative endpoint for profile
  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      return response;
    } catch (error) {
      console.error('Get profile failed:', error);
      // Try alternative endpoint
      return await api.get('/auth/me');
    }
  },
  
  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response;
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error;
    }
  },
  
  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response;
    } catch (error) {
      console.error('Logout API failed:', error);
      // Don't throw error for logout API failure
      return null;
    }
  },
  
  // Alternative logout endpoint
  signout: async () => {
    try {
      const response = await api.post('/auth/signout');
      return response;
    } catch (error) {
      console.error('Signout API failed:', error);
      return null;
    }
  }
};

// Event API endpoints - NEW SECTION
export const eventAPI = {
  // Get current event details (public)
  getCurrentEvent: async () => {
    try {
      console.log('Fetching current event...');
      const response = await api.get('/event');
      console.log('Get current event success:', response.data);
      return response;
    } catch (error) {
      console.error('Get current event failed:', error);
      throw error;
    }
  },
  
  // Check if event exists
  checkEventExists: async () => {
    try {
      console.log('Checking if event exists...');
      const response = await api.get('/event/exists');
      console.log('Check event exists success:', response.data);
      return response;
    } catch (error) {
      console.error('Check event exists failed:', error);
      throw error;
    }
  },
  
  // Create new event (admin only)
  createEvent: async (eventData) => {
    try {
      console.log('Creating new event...', eventData);
      const response = await api.post('/event', eventData);
      console.log('Create event success:', response.data);
      return response;
    } catch (error) {
      console.error('Create event failed:', error);
      throw error;
    }
  },
  
  // Update existing event (admin only)
  updateEvent: async (eventData) => {
    try {
      console.log('Updating event...', eventData);
      const response = await api.put('/event', eventData);
      console.log('Update event success:', response.data);
      return response;
    } catch (error) {
      console.error('Update event failed:', error);
      throw error;
    }
  }
};

// Ticket API endpoints
export const ticketAPI = {
  // Create new ticket booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/tickets', bookingData);
      return response;
    } catch (error) {
      console.error('Create booking failed:', error);
      throw error;
    }
  },
  
  // Get user's tickets
  getMyTickets: async () => {
    try {
      const response = await api.get('/tickets/my-tickets');
      return response;
    } catch (error) {
      console.error('Get my tickets failed:', error);
      throw error;
    }
  },
  
  // Get specific ticket
  getTicket: async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response;
    } catch (error) {
      console.error('Get ticket failed:', error);
      throw error;
    }
  },
  
  // Cancel ticket
  cancelTicket: async (ticketId) => {
    try {
      const response = await api.patch(`/tickets/${ticketId}/cancel`);
      return response;
    } catch (error) {
      console.error('Cancel ticket failed:', error);
      throw error;
    }
  }
};

// Admin API endpoints - NEW SECTION
export const adminAPI = {
  // Get all tickets (admin only)
  getAllTickets: async () => {
    try {
      console.log('Fetching all tickets...');
      const response = await api.get('/tickets/admin/all');
      console.log('Get all tickets success:', response.data);
      return response;
    } catch (error) {
      console.error('Get all tickets failed:', error);
      throw error;
    }
  },
  
  // Update ticket status (admin only)
  updateTicketStatus: async (ticketId, status) => {
    try {
      console.log(`Updating ticket ${ticketId} status to ${status}...`);
      const response = await api.patch(`/tickets/admin/${ticketId}/status`, { status });
      console.log('Update ticket status success:', response.data);
      return response;
    } catch (error) {
      console.error('Update ticket status failed:', error);
      throw error;
    }
  },
  
  // Get user count (for dashboard stats)
  getUserCount: async () => {
    try {
      console.log('Fetching user count...');
      const response = await api.get('/admin/users/count');
      console.log('Get user count success:', response.data);
      return response;
    } catch (error) {
      console.error('Get user count failed:', error);
      // Return default data if endpoint doesn't exist yet
      return { data: { count: 0 } };
    }
  },
  
  // Get ticket statistics (for dashboard stats)
  getTicketStats: async () => {
    try {
      console.log('Fetching ticket stats...');
      const response = await api.get('/admin/tickets/stats');
      console.log('Get ticket stats success:', response.data);
      return response;
    } catch (error) {
      console.error('Get ticket stats failed:', error);
      // Return default data if endpoint doesn't exist yet
      return { data: { total: 0, revenue: 0 } };
    }
  },
  
  // Get dashboard analytics
  getDashboardAnalytics: async () => {
    try {
      console.log('Fetching dashboard analytics...');
      const response = await api.get('/admin/analytics/dashboard');
      console.log('Get dashboard analytics success:', response.data);
      return response;
    } catch (error) {
      console.error('Get dashboard analytics failed:', error);
      // Return default data if endpoint doesn't exist yet
      return { 
        data: { 
          totalUsers: 0, 
          totalTickets: 0, 
          totalRevenue: 0,
          recentBookings: [],
          salesChart: []
        } 
      };
    }
  }
};

// Utility functions
export const apiUtils = {
  // Test API connectivity
  testConnection: async () => {
    try {
      const response = await api.get('/status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Test protected endpoint
  testProtectedEndpoint: async () => {
    try {
      const response = await api.get('/protected');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  // Get API configuration
  getConfig: () => ({
    baseURL: api.defaults.baseURL,
    timeout: api.defaults.timeout,
    headers: api.defaults.headers
  }),
  
  // Format error message for user display
  formatErrorMessage: (error) => {
    if (error.serverMessage) {
      return error.serverMessage;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
};

// Export default api instance
export default api;