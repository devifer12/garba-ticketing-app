import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { refundAPI } from "../../../services/api";
import { formatDate } from "../../../utils/helpers";
import LoadingSpinner from "../../ui/LoadingSpinner";

const RefundTracker = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await refundAPI.getMyRefunds();
      setRefunds(response.data.refunds || []);
    } catch (err) {
      console.error("Failed to fetch refunds:", err);
      setError("Failed to load refunds");
    } finally {
      setLoading(false);
    }
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

  const getStatusDescription = (status) => {
    const descriptions = {
      pending: "Refund request created and waiting to be processed",
      processing: "Refund is being processed by the payment gateway",
      processed: "Refund completed successfully",
      failed: "Refund processing failed - manual intervention required",
      cancelled: "Refund request was cancelled",
    };
    return descriptions[status] || "Unknown status";
  };

  const handleViewDetails = async (refund) => {
    try {
      const response = await refundAPI.getRefundStatus(refund.refundId);
      setSelectedRefund(response.data.refund);
      setShowDetails(true);
    } catch (err) {
      console.error("Failed to fetch refund details:", err);
      toast.error("Failed to load refund details");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading refunds..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-white mb-2">Error Loading Refunds</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <button
          onClick={fetchRefunds}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
          💰 Refund Tracker
        </h2>
        <p className="text-slate-400">
          Track the status of your refund requests
        </p>
      </div>

      {/* Refunds List */}
      {refunds.length > 0 ? (
        <div className="space-y-4">
          {refunds.map((refund, index) => (
            <motion.div
              key={refund.id}
              className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/30 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Refund Header */}
              <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 border-b border-slate-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getStatusIcon(refund.status)}</span>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        Refund #{refund.refundId.slice(-8)}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {refund.ticket?.eventName || "Event"}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(refund.status)}`}
                  >
                    {refund.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Refund Body */}
              <div className="p-6 space-y-4">
                {/* Amount Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <span className="text-slate-400 text-sm">Original Amount</span>
                    <p className="text-white font-bold text-xl">₹{refund.originalAmount}</p>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 text-sm">Refund Amount</span>
                    <p className="text-green-400 font-bold text-xl">₹{refund.refundAmount}</p>
                  </div>
                </div>

                {/* Status Description */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Status Update</h4>
                  <p className="text-slate-300 text-sm">
                    {getStatusDescription(refund.status)}
                  </p>
                  {refund.status === "processing" && (
                    <p className="text-blue-400 text-xs mt-2">
                      ⏱️ Expected completion: 5-10 business days
                    </p>
                  )}
                  {refund.status === "processed" && refund.processedAt && (
                    <p className="text-green-400 text-xs mt-2">
                      ✅ Completed on {formatDate(refund.processedAt)}
                    </p>
                  )}
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="text-white font-medium text-sm">Progress Timeline</h4>
                  <div className="space-y-2">
                    {refund.statusHistory?.map((status, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-sm">
                        <div className={`w-2 h-2 rounded-full ${
                          status.status === refund.status ? 'bg-blue-400' : 'bg-slate-600'
                        }`}></div>
                        <span className="text-slate-300 capitalize">{status.status}</span>
                        <span className="text-slate-500 text-xs">
                          {formatDate(status.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-slate-700/30">
                  <motion.button
                    onClick={() => handleViewDetails(refund)}
                    className="flex-1 px-4 py-2 bg-blue-600/50 text-blue-300 rounded-lg hover:bg-blue-600/70 transition-colors text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View Details
                  </motion.button>
                  
                  {refund.status === "failed" && (
                    <motion.button
                      onClick={() => {
                        window.location.href = `mailto:hyyevents@gmail.com?subject=Refund Issue - ${refund.refundId}&body=Hello, I need assistance with my failed refund. Refund ID: ${refund.refundId}`;
                      }}
                      className="flex-1 px-4 py-2 bg-red-600/50 text-red-300 rounded-lg hover:bg-red-600/70 transition-colors text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Contact Support
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-bold text-white mb-2">No Refunds</h3>
          <p className="text-slate-400">
            You haven't requested any refunds yet.
          </p>
        </div>
      )}

      {/* Refund Details Modal */}
      {showDetails && selectedRefund && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Refund Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Detailed Information */}
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Refund Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Refund ID:</span>
                      <span className="text-white font-mono">{selectedRefund.refundId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedRefund.status)}`}>
                        {selectedRefund.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Refund Amount:</span>
                      <span className="text-green-400 font-bold">₹{selectedRefund.refundAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Requested:</span>
                      <span className="text-white">{formatDate(selectedRefund.createdAt)}</span>
                    </div>
                    {selectedRefund.processedAt && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Processed:</span>
                        <span className="text-white">{formatDate(selectedRefund.processedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status History */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Status History</h4>
                  <div className="space-y-3">
                    {selectedRefund.statusHistory?.map((status, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full mt-1 ${
                          status.status === selectedRefund.status ? 'bg-blue-400' : 'bg-slate-600'
                        }`}></div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-white capitalize font-medium">
                              {status.status}
                            </span>
                            <span className="text-slate-400 text-xs">
                              {formatDate(status.timestamp)}
                            </span>
                          </div>
                          {status.notes && (
                            <p className="text-slate-400 text-xs mt-1">{status.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-2">Cancellation Reason</h4>
                  <p className="text-slate-300 text-sm">{selectedRefund.reason}</p>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RefundTracker;