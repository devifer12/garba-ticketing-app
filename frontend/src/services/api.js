import axios from 'axios';
import { auth } from '../firebase';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../utils/constants.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
        config.headers['X-User-UID'] = user.uid;
        config.headers['X-User-Email'] = user.email;
      }
      config.headers['X-Request-Time'] = new Date().toISOString();
      
      if (config.method === 'get') {
        config.params = { ...config.params, _t: Date.now() };
      }
    } catch (error) {
      console.error('Request interceptor error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
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
        } else {
          window.location.href = '/';
        }
      } catch (tokenError) {
        await auth.signOut();
        window.location.href = '/';
      }
    }
    
    return Promise.reject(enhanceError(error));
  }
);

const enhanceError = (error) => {
  const enhanced = { ...error };
  enhanced.isNetworkError = !error.response;
  enhanced.isServerError = error.response?.status >= 500;
  enhanced.isClientError = error.response?.status >= 400 && error.response?.status < 500;
  enhanced.statusCode = error.response?.status;
  enhanced.serverMessage = error.response?.data?.message || error.response?.data?.error;
  
  if (!error.response) {
    enhanced.message = ERROR_MESSAGES.NETWORK;
  } else if (error.response.status >= 500) {
    enhanced.message = ERROR_MESSAGES.SERVER;
  } else {
    const serverMsg = error.response.data?.message || error.response.data?.error;
    enhanced.message = serverMsg || getClientErrorMessage(error.response.status);
  }
  
  return enhanced;
};

const getClientErrorMessage = (status) => {
  const messages = {
    400: ERROR_MESSAGES.INVALID_REQUEST,
    403: ERROR_MESSAGES.ACCESS_FORBIDDEN,
    404: ERROR_MESSAGES.NOT_FOUND,
    409: ERROR_MESSAGES.CONFLICT,
    429: ERROR_MESSAGES.TOO_MANY_REQUESTS
  };
  return messages[status] || `Request failed (${status})`;
};

// API helper function
const createAPI = (endpoints) => {
  const apiMethods = {};
  
  Object.entries(endpoints).forEach(([key, endpoint]) => {
    if (typeof endpoint === 'string') {
      apiMethods[key] = (data, config = {}) => {
        const method = config.method || 'get';
        return api[method](endpoint, method === 'get' ? { params: data } : data, config);
      };
    }
  });
  
  return apiMethods;
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
  getCurrentEvent: () => api.get(API_ENDPOINTS.EVENT.BASE),
  checkEventExists: () => api.get(API_ENDPOINTS.EVENT.EXISTS),
  createEvent: (eventData) => api.post(API_ENDPOINTS.EVENT.BASE, eventData),
  updateEvent: (eventData) => api.put(API_ENDPOINTS.EVENT.BASE, eventData)
};

// Ticket API
export const ticketAPI = {
  createBooking: (bookingData) => api.post(API_ENDPOINTS.TICKETS.BASE, bookingData),
  getMyTickets: () => api.get(API_ENDPOINTS.TICKETS.MY_TICKETS),
  getTicket: (ticketId) => api.get(`${API_ENDPOINTS.TICKETS.BASE}/${ticketId}`),
  cancelTicket: (ticketId) => api.patch(`${API_ENDPOINTS.TICKETS.BASE}/${ticketId}/cancel`),
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
  getTicketStats: () => api.get(API_ENDPOINTS.TICKETS.ADMIN_STATS).catch(() => ({ data: { total: 0, revenue: 0 } })),
  getDashboardAnalytics: () => api.get(API_ENDPOINTS.ADMIN.ANALYTICS),
  getTicketManagement: (params) => api.get(API_ENDPOINTS.ADMIN.TICKET_MANAGEMENT, { params }),
  bulkUpdateTickets: (ticketIds, status) => api.patch(API_ENDPOINTS.ADMIN.BULK_UPDATE, { ticketIds, status }),
  exportTickets: (format) => api.get(API_ENDPOINTS.ADMIN.EXPORT, { params: { format }, responseType: format === 'csv' ? 'text' : 'json' }),
  getSystemHealth: () => api.get(API_ENDPOINTS.ADMIN.SYSTEM_HEALTH)
};

// Utility functions
export const apiUtils = {
  testConnection: async () => {
    try {
      const response = await api.get('/status');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  formatErrorMessage: (error) => {
    return error.serverMessage || 
           error.response?.data?.message || 
           error.response?.data?.error || 
           error.message || 
           'An unexpected error occurred';
  },
  
  isValidQRCode: (qrCode) => /^GARBA2025-\d{13}-[A-Z0-9]{12}-[A-Z0-9]{8}$/.test(qrCode)
};

export default api;