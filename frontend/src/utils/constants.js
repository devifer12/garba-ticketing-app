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
  USED: 'used',
  CANCELLED: 'cancelled'
};

export const VERIFICATION_STATUS = {
  VALID: 'valid',
  USED: 'used',
  CANCELLED: 'cancelled',
  INVALID: 'invalid'
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
  TOO_MANY_REQUESTS: 'Too many requests. Please wait and try again.',
  INVALID_QR_CODE: 'Invalid QR code format.',
  TICKET_NOT_FOUND: 'Ticket not found.',
  TICKET_ALREADY_USED: 'This ticket has already been used.',
  TICKET_CANCELLED: 'This ticket has been cancelled.',
  CAMERA_ACCESS_DENIED: 'Camera access denied. Please allow camera access to scan QR codes.',
  SCANNER_ERROR: 'Scanner error. Please try again.'
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
  },
  slideUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
  }
};

export const QR_CODE_PATTERNS = {
  GARBA_2025: /^GARBA2025-\d{13}-[A-Z0-9]{12}-[A-Z0-9]{8}$/
};

export const SCANNER_CONFIG = {
  MAX_SCANS_PER_SECOND: 5,
  PREFERRED_CAMERA: 'environment',
  HIGHLIGHT_SCAN_REGION: true,
  HIGHLIGHT_CODE_OUTLINE: true,
  OVERLAY_COLOR: 'rgba(0, 0, 0, 0.6)',
  SCAN_BOX_COLOR: '#10b981'
};