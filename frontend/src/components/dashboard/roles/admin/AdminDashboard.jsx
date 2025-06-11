import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { eventAPI, adminAPI, apiUtils } from '../../../../services/api';
import EventManager from './eventManager';

const AdminDashboard = () => {
  const { user, backendUser } = useAuth();
  const [eventStatus, setEventStatus] = useState({
    exists: false,
    loading: true,
    error: null,
    eventData: null
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    totalRevenue: 0,
    loading: true
  });
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      await Promise.all([
        checkEventStatus(),
        fetchDashboardStats()
      ]);
    };

    initializeDashboard();
  }, []);

  const checkEventStatus = async () => {
    try {
      setEventStatus(prev => ({ ...prev, loading: true, error: null }));
      
      // Check if event exists
      const existsResponse = await eventAPI.checkEventExists();
      const exists = existsResponse.data.exists;
      
      let eventData = null;
      if (exists) {
        try {
          // If event exists, fetch its details
          const eventResponse = await eventAPI.getCurrentEvent();
          eventData = eventResponse.data.data;
        } catch (eventError) {
          console.warn('Event exists but could not fetch details:', eventError);
        }
      }
      
      setEventStatus({
        exists,
        loading: false,
        error: null,
        eventData
      });
      
    } catch (err) {
      console.error('Failed to check event status:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      
      setEventStatus({
        exists: false,
        loading: false,
        error: errorMessage,
        eventData: null
      });
      
      toast.error(`Failed to load event status: ${errorMessage}`);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Fetch all dashboard statistics
      const [usersResponse, ticketStatsResponse] = await Promise.all([
        adminAPI.getUserCount().catch(err => {
          console.warn('Failed to fetch user count:', err);
          return { data: { count: 0 } };
        }),
        adminAPI.getTicketStats().catch(err => {
          console.warn('Failed to fetch ticket stats:', err);
          return { data: { total: 0, revenue: 0 } };
        })
      ]);
      
      setStats({
        totalUsers: usersResponse.data.count || 0,
        totalTickets: ticketStatsResponse.data.total || 0,
        totalRevenue: ticketStatsResponse.data.revenue || 0,
        loading: false
      });
      
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setStats({
        totalUsers: 0,
        totalTickets: 0,
        totalRevenue: 0,
        loading: false
      });
    }
  };

  // Fixed route handlers
  const handleCreateEvent = () => {
    navigate('/admin/event/create');
  };

  const handleEditEvent = () => {
    if (eventStatus.eventData) {
      navigate('/admin/event/edit', { state: { eventData: eventStatus.eventData } });
    } else {
      navigate('/admin/event/edit');
    }
  };

  const handleViewEvent = () => {
    if (eventStatus.eventData) {
      navigate('/admin/event/manage', { state: { eventData: eventStatus.eventData } });
    } else {
      navigate('/admin/event/manage');
    }
  };

  const handleManageUsers = () => {
    navigate('/admin/users');
  };

  const handleManageTickets = () => {
    navigate('/admin/tickets');
  };

  const handleViewAnalytics = () => {
    navigate('/admin/analytics');
  };

  const handleViewSettings = () => {
    navigate('/admin/settings');
  };

  const refreshDashboard = async () => {
    await Promise.all([
      checkEventStatus(),
      fetchDashboardStats()
    ]);
    toast.success('Dashboard refreshed');
  };

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
            👑
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
            Admin Dashboard
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
          
          <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">
                Welcome, Administrator! 
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshDashboard}
                className="px-4 py-2 bg-slate-600/50 hover:bg-slate-600/70 rounded-lg border border-slate-500/30 text-white text-sm font-medium transition-all"
              >
                🔄 Refresh
              </motion.button>
            </div>
            <p className="text-lg text-slate-300 mb-4">
              You are <span className="text-red-400 font-semibold">Admin</span>
            </p>
            
            {/* User Info */}
            {(user || backendUser) && (
              <div className="flex items-center justify-center gap-4 mt-6">
                {(user?.photoURL || backendUser?.profilePicture) ? (
                  <img
                    src={user?.photoURL || backendUser?.profilePicture}
                    alt={user?.displayName || backendUser?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-red-400/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-500 to-yellow-500 flex items-center justify-center text-white font-bold">
                    {(user?.displayName || backendUser?.name)?.charAt(0) || 'A'}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-white font-medium">
                    {user?.displayName || backendUser?.name || 'Administrator'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {user?.email || backendUser?.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-xl rounded-xl p-6 border border-blue-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-blue-300 font-medium mb-1">Total Users</h3>
            {stats.loading ? (
              <div className="animate-pulse bg-blue-700/30 h-8 w-16 rounded"></div>
            ) : (
              <p className="text-white text-2xl font-bold">{stats.totalUsers}</p>
            )}
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-xl rounded-xl p-6 border border-green-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">🎫</div>
            <h3 className="text-green-300 font-medium mb-1">Tickets Sold</h3>
            {stats.loading ? (
              <div className="animate-pulse bg-green-700/30 h-8 w-16 rounded"></div>
            ) : (
              <p className="text-white text-2xl font-bold">{stats.totalTickets}</p>
            )}
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-xl rounded-xl p-6 border border-purple-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-purple-300 font-medium mb-1">Total Revenue</h3>
            {stats.loading ? (
              <div className="animate-pulse bg-purple-700/30 h-8 w-16 rounded"></div>
            ) : (
              <p className="text-white text-2xl font-bold">${stats.totalRevenue}</p>
            )}
          </motion.div>
        </motion.div>

        {/* Event Status Card */}
        <motion.div 
          className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-6 border border-slate-600/30 shadow-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎪</span>
              Event Status
            </h3>
            {!eventStatus.loading && (
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                eventStatus.exists 
                  ? 'bg-green-900/50 text-green-300 border border-green-700/30' 
                  : 'bg-red-900/50 text-red-300 border border-red-700/30'
              }`}>
                {eventStatus.exists ? 'Configured' : 'Not Configured'}
              </span>
            )}
          </div>
          
          {eventStatus.loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-yellow-500"></div>
              <span className="ml-2 text-slate-300">Loading event status...</span>
            </div>
          ) : eventStatus.error ? (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                <span>⚠️</span>
                <span className="font-medium">Error Loading Event Status</span>
              </div>
              <p className="text-red-300 text-sm">{eventStatus.error}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkEventStatus}
                className="mt-3 px-4 py-2 bg-red-600/50 hover:bg-red-600/70 text-white text-sm rounded-lg transition-all"
              >
                Retry
              </motion.button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-slate-300 text-sm mb-2">
                  {eventStatus.exists
                    ? 'The event is currently configured and active.'
                    : 'No event has been created yet.'}
                </p>
                
                {/* Show event details if available */}
                {eventStatus.eventData && (
                  <div className="bg-slate-700/30 rounded-lg p-4 mb-4">
                    <h4 className="text-white font-medium mb-2">{eventStatus.eventData.name}</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Date:</span>
                        <span className="text-white ml-2">
                          {new Date(eventStatus.eventData.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Venue:</span>
                        <span className="text-white ml-2">{eventStatus.eventData.venue}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Available Tickets:</span>
                        <span className="text-white ml-2">
                          {eventStatus.eventData.availableTickets} / {eventStatus.eventData.totalTickets}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Ticket Price:</span>
                        <span className="text-white ml-2">${eventStatus.eventData.ticketPrice}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {!eventStatus.exists ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateEvent}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                  >
                    <span>✨</span>
                    Create Event
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleViewEvent}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                    >
                      <span>👀</span>
                      Manage Event
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleEditEvent}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-medium rounded-lg transition-all flex items-center gap-2"
                    >
                      <span>✏️</span>
                      Edit Event
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Management Action Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {/* User Management */}
          <motion.div
            className="bg-gradient-to-br from-indigo-900/40 to-indigo-800/40 backdrop-blur-xl rounded-xl p-6 border border-indigo-700/30 cursor-pointer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleManageUsers}
          >
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Users</h3>
            <p className="text-indigo-300 text-sm mb-4">
              View and manage registered users, permissions, and user activity.
            </p>
            <div className="flex items-center text-indigo-400 text-sm font-medium">
              <span>Open User Management</span>
              <span className="ml-2">→</span>
            </div>
          </motion.div>

          {/* Ticket Management */}
          <motion.div
            className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/40 backdrop-blur-xl rounded-xl p-6 border border-emerald-700/30 cursor-pointer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleManageTickets}
          >
            <div className="text-4xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Tickets</h3>
            <p className="text-emerald-300 text-sm mb-4">
              View ticket sales, process refunds, and manage ticket inventory.
            </p>
            <div className="flex items-center text-emerald-400 text-sm font-medium">
              <span>Open Ticket Management</span>
              <span className="ml-2">→</span>
            </div>
          </motion.div>

          {/* Analytics */}
          <motion.div
            className="bg-gradient-to-br from-violet-900/40 to-violet-800/40 backdrop-blur-xl rounded-xl p-6 border border-violet-700/30 cursor-pointer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleViewAnalytics}
          >
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
            <p className="text-violet-300 text-sm mb-4">
              View detailed reports, charts, and insights about event performance.
            </p>
            <div className="flex items-center text-violet-400 text-sm font-medium">
              <span>View Analytics</span>
              <span className="ml-2">→</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions Footer */}
        <motion.div
          className="mt-8 pt-6 border-t border-slate-700/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={refreshDashboard}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 text-sm rounded-lg transition-all flex items-center gap-2"
            >
              <span>🔄</span>
              Refresh Dashboard
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleViewSettings}
              className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 text-sm rounded-lg transition-all flex items-center gap-2"
            >
              <span>⚙️</span>
              Settings
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;