// Shared constants and configurations
export const NAVRATRI_COLORS = [
  "navratri-red", "navratri-orange", "navratri-yellow", "navratri-green",
  "navratri-blue", "navratri-indigo", "navratri-violet", "navratri-pink", "navratri-white"
];

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  QR_CHECKER: 'qrchecker',
  GUEST: 'guest'
};

export const TICKET_STATUS = {
  ACTIVE: 'active',
  USED: 'used'
};

export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE_SIGNIN: '/auth/google-signin',
    ME: '/auth/me',
    PROFILE: '/auth/profile',
    ASSIGN_ADMIN: '/auth/assign-admin',
    LOGOUT: '/auth/logout'
  },
  EVENT: {
    BASE: '/event',
    EXISTS: '/event/exists'
  },
  TICKETS: {
    BASE: '/tickets',
    MY_TICKETS: '/tickets/my-tickets',
    VERIFY_QR: '/tickets/verify-qr',
    MARK_USED: '/tickets/mark-used',
    ADMIN_ALL: '/tickets/admin/all',
    ADMIN_STATS: '/tickets/admin/stats'
  },
  ADMIN: {
    USERS: '/admin/users',
    USER_COUNT: '/admin/users/count',
    ANALYTICS: '/admin/analytics/dashboard',
    DELETE_USER: '/admin/users/:userId',
    TICKET_MANAGEMENT: '/admin/tickets/management',
    BULK_UPDATE: '/admin/tickets/bulk-update',
    EXPORT: '/admin/tickets/export',
    SYSTEM_HEALTH: '/admin/system/health'
  }
};

export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  SERVER: 'Server error. Please try again later.',
  AUTH_FAILED: 'Authentication failed. Please try again.',
  INVALID_REQUEST: 'Invalid request. Please check your input.',
  ACCESS_FORBIDDEN: 'Access forbidden. Please check your permissions.',
  NOT_FOUND: 'Resource not found.',
  CONFLICT: 'Conflict. Resource already exists.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait and try again.'
};

export const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  },
  item: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  },
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  }
};