// Error tracking service configuration
export const logError = async (error, errorInfo) => {
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.group('Error Boundary Caught Error:');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.groupEnd();
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    try {
      const errorData = {
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // Send to your backend or error tracking service
      await fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
    } catch (loggingError) {
      // Fallback logging if error service fails
      console.error('Failed to log error:', loggingError);
    }
  }
};

export default {
  logError
};
