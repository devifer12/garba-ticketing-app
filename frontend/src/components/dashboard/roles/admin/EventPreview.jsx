import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const EventPreview = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await axios.get('/api/event');
        setEvent(res.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Failed to load event details');
        toast.error('Could not load event information');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16"
      >
        <motion.div
          className="text-6xl mb-6"
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          🎪
        </motion.div>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <h3 className="text-xl font-bold text-white mb-2">Loading Your Event</h3>
        <p className="text-slate-400">Fetching event details...</p>
      </motion.div>
    );
  }

  if (error || !event) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16"
      >
        <motion.div
          className="text-6xl mb-6"
          animate={{ 
            rotate: [0, -10, 10, 0]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          😔
        </motion.div>
        <div className="bg-red-900/50 backdrop-blur-xl rounded-2xl p-6 border border-red-700/30 max-w-md mx-auto">
          <h3 className="text-xl font-bold text-red-300 mb-2">Oops! Something went wrong</h3>
          <p className="text-red-400 mb-4">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg"
            onClick={() => window.location.reload()}
          >
            Try Again
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden"
    >
      {/* Header Section */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="text-5xl mb-4"
          animate={{ 
            rotate: [0, 8, -8, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        >
          🎉
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl font-bold font-serif bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent mb-4">
          Event Preview
        </h2>
        
        <motion.div 
          className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full mx-auto mb-6"
          animate={{
            scaleX: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Event Card */}
      <motion.div
        className="bg-gradient-to-br from-slate-700/60 to-slate-800/60 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-600/30 shadow-2xl relative overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 text-8xl">🎪</div>
          <div className="absolute top-20 right-10 text-6xl">✨</div>
          <div className="absolute bottom-10 left-20 text-5xl">🎭</div>
          <div className="absolute bottom-20 right-20 text-7xl">🎨</div>
        </div>

        {/* Event Title */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4 leading-tight">
            {event.name}
          </h1>
          
          <motion.div 
            className="w-32 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mx-auto"
            animate={{
              scaleX: [1, 1.2, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}
          />
        </motion.div>

        {/* Event Details Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Description Card */}
          <motion.div
            className="bg-slate-600/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/30"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📋</span>
              <h3 className="text-xl font-bold text-white">Description</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {event.description || 'No description provided'}
            </p>
          </motion.div>

          {/* Date & Time Card */}
          <motion.div
            className="bg-slate-600/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/30"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📅</span>
              <h3 className="text-xl font-bold text-white">Date & Time</h3>
            </div>
            <div className="space-y-2">
              <p className="text-slate-300 text-lg font-medium">
                {formatDate(event.date)}
              </p>
              {event.time && (
                <p className="text-slate-400">
                  🕐 {formatTime(event.date)}
                </p>
              )}
            </div>
          </motion.div>

          {/* Venue Card */}
          <motion.div
            className="bg-slate-600/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/30 md:col-span-2"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">📍</span>
              <h3 className="text-xl font-bold text-white">Venue</h3>
            </div>
            <p className="text-slate-300 text-lg">
              {event.venue}
            </p>
          </motion.div>
        </motion.div>

        {/* Additional Event Info */}
        {(event.capacity || event.ticketPrice || event.category) && (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {event.capacity && (
              <div className="bg-blue-900/30 backdrop-blur-xl rounded-xl p-4 border border-blue-700/30 text-center">
                <span className="text-2xl block mb-2">👥</span>
                <p className="text-blue-300 font-medium">Capacity</p>
                <p className="text-white text-xl font-bold">{event.capacity}</p>
              </div>
            )}
            
            {event.ticketPrice && (
              <div className="bg-green-900/30 backdrop-blur-xl rounded-xl p-4 border border-green-700/30 text-center">
                <span className="text-2xl block mb-2">💰</span>
                <p className="text-green-300 font-medium">Ticket Price</p>
                <p className="text-white text-xl font-bold">${event.ticketPrice}</p>
              </div>
            )}
            
            {event.category && (
              <div className="bg-purple-900/30 backdrop-blur-xl rounded-xl p-4 border border-purple-700/30 text-center">
                <span className="text-2xl block mb-2">🏷️</span>
                <p className="text-purple-300 font-medium">Category</p>
                <p className="text-white text-xl font-bold">{event.category}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-slate-600/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            onClick={() => navigate('/admin/event/edit')}
          >
            <span className="text-xl">✏️</span>
            Edit Event Details
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-slate-600/50 backdrop-blur-xl text-slate-300 font-medium rounded-xl border border-slate-500/30 hover:bg-slate-600/70 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            onClick={() => navigate('/admin/dashboard')}
          >
            <span className="text-xl">🏠</span>
            Back to Dashboard
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Floating Decorative Elements */}
      <motion.div
        className="absolute -top-6 -right-6 text-4xl opacity-20"
        animate={{ 
          rotate: [0, 360],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        🎊
      </motion.div>

      <motion.div
        className="absolute -bottom-6 -left-6 text-3xl opacity-15"
        animate={{ 
          rotate: [0, -360],
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        🎈
      </motion.div>
    </motion.div>
  );
};

export default EventPreview;