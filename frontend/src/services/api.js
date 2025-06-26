import axios from 'axios';
import { auth } from '../firebase';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../utils/constants.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000, // Reduced from 30000 to 10000
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
});

// Optimized request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        // Use cached token when possible
        const token = await user.getIdToken(false); // Don't force refresh
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Request interceptor error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Simplified response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const user = auth.currentUser;
        if (user) {
          const newToken = await user.getIdToken(true);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (tokenError) {
        console.error('Token refresh failed:', tokenError);
      }
    }
    
    return Promise.reject(enhanceError(error));
  }
);

const enhanceError = (error) => {
  if (!error.response) {
    error.message = ERROR_MESSAGES.NETWORK;
  } else if (error.response.status >= 500) {
    error.message = ERROR_MESSAGES.SERVER;
  } else {
    const serverMsg = error.response.data?.message || error.response.data?.error;
    error.message = serverMsg || `Request failed (${error.response.status})`;
  }
  return error;
};

// Auth API
export const authAPI = {
  googleSignIn: (userData) => api.post(API_ENDPOINTS.AUTH.GOOGLE_SIGNIN, userData),
  getCurrentUser: () => api.get(API_ENDPOINTS.AUTH.ME),
  getProfile: () => api.get(API_ENDPOINTS.AUTH.PROFILE).catch(() => api.get(API_ENDPOINTS.AUTH.ME)),
  updateProfile: (userData) => api.put(API_ENDPOINTS.AUTH.PROFILE, userData),
  assignAdminRole: () => api.post(API_ENDPOINTS.AUTH.ASSIGN_ADMIN),
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => null)
};

// Event API
export const eventAPI = {
  getCurrentEvent: () => api.get('/event'),
  checkEventExists: () => api.get('/event/exists'),
  createEvent: (eventData) => api.post('/event', eventData),
  updateEvent: (eventData) => api.put('/event', eventData)
};

// Ticket API
export const ticketAPI = {
  createBooking: (bookingData) => api.post(API_ENDPOINTS.TICKETS.BASE, bookingData),
  getMyTickets: () => api.get(API_ENDPOINTS.TICKETS.MY_TICKETS),
  getTicket: (ticketId) => api.get(`${API_ENDPOINTS.TICKETS.BASE}/${ticketId}`),
  verifyQRCode: (qrCode) => api.post(API_ENDPOINTS.TICKETS.VERIFY_QR, { qrCode }),
  markTicketAsUsed: (qrCode) => api.post(API_ENDPOINTS.TICKETS.MARK_USED, { qrCode })
};

// Admin API
export const adminAPI = {
  getAllTickets: (params) => api.get(API_ENDPOINTS.TICKETS.ADMIN_ALL, { params }),
  updateTicketStatus: (ticketId, status) => api.patch(`${API_ENDPOINTS.TICKETS.BASE}/admin/${ticketId}/status`, { status }),
  getUserCount: () => api.get(API_ENDPOINTS.ADMIN.USER_COUNT).catch(() => ({ data: { count: 0 } })),
  getAllUsers: (params) => api.get(API_ENDPOINTS.ADMIN.USERS, { params }),
  updateUserRole: (userId, role) => api.patch(`${API_ENDPOINTS.ADMIN.USERS}/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`),
  getTicketStats: () => api.get(API_ENDPOINTS.TICKETS.ADMIN_STATS).catch(() => ({ data: { total: 0, revenue: 0 } })),
  getDashboardAnalytics: () => api.get(API_ENDPOINTS.ADMIN.ANALYTICS),
  getTicketManagement: (params) => api.get(API_ENDPOINTS.ADMIN.TICKET_MANAGEMENT, { params }),
  bulkUpdateTickets: (ticketIds, status) => api.patch(API_ENDPOINTS.ADMIN.BULK_UPDATE, { ticketIds, status }),
  exportTickets: (format) => api.get(API_ENDPOINTS.ADMIN.EXPORT, { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
  getSystemHealth: () => api.get(API_ENDPOINTS.ADMIN.SYSTEM_HEALTH)
};

// Utility functions
export const apiUtils = {
  formatErrorMessage: (error) => {
    return error.response?.data?.message || 
           error.response?.data?.error || 
           error.message || 
           'An unexpected error occurred';
  }
};

export default api;