import { motion } from 'framer-motion';

const ErrorDisplay = ({ 
  error, 
  onRetry, 
  title = "Error", 
  icon = "⚠️",
  className = "" 
}) => {
  return (
    <motion.div
      className={`text-center max-w-md mx-auto p-8 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/30">
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="text-2xl font-bold text-white mb-4">{title}</h2>
        <p className="text-slate-400 mb-6">{error}</p>
        {onRetry && (
          <motion.button
            onClick={onRetry}
            className="px-6 py-3 bg-navratri-orange text-white rounded-lg font-semibold hover:bg-navratri-orange/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorDisplay;