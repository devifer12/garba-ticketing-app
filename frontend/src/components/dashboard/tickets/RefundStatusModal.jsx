import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { paymentAPI } from "../../../services/api";
import { formatDate } from "../../../utils/helpers";

const RefundStatusModal = ({ ticket, onClose }) => {
  const [refundStatus, setRefundStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticket?.refundId) {
      checkRefundStatus();
    } else {
      setLoading(false);
    }
  }, [ticket]);

  const checkRefundStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await paymentAPI.checkRefundStatus(ticket.refundId);
      setRefundStatus(response.data.refund);
    } catch (err) {
      console.error("Failed to check refund status:", err);
      setError(err.response?.data?.error || "Failed to check refund status");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      COMPLETED: "bg-green-900/30 text-green-300 border-green-700/30",
      PENDING: "bg-yellow-900/30 text-yellow-300 border-yellow-700/30",
      FAILED: "bg-red-900/30 text-red-300 border-red-700/30",
    };
    return colors[status] || colors.PENDING;
  };

  const getStatusIcon = (status) => {
    const icons = {
      COMPLETED: "✅",
      PENDING: "⏳",
      FAILED: "❌",
    };
    return icons[status] || "❓";
  };

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">💰</span>
              Refund Status
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-8">
              <motion.div
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-white">Checking refund status...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-white font-bold mb-2">Error</h3>
              <p className="text-red-400 text-sm mb-4">{error}</p>
              <button
                onClick={checkRefundStatus}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Ticket Information */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <h3 className="text-white font-medium mb-3">Ticket Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ticket ID:</span>
                    <span className="text-white font-mono">{ticket.ticketId?.slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Original Price:</span>
                    <span className="text-white">₹{ticket.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cancelled:</span>
                    <span className="text-white">{formatDate(ticket.cancelledAt)}</span>
                  </div>
                </div>
              </div>

              {/* Refund Status */}
              {refundStatus ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <motion.div
                      className="text-6xl mb-4"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      {getStatusIcon(refundStatus.status)}
                    </motion.div>
                    
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(refundStatus.status)}`}>
                      {refundStatus.status === "COMPLETED" && "Refund Completed"}
                      {refundStatus.status === "PENDING" && "Refund Processing"}
                      {refundStatus.status === "FAILED" && "Refund Failed"}
                    </span>
                  </div>

                  <div className="bg-slate-700/50 rounded-xl p-4">
                    <h3 className="text-white font-medium mb-3">Refund Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Refund ID:</span>
                        <span className="text-white font-mono text-xs">{refundStatus.refundId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Amount:</span>
                        <span className="text-green-400 font-medium">₹{refundStatus.amount / 100}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-white">{refundStatus.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Original Order:</span>
                        <span className="text-white font-mono text-xs">{refundStatus.originalOrderId}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status-specific messages */}
                  {refundStatus.status === "COMPLETED" && (
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                      <h4 className="text-green-300 font-medium mb-2">✅ Refund Completed</h4>
                      <p className="text-green-200 text-sm">
                        Your refund has been processed successfully. The amount should appear in your account within 5-7 business days.
                      </p>
                    </div>
                  )}

                  {refundStatus.status === "PENDING" && (
                    <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
                      <h4 className="text-yellow-300 font-medium mb-2">⏳ Refund Processing</h4>
                      <p className="text-yellow-200 text-sm">
                        Your refund is being processed. This usually takes 5-7 business days. You'll receive an email confirmation once completed.
                      </p>
                    </div>
                  )}

                  {refundStatus.status === "FAILED" && (
                    <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                      <h4 className="text-red-300 font-medium mb-2">❌ Refund Failed</h4>
                      <p className="text-red-200 text-sm">
                        There was an issue processing your refund. Please contact our support team for assistance.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-white font-bold mb-2">No Refund Information</h3>
                  <p className="text-slate-400 text-sm">
                    This ticket doesn't have refund information available.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {refundStatus && refundStatus.status === "PENDING" && (
                  <motion.button
                    onClick={checkRefundStatus}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span>🔄</span>
                    Refresh Status
                  </motion.button>
                )}
                
                <motion.button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default RefundStatusModal;