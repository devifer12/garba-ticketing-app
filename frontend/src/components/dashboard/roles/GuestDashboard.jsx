import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { eventAPI, ticketAPI, apiUtils } from "../../../services/api";
import { toast } from "react-toastify";
import TicketsDetails from "../tickets/TicketsDetails";
import PurchaseTicketModal from "../tickets/PurchaseTicketModal";

const GuestDashboard = () => {
  const { user, backendUser } = useAuth();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user && backendUser) {
      fetchDashboardData();
    }
  }, [user, backendUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch event details and user tickets in parallel
      const [eventResponse, ticketsResponse] = await Promise.all([
        eventAPI.getCurrentEvent().catch(err => {
          console.warn('Failed to fetch event:', err);
          return { data: { data: null } };
        }),
        ticketAPI.getMyTickets().catch(err => {
          console.warn('Failed to fetch tickets:', err);
          return { data: { tickets: [] } };
        })
      ]);

      setEvent(eventResponse.data.data);
      setTickets(ticketsResponse.data.tickets || []);
      
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`Failed to load dashboard: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseTickets = async (quantity) => {
    try {
      setPurchasing(true);
      
      const response = await ticketAPI.createBooking({ quantity });
      
      if (response.data.success) {
        toast.success(`🎉 ${quantity} ticket(s) purchased successfully!`);
        setShowPurchaseModal(false);
        
        // Refresh dashboard data
        await fetchDashboardData();
      }
      
    } catch (err) {
      console.error('Failed to purchase tickets:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      toast.error(`Failed to purchase tickets: ${errorMessage}`);
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return timeString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navratri-orange mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Dashboard</h2>
          <p className="text-slate-400">Please wait while we set up your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/30">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Dashboard</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <motion.button
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-navratri-orange text-white rounded-lg font-semibold hover:bg-navratri-orange/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto mb-8"
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
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              🎭
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4">
              Welcome to Garba Rass 2025!
            </h1>

            <motion.div
              className="w-24 h-1 bg-gradient-to-r from-navratri-orange to-navratri-pink rounded-full mx-auto mb-6"
              animate={{
                scaleX: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />

            <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
              <h2 className="text-2xl font-bold text-white mb-4">
                Ready to Dance the Night Away?
              </h2>
              <p className="text-lg text-slate-300 mb-4">
                You are logged in as{" "}
                <span className="text-navratri-orange font-semibold">Guest</span>
              </p>

              {/* User Info */}
              {(user || backendUser) && (
                <div className="flex items-center justify-center gap-4 mt-6">
                  {user?.photoURL || backendUser?.profilePicture ? (
                    <img
                      src={user?.photoURL || backendUser?.profilePicture}
                      alt={user?.displayName || backendUser?.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-navratri-orange/50"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-navratri-orange to-navratri-yellow flex items-center justify-center text-white font-bold">
                      {(user?.displayName || backendUser?.name)?.charAt(0) || "G"}
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-white font-medium">
                      {user?.displayName || backendUser?.name || "Guest User"}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {user?.email || backendUser?.email}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Event Information Card */}
          {event ? (
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {/* Event Details Card */}
              <div className="bg-slate-700/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-4">{event.name}</h3>
                  <div className="space-y-4">
                    <div className="bg-slate-600/40 rounded-xl p-4">
                      <div className="text-2xl mb-2">📅</div>
                      <h4 className="text-white font-semibold mb-1">Date</h4>
                      <p className="text-slate-300">{formatDate(event.date)}</p>
                    </div>
                    
                    <div className="bg-slate-600/40 rounded-xl p-4">
                      <div className="text-2xl mb-2">🕐</div>
                      <h4 className="text-white font-semibold mb-1">Time</h4>
                      <p className="text-slate-300">
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </p>
                    </div>
                    
                    <div className="bg-slate-600/40 rounded-xl p-4">
                      <div className="text-2xl mb-2">📍</div>
                      <h4 className="text-white font-semibold mb-1">Venue</h4>
                      <p className="text-slate-300">{event.venue}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="bg-gradient-to-br from-navratri-orange/20 to-navratri-yellow/20 backdrop-blur-xl rounded-2xl p-6 border border-navratri-orange/30">
                <div className="text-center">
                  <div className="text-4xl mb-4">🎫</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Get Your Tickets</h3>
                  
                  <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                    <h4 className="text-white font-bold text-xl mb-2">₹{event.ticketPrice}</h4>
                    <p className="text-slate-300 mb-4">per ticket</p>
                    <p className="text-slate-300 text-sm">
                      {event.availableTickets > 0 
                        ? `${event.availableTickets} tickets remaining` 
                        : 'Sold Out!'
                      }
                    </p>
                  </div>
                  
                  {event.availableTickets > 0 ? (
                    <motion.button
                      onClick={() => setShowPurchaseModal(true)}
                      className="w-full px-8 py-4 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300 flex items-center justify-center gap-3"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={purchasing}
                    >
                      <span className="text-xl">🎟️</span>
                      {purchasing ? 'Processing...' : 'Buy Tickets Now'}
                    </motion.button>
                  ) : (
                    <div className="w-full px-8 py-4 bg-red-600/50 text-red-200 font-bold rounded-xl border border-red-500/30">
                      <span className="text-xl mr-2">😔</span>
                      Event Sold Out
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="bg-slate-700/30 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/30 mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-4xl mb-4">🎪</div>
              <h3 className="text-xl font-bold text-white mb-2">Event Information</h3>
              <p className="text-slate-400">Event details will be available soon!</p>
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/30 cursor-pointer"
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => document.getElementById('tickets-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <div className="text-3xl mb-3">🎫</div>
              <h3 className="text-white font-semibold mb-2">My Tickets</h3>
              <p className="text-slate-400 text-sm mb-3">
                View and manage your purchased tickets
              </p>
              <div className="flex items-center text-navratri-orange text-sm font-medium">
                <span>View Tickets ({tickets.length})</span>
                <span className="ml-2">→</span>
              </div>
            </motion.div>

            <motion.div
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/30 cursor-pointer"
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={fetchDashboardData}
            >
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="text-white font-semibold mb-2">Refresh Data</h3>
              <p className="text-slate-400 text-sm mb-3">
                Update your dashboard with latest information
              </p>
              <div className="flex items-center text-navratri-orange text-sm font-medium">
                <span>Refresh Now</span>
                <span className="ml-2">→</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Decorative elements */}
          <div className="flex justify-center mt-8 space-x-4">
            {["🎵", "💃", "🎉", "✨"].map((emoji, index) => (
              <motion.div
                key={index}
                className="text-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3,
                }}
              >
                {emoji}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tickets Section */}
      <div id="tickets-section">
        <TicketsDetails />
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseTicketModal
          event={event}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchaseTickets}
          purchasing={purchasing}
        />
      )}
    </div>
  );
};

export default GuestDashboard;