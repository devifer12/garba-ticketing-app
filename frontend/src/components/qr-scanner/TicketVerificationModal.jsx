import React from 'react';
import { motion } from 'framer-motion';

const TicketVerificationModal = ({ 
  isOpen, 
  onClose, 
  ticket, 
  verificationStatus, 
  onMarkAsUsed,
  loading 
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status) => {
    const colors = {
      valid: 'bg-green-900/30 text-green-300 border-green-700/30',
      used: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
      cancelled: 'bg-red-900/30 text-red-300 border-red-700/30',
      invalid: 'bg-red-900/30 text-red-300 border-red-700/30'
    };
    return colors[status] || colors.invalid;
  };

  const getStatusIcon = (status) => {
    const icons = {
      valid: '✅',
      used: '🎯',
      cancelled: '❌',
      invalid: '⚠️'
    };
    return icons[status] || '❓';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/30">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">🎫</span>
              Ticket Verification
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
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <motion.div
                className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-white">Verifying ticket...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Verification Status */}
              <div className="text-center">
                <motion.div
                  className="text-6xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  {getStatusIcon(verificationStatus)}
                </motion.div>
                
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(verificationStatus)}`}>
                  {verificationStatus === 'valid' && 'Valid Ticket'}
                  {verificationStatus === 'used' && 'Already Used'}
                  {verificationStatus === 'cancelled' && 'Cancelled Ticket'}
                  {verificationStatus === 'invalid' && 'Invalid Ticket'}
                </span>
              </div>

              {/* Ticket Details */}
              {ticket && (
                <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ticket ID:</span>
                    <span className="text-white font-mono text-sm">{ticket.ticketId}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Event:</span>
                    <span className="text-white font-medium">{ticket.eventName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Holder:</span>
                    <span className="text-white font-medium">{ticket.user?.name}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white text-sm">{ticket.user?.email}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Price:</span>
                    <span className="text-white font-medium">₹{ticket.price}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Purchased:</span>
                    <span className="text-white text-sm">{formatDate(ticket.createdAt)}</span>
                  </div>

                  {ticket.entryTime && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Entry Time:</span>
                      <span className="text-white text-sm">{formatDate(ticket.entryTime)}</span>
                    </div>
                  )}

                  {ticket.scannedBy && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Scanned By:</span>
                      <span className="text-white text-sm">{ticket.scannedBy.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {verificationStatus === 'valid' && (
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
                  <h4 className="text-green-300 font-medium mb-2">✅ Valid Ticket</h4>
                  <p className="text-green-200 text-sm">
                    This ticket is valid and ready for entry. Click "Allow Entry" to mark it as used.
                  </p>
                </div>
              )}

              {verificationStatus === 'used' && (
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h4 className="text-blue-300 font-medium mb-2">🎯 Already Used</h4>
                  <p className="text-blue-200 text-sm">
                    This ticket has already been used for entry. Entry time: {ticket?.entryTime && formatDate(ticket.entryTime)}
                  </p>
                </div>
              )}

              {verificationStatus === 'cancelled' && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                  <h4 className="text-red-300 font-medium mb-2">❌ Cancelled Ticket</h4>
                  <p className="text-red-200 text-sm">
                    This ticket has been cancelled and cannot be used for entry.
                  </p>
                </div>
              )}

              {verificationStatus === 'invalid' && (
                <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4">
                  <h4 className="text-red-300 font-medium mb-2">⚠️ Invalid Ticket</h4>
                  <p className="text-red-200 text-sm">
                    This QR code is not a valid ticket or was not found in our system.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {verificationStatus === 'valid' && (
                  <motion.button
                    onClick={onMarkAsUsed}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span>🚪</span>
                        Allow Entry
                      </>
                    )}
                  </motion.button>
                )}
                
                <motion.button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {verificationStatus === 'valid' ? 'Cancel' : 'Close'}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TicketVerificationModal;