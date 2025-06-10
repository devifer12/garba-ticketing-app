import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const { user, backendUser } = useAuth();
  const [eventStatus, setEventStatus] = useState({
    exists: false,
    loading: true,
    error: null
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    totalRevenue: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkEventStatus = async () => {
      try {
        const response = await axios.get('/api/event/exists');
        setEventStatus({
          exists: response.data.exists,
          loading: false,
          error: null
        });
      } catch (err) {
        setEventStatus({
          exists: false,
          loading: false,
          error: 'Failed to check event status'
        });
        toast.error('Failed to load event status');
      }
    };

    const fetchStats = async () => {
      try {
        // Fetch dashboard statistics
        const [usersRes, ticketsRes] = await Promise.all([
          axios.get('/api/admin/users/count').catch(() => ({ data: { count: 0 } })),
          axios.get('/api/admin/tickets/stats').catch(() => ({ data: { total: 0, revenue: 0 } }))
        ]);
        
        setStats({
          totalUsers: usersRes.data.count || 0,
          totalTickets: ticketsRes.data.total || 0,
          totalRevenue: ticketsRes.data.revenue || 0
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    checkEventStatus();
    fetchStats();
  }, []);

  const handleCreateEvent = () => {
    navigate('/admin/event/create');
  };

  const handleEditEvent = () => {
    navigate('/admin/event/edit');
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
            <h2 className="text-2xl font-bold text-white mb-4">
              Welcome, Administrator! 
            </h2>
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
            <p className="text-white text-2xl font-bold">{stats.totalUsers}</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-xl rounded-xl p-6 border border-green-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">🎫</div>
            <h3 className="text-green-300 font-medium mb-1">Tickets Sold</h3>
            <p className="text-white text-2xl font-bold">{stats.totalTickets}</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-xl rounded-xl p-6 border border-purple-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-purple-300 font-medium mb-1">Total Revenue</h3>
            <p className="text-white text-2xl font-bold">${stats.totalRevenue}</p>
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
            </div>
          ) : eventStatus.error ? (
            <div className="text-red-400 text-center py-4 text-sm">
              {eventStatus.error}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                {eventStatus.exists
                  ? 'The event is currently configured and active.'
                  : 'No event has been created yet.'}
              </p>
              
              <div className="flex justify-center gap-4 pt-2">
                {eventStatus.exists ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all text-sm"
                      onClick={() => navigate('/admin/event/manage')}
                      disabled={eventStatus.loading}
                    >
                      View Event
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-yellow-500 text-white font-medium rounded-lg shadow-lg hover:shadow-orange-500/20 transition-all text-sm"
                      onClick={handleEditEvent}
                      disabled={eventStatus.loading}
                    >
                      Edit Event Details
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-medium rounded-lg shadow-lg hover:shadow-red-500/20 transition-all text-sm"
                    onClick={handleCreateEvent}
                    disabled={eventStatus.loading}
                  >
                    Create New Event
                  </motion.button>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Admin Management Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/30 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            onClick={handleManageTickets}
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🎫</div>
            <h3 className="text-white font-semibold mb-2 text-lg">Ticket Management</h3>
            <p className="text-slate-400 text-sm mb-4">
              Manage all ticket sales, view booking details, and handle refunds
            </p>
            <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
              <span>Manage Tickets</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </motion.div>
          
          <motion.div
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/30 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            onClick={handleManageUsers}
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">👥</div>
            <h3 className="text-white font-semibold mb-2 text-lg">User Management</h3>
            <p className="text-slate-400 text-sm mb-4">
              View user accounts, manage roles, and handle user-related issues
            </p>
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <span>Manage Users</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </motion.div>
          
          <motion.div
            className="bg-slate-800/50 rounded-xl p-6 border border-slate-600/30 cursor-pointer group"
            whileHover={{ scale: 1.02 }}
            onClick={handleViewAnalytics}
          >
            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-white font-semibold mb-2 text-lg">Analytics & Reports</h3>
            <p className="text-slate-400 text-sm mb-4">
              View detailed reports, sales analytics, and performance metrics
            </p>
            <div className="flex items-center gap-2 text-purple-400 text-sm font-medium">
              <span>View Analytics</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="mt-8 bg-slate-700/30 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">⚡</span>
            <h3 className="text-xl font-bold text-white">Quick Actions</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-yellow-500/50 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-slate-600/50 rounded-lg border border-slate-500/30 hover:bg-slate-600/70 transition-all text-center"
              onClick={() => navigate('/admin/event/manage')}
            >
              <div className="text-2xl mb-2">🎪</div>
              <p className="text-white text-sm font-medium">Event Hub</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-slate-600/50 rounded-lg border border-slate-500/30 hover:bg-slate-600/70 transition-all text-center"
              onClick={handleManageTickets}
            >
              <div className="text-2xl mb-2">🎟️</div>
              <p className="text-white text-sm font-medium">All Tickets</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-slate-600/50 rounded-lg border border-slate-500/30 hover:bg-slate-600/70 transition-all text-center"
              onClick={() => navigate('/admin/settings')}
            >
              <div className="text-2xl mb-2">⚙️</div>
              <p className="text-white text-sm font-medium">Settings</p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-slate-600/50 rounded-lg border border-slate-500/30 hover:bg-slate-600/70 transition-all text-center"
              onClick={() => navigate('/admin/support')}
            >
              <div className="text-2xl mb-2">🎧</div>
              <p className="text-white text-sm font-medium">Support</p>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default AdminDashboard;