import axios from "axios";
import { auth } from "../firebase";
import { API_ENDPOINTS, ERROR_MESSAGES } from "../utils/constants.js";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 8000, // Further reduced for faster failures
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
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
      console.error("Request interceptor error:", error);
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
        console.error("Token refresh failed:", tokenError);
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
    const serverMsg =
      error.response.data?.message || error.response.data?.error;
    error.message = serverMsg || `Request failed (${error.response.status})`;
  }
  return error;
};

// Auth API
export const authAPI = {
  googleSignIn: (userData) =>
    api.post(API_ENDPOINTS.AUTH.GOOGLE_SIGNIN, userData),
  getCurrentUser: () => api.get(API_ENDPOINTS.AUTH.ME),
  getProfile: () =>
    api
      .get(API_ENDPOINTS.AUTH.PROFILE)
      .catch(() => api.get(API_ENDPOINTS.AUTH.ME)),
  updateProfile: (userData) => api.put(API_ENDPOINTS.AUTH.PROFILE, userData),
  assignAdminRole: () => api.post(API_ENDPOINTS.AUTH.ASSIGN_ADMIN),
  logout: () => api.post(API_ENDPOINTS.AUTH.LOGOUT).catch(() => null),
};

// Event API with caching
export const eventAPI = {
  getCurrentEvent: (signal) => api.get("/event", { signal }),
  checkEventExists: (signal) => api.get("/event/exists", { signal }),
  createEvent: (eventData, signal) => api.post("/event", eventData, { signal }),
  updateEvent: (eventData, signal) => api.put("/event", eventData, { signal }),
};

// Ticket API with signal support
export const ticketAPI = {
  createBooking: (bookingData, signal) =>
    api.post(API_ENDPOINTS.TICKETS.BASE, bookingData, { signal }),
  getMyTickets: (signal) =>
    api.get(API_ENDPOINTS.TICKETS.MY_TICKETS, { signal }),
  getTicket: (ticketId, signal) =>
    api.get(`${API_ENDPOINTS.TICKETS.BASE}/${ticketId}`, { signal }),
  verifyQRCode: (qrCode, signal) =>
    api.post(API_ENDPOINTS.TICKETS.VERIFY_QR, { qrCode }, { signal }),
  markTicketAsUsed: (qrCode, signal) =>
    api.post(API_ENDPOINTS.TICKETS.MARK_USED, { qrCode }, { signal }),
};

// Admin API with signal support and error handling
export const adminAPI = {
  getAllTickets: (params, signal) =>
    api.get(API_ENDPOINTS.TICKETS.ADMIN_ALL, { params, signal }),
  updateTicketStatus: (ticketId, status, signal) =>
    api.patch(
      `${API_ENDPOINTS.TICKETS.BASE}/admin/${ticketId}/status`,
      { status },
      { signal }
    ),
  getUserCount: (signal) =>
    api
      .get(API_ENDPOINTS.ADMIN.USER_COUNT, { signal })
      .catch(() => ({ data: { count: 0 } })),
  getAllUsers: (params, signal) =>
    api.get(API_ENDPOINTS.ADMIN.USERS, { params, signal }),
  updateUserRole: (userId, role, signal) =>
    api.patch(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/role`,
      { role },
      { signal }
    ),
  deleteUser: (userId, signal) =>
    api.delete(`${API_ENDPOINTS.ADMIN.USERS}/${userId}`, { signal }),
  deleteTicket: (ticketId, signal) =>
    api.delete(`${API_ENDPOINTS.ADMIN.TICKETS}/${ticketId}`, { signal }),
  getTicketStats: (signal) =>
    api
      .get(API_ENDPOINTS.TICKETS.ADMIN_STATS, { signal })
      .catch(() => ({ data: { total: 0, revenue: 0 } })),
  getDashboardAnalytics: (signal) =>
    api.get(API_ENDPOINTS.ADMIN.ANALYTICS, { signal }),
  getTicketManagement: (params, signal) =>
    api.get(API_ENDPOINTS.ADMIN.TICKET_MANAGEMENT, { params, signal }),
  bulkUpdateTickets: (ticketIds, status, signal) =>
    api.patch(
      API_ENDPOINTS.ADMIN.BULK_UPDATE,
      { ticketIds, status },
      { signal }
    ),
  exportTickets: (format, signal) =>
    api.get(API_ENDPOINTS.ADMIN.EXPORT, {
      params: { format },
      responseType: format === "csv" ? "text" : "json",
      signal,
    }),
  getSystemHealth: (signal) =>
    api.get(API_ENDPOINTS.ADMIN.SYSTEM_HEALTH, { signal }),
};

// Utility functions
export const apiUtils = {
  formatErrorMessage: (error) => {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "An unexpected error occurred"
    );
  },
};

export default api;