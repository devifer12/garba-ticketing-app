// Shared utility functions
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'TBD';
  const defaultOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  return new Date(dateString).toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  try {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return timeString;
  }
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  const colors = {
    active: 'bg-green-900/30 text-green-300 border-green-700/30',
    used: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
    cancelled: 'bg-red-900/30 text-red-300 border-red-700/30'
  };
  return colors[status] || colors.active;
};

export const getRoleColor = (role) => {
  const colors = {
    admin: 'bg-red-900/30 text-red-300 border-red-700/30',
    manager: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
    qrchecker: 'bg-green-900/30 text-green-300 border-green-700/30',
    guest: 'bg-gray-900/30 text-gray-300 border-gray-700/30'
  };
  return colors[role] || colors.guest;
};

export const getStatusIcon = (status) => {
  const icons = { active: '✅', used: '🎯', cancelled: '❌' };
  return icons[status] || '🎫';
};

export const validateTimeFormat = (timeString) => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateURL = (url) => {
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  return urlRegex.test(url);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};