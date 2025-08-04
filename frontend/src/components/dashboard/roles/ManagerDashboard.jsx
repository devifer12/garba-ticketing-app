import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { adminAPI } from '../../../services/api';
import { useApi } from '../../../hooks/useApi';
import { ANIMATION_VARIANTS } from '../../../utils/constants.js';
import LoadingSpinner from '../../ui/LoadingSpinner';
import UserAvatar from '../../ui/UserAvatar';
import AnalyticsDashboard from '../roles/admin/AnalyticsDashboard';

const ManagerDashboard = () => {
  const { user, backendUser } = useAuth();
  const { loading, error, execute } = useApi();
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalTickets: 0, 
    totalRevenue: 0, 
    revenueToday: 0,
    loading: true 
  });
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchDashboardStats = async () => {
    await execute(async () => {
      const [usersResponse, analyticsResponse] = await Promise.all([
        adminAPI.getUserCount().catch(() => ({ data: { count: 0 } })),
        adminAPI.getDashboardAnalytics().catch(() => ({ 
          data: { 
            data: { 
              users: { total: 0 }, 
              tickets: { total: 0 }, 
              revenue: { total: 0, today: 0 } 
            } 
          } 
        }))
      ]);
      
      const analyticsData = analyticsResponse.data.data;
      
      setStats({
        totalUsers: usersResponse.data.count || 0,
        totalTickets: analyticsData.tickets?.total || 0,
        totalRevenue: analyticsData.revenue?.total || 0,
        revenueToday: analyticsData.revenue?.today || 0,
        averageTicketValue: analyticsData.analytics?.averageTicketValue || 0,
        conversionRate: analyticsData.analytics?.conversionRate || 0,
        loading: false
      });
    });
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      await execute(async () => {
        const response = await adminAPI.getAllUsers({ limit: 50 });
        setUsers(response.data.users || []);
      });
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (backendUser) {
      fetchDashboardStats();
      fetchUsers();
    }
  }, [backendUser]);

  if (currentView === 'analytics') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setCurrentView('dashboard')}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-lg transition-all flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
        </div>
        <AnalyticsDashboard userRole="manager" />
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={ANIMATION_VARIANTS.container}
      className="max-w-6xl mx-auto"
    >
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
        {/* Header */}
        <motion.div variants={ANIMATION_VARIANTS.item} className="text-center mb-8">
          <motion.div
            className="text-6xl mb-4"
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          >
            📋
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            Manager Dashboard
          </h1>
          
          <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
            <h2 className="text-2xl font-bold text-white mb-4">
              Welcome, Manager!
            </h2>
            <UserAvatar user={user || backendUser} />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: "👥", title: "Total Users", value: stats.totalUsers, color: "blue" },
            { icon: "🎫", title: "Tickets Sold", value: stats.totalTickets, color: "green" },
            { 
              icon: "💰", 
              title: "Total Revenue", 
              value: `₹${stats.totalRevenue.toLocaleString()}`, 
              color: "purple",
              subtitle: `₹${stats.revenueToday} today`
            },
            { 
              icon: "📊", 
              title: "Avg. Ticket Value", 
              value: `₹${stats.averageTicketValue || 0}`, 
              color: "orange",
              subtitle: "per ticket"
            }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-br from-${stat.color}-900/40 to-${stat.color}-800/40 backdrop-blur-xl rounded-xl p-6 border border-${stat.color}-700/30`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <h3 className={`text-${stat.color}-300 font-medium mb-1`}>{stat.title}</h3>
              {stats.loading ? (
                <div className={`animate-pulse bg-${stat.color}-700/30 h-8 w-16 rounded`}></div>
              ) : (
                <>
                  <p className="text-white text-2xl font-bold">{stat.value}</p>
                  {stat.subtitle && (
                    <p className={`text-${stat.color}-400 text-sm mt-1`}>{stat.subtitle}</p>
                  )}
                </>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Users List */}
        <motion.div variants={ANIMATION_VARIANTS.item} className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-6 border border-slate-600/30 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Registered Users
            </h3>
            <button
              onClick={fetchUsers}
              disabled={usersLoading}
              className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600/70 text-white rounded-lg transition-all flex items-center gap-2"
            >
              {usersLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  🔄 Refresh
                </>
              )}
            </button>
          </div>
          
          {usersLoading ? (
            <LoadingSpinner message="Loading users..." />
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.length > 0 ? (
                users.map((user, index) => (
                  <motion.div
                    key={user._id}
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-slate-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          user.role === 'admin' ? 'bg-red-900/30 text-red-300 border-red-700/30' :
                          user.role === 'manager' ? 'bg-blue-900/30 text-blue-300 border-blue-700/30' :
                          user.role === 'qrchecker' ? 'bg-green-900/30 text-green-300 border-green-700/30' :
                          'bg-gray-900/30 text-gray-300 border-gray-700/30'
                        }`}>
                          {user.role}
                        </span>
                        <p className="text-slate-500 text-xs mt-1">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👤</div>
                  <p className="text-slate-400">No users found</p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Analytics Button */}
        <motion.div variants={ANIMATION_VARIANTS.item} className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              onClick={() => setCurrentView('analytics')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl">📊</span>
              View Analytics
            </motion.button>
            
            <motion.button
              onClick={() => setCurrentView('manual-tickets')}
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-xl">🎟️</span>
              Issue Manual Tickets
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ManagerDashboard;