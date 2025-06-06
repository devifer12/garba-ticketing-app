// frontend/src/components/common/ErrorNotification.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const ErrorNotification = () => {
  const { error, clearError } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(clearError, 300); // Clear after animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(clearError, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && error && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-full mx-4"
        >
          <div className="bg-red-500/90 backdrop-blur-xl border border-red-400/30 rounded-xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              {/* Error Icon */}
              <motion.div
                className="flex-shrink-0 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <svg 
                  className="w-4 h-4 text-white" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </motion.div>

              {/* Error Message */}
              <div className="flex-1">
                <h4 className="text-white font-semibold text-sm mb-1">
                  Authentication Error
                </h4>
                <p className="text-red-100 text-sm leading-relaxed">
                  {error}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="flex-shrink-0 text-red-200 hover:text-white transition-colors duration-200 p-1 rounded-full hover:bg-red-600/50"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <motion.div
              className="mt-3 h-1 bg-red-600/30 rounded-full overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <motion.div
                className="h-full bg-red-300"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ErrorNotification;