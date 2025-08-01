import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { refundAPI, apiUtils } from "../../../../services/api";
import { toast } from "react-toastify";
import { formatDate } from "../../../../utils/helpers";

const RefundManagement = ({ userRole }) => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalRefunds: 0,
  });
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    page: 1,
    limit: 20,
  });
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    processed: 0,
    failed: 0,
    totalRefundAmount: 0,
  });

  useEffect(() => {
    fetchRefunds();
    fetchStats();
  }, [filters]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await refundAPI.getAllRefunds(filters);
      setRefunds(response.data.refunds);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`Failed to load refunds: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await refundAPI.getRefundStats();
      setStats(response.data.stats);
    } catch (err) {
      console.error("Failed to fetch refund stats:", err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : value,
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-900/30 text-yellow-300 border-yellow-700/30",
      processing: "bg-blue-900/30 text-blue-300 border-blue-700/30",
      processed: "bg-green-900/30 text-green-300 border-green-700/30",
      failed: "bg-red-900/30 text-red-300 border-red-700/30",
      cancelled: "bg-gray-900/30 text-gray-300 border-gray-700/30",
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: "⏳",
      processing: "🔄",
      processed: "✅",
      failed: "❌",
      cancelled: "🚫",
    };
    return icons[status] || "📄";
  };

  if (loading && refunds.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Refunds</h2>
            <p className="text-slate-400">Please wait while we fetch refund data...</p>
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
      className="max-w-7xl mx-auto"
    >
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
            Refund Management
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6"></div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {[
            { icon: "📊", title: "Total Refunds", value: stats.total, color: "blue" },
            { icon: "⏳", title: "Pending", value: stats.pending, color: "yellow" },
            { icon: "🔄", title: "Processing", value: stats.processing, color: "blue" },
            { icon: "✅", title: "Completed", value: stats.processed, color: "green" },
            { icon: "❌", title: "Failed", value: stats.failed, color: "red" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-br from-${stat.color}-900/40 to-${stat.color}-800/40 backdrop-blur-xl rounded-xl p-6 border border-${stat.color}-700/30`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <h3 className={`text-${stat.color}-300 font-medium mb-1`}>{stat.title}</h3>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Total Refund Amount */}
        <div className="bg-gradient-to-r from-green-900/40 to-emerald-800/40 rounded-xl p-6 mb-8 border border-green-700/30">
          <div className="text-center">
            <h3 className="text-green-300 font-medium mb-2">Total Refunded Amount</h3>
            <p className="text-white text-3xl font-bold">₹{stats.totalRefundAmount?.toLocaleString() || 0}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by user name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div className="flex items-center gap-4">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="processed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button
                onClick={fetchRefunds}
                className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 text-white rounded-lg transition-all flex items-center gap-2"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Showing {pagination.count} of {pagination.totalRefunds} refunds
            </span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <span>⚠️</span>
              <span className="font-medium">Error Loading Refunds</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchRefunds}
              className="mt-3 px-4 py-2 bg-red-600/50 hover:bg-red-600/70 text-white text-sm rounded-lg transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Refunds Table */}
        {refunds.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Refund ID</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Ticket</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Requested</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Processed</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <motion.tr
                    key={refund.id}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-mono text-sm">
                        {refund.refundId.slice(-8)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">
                          {refund.user?.name || "Unknown"}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {refund.user?.email || "No email"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-slate-300 font-mono text-sm">
                          {refund.ticket?.ticketId?.slice(-8) || "N/A"}
                        </p>
                        <p className="text-slate-400 text-xs">
                          {refund.ticket?.eventName || "Event"}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-white font-medium">₹{refund.refundAmount}</p>
                        <p className="text-slate-400 text-xs">
                          (₹{refund.originalAmount} - ₹{refund.processingFee} fee)
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refund.status)}`}
                      >
                        {getStatusIcon(refund.status)} {refund.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {formatDate(refund.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {refund.processedAt ? formatDate(refund.processedAt) : "-"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-xl font-bold text-white mb-2">No Refunds Found</h3>
              <p className="text-slate-400">No refunds match your current filters.</p>
            </div>
          )
        )}

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Page {pagination.current} of {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange("page", pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700/70 text-white text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange("page", pagination.current + 1)}
                disabled={pagination.current === pagination.total}
                className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700/70 text-white text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RefundManagement;