import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import EventForm from './EventForm';
import EventPreview from './EventPreview';

const EventManager = () => {
  const [eventExists, setEventExists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/event/exists')
      .then(res => setEventExists(res.data.exists))
      .catch(() => setError('Failed to fetch event status'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              className="text-6xl mb-6"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              🎪
            </motion.div>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Event Manager</h2>
            <p className="text-slate-400">Please wait while we fetch event information...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
          <div className="text-center">
            <motion.div
              className="text-6xl mb-6"
              animate={{ 
                rotate: [0, -10, 10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              ⚠️
            </motion.div>
            <div className="bg-red-900/50 backdrop-blur-xl rounded-2xl p-6 border border-red-700/30 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-red-300 mb-4">Error Loading Event</h2>
              <p className="text-red-400 mb-6">{error}</p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-lg shadow-lg hover:shadow-red-500/20 transition-all"
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto"
    >
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse" 
            }}
          >
            🎪
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            Event Manager
          </h1>
          
          <motion.div 
            className="w-24 h-1 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full mx-auto mb-6"
            animate={{
              scaleX: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          
          <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30 mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-2xl">
                {eventExists ? '✨' : '🎯'}
              </span>
              <h2 className="text-2xl font-bold text-white">
                {eventExists ? 'Event Preview & Management' : 'Create Your Event'}
              </h2>
            </div>
            
            <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
              eventExists 
                ? 'bg-green-900/50 text-green-300 border border-green-700/30' 
                : 'bg-blue-900/50 text-blue-300 border border-blue-700/30'
            }`}>
              {eventExists ? 'Event Configured' : 'Ready to Create'}
            </span>
          </div>
        </motion.div>

        {/* Content Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-700/30 backdrop-blur-xl rounded-2xl border border-slate-600/30 overflow-hidden"
        >
          {eventExists ? (
            <div className="p-6">
              <EventPreview />
            </div>
          ) : (
            <div className="p-6">
              <EventForm mode="create" />
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default EventManager;