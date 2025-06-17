import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI, apiUtils } from '../../../../services/api';
import { toast } from 'react-toastify';

const AnalyticsDashboard = ({ userRole }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getDashboardAnalytics();
      setAnalytics(response.data.data);
      
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`Failed to load analytics: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Analytics</h2>
            <p className="text-slate-400">Please wait while we fetch analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Analytics</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
            Sales Analytics
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">
            Comprehensive insights into your event performance and sales data
          </p>
        </motion.div>

        {/* Time Range Selector */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-700/50 rounded-lg p-1 flex">
            {[
              { value: '7d', label: '7 Days' },
              { value: '30d', label: '30 Days' },
              { value: 'all', label: 'All Time' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  timeRange === option.value
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-gradient-to-br from-green-900/40 to-green-800/40 backdrop-blur-xl rounded-xl p-6 border border-green-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">💰</div>
            <h3 className="text-green-300 font-medium mb-1">Total Revenue</h3>
            <p className="text-white text-2xl font-bold">
              {formatCurrency(analytics?.revenue?.total || 0)}
            </p>
            <p className="text-green-400 text-sm mt-1">
              {formatCurrency(analytics?.revenue?.today || 0)} today
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-xl rounded-xl p-6 border border-blue-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">🎫</div>
            <h3 className="text-blue-300 font-medium mb-1">Tickets Sold</h3>
            <p className="text-white text-2xl font-bold">{analytics?.tickets?.total || 0}</p>
            <p className="text-blue-400 text-sm mt-1">
              {analytics?.tickets?.soldToday || 0} today
            </p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-xl rounded-xl p-6 border border-purple-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">📈</div>
            <h3 className="text-purple-300 font-medium mb-1">Average Ticket Value</h3>
            <p className="text-white text-2xl font-bold">
              {formatCurrency(analytics?.analytics?.averageTicketValue || 0)}
            </p>
            <p className="text-purple-400 text-sm mt-1">per ticket</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-br from-orange-900/40 to-orange-800/40 backdrop-blur-xl rounded-xl p-6 border border-orange-700/30"
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-orange-300 font-medium mb-1">Conversion Rate</h3>
            <p className="text-white text-2xl font-bold">
              {analytics?.analytics?.conversionRate || 0}%
            </p>
            <p className="text-orange-400 text-sm mt-1">users to buyers</p>
          </motion.div>
        </div>

        {/* Event Performance */}
        {analytics?.event && (
          <div className="bg-slate-700/30 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🎪</span>
              Event Performance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {analytics.event.soldTickets}
                </div>
                <p className="text-slate-400 text-sm">Tickets Sold</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {analytics.event.availableTickets}
                </div>
                <p className="text-slate-400 text-sm">Available</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {analytics.event.soldPercentage}%
                </div>
                <p className="text-slate-400 text-sm">Sold</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {formatCurrency(analytics.event.ticketPrice)}
                </div>
                <p className="text-slate-400 text-sm">Ticket Price</p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Sales Progress</span>
                <span>{analytics.event.soldPercentage}% Complete</span>
              </div>
              <div className="w-full bg-slate-600/30 rounded-full h-3">
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${analytics.event.soldPercentage}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Sales Chart Data */}
        {analytics?.salesChart && analytics.salesChart.length > 0 && (
          <div className="bg-slate-700/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">📈</span>
              Daily Sales Overview
            </h3>
            
            <div className="space-y-4">
              {analytics.salesChart.slice(-7).map((day, index) => (
                <motion.div
                  key={day._id}
                  className="flex items-center justify-between p-4 bg-slate-600/30 rounded-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div>
                    <p className="text-white font-medium">
                      {new Date(day._id).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-slate-400 text-sm">{day.count} tickets</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">{formatCurrency(day.revenue)}</p>
                    <div className="w-24 bg-slate-500/30 rounded-full h-2 mt-1">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (day.revenue / Math.max(...analytics.salesChart.map(d => d.revenue))) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Hourly Sales Today */}
        {analytics?.hourlySales && analytics.hourlySales.length > 0 && (
          <div className="bg-slate-700/30 rounded-xl p-6 mt-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-2xl">🕐</span>
              Today's Hourly Sales
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {analytics.hourlySales.map((hour) => (
                <div key={hour._id} className="text-center p-3 bg-slate-600/30 rounded-lg">
                  <p className="text-white font-bold">{hour._id}:00</p>
                  <p className="text-slate-400 text-sm">{hour.count} tickets</p>
                  <p className="text-green-400 text-xs">{formatCurrency(hour.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnalyticsDashboard;