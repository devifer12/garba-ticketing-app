import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TicketCard = ({ ticket, onCancel }) => {
  const [showQR, setShowQR] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-900/30 text-green-300 border-green-700/30',
      used: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
      cancelled: 'bg-red-900/30 text-red-300 border-red-700/30'
    };
    return colors[status] || colors.active;
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: '✅',
      used: '🎯',
      cancelled: '❌'
    };
    return icons[status] || '🎫';
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

  const handleDownloadQR = () => {
    if (ticket.qrCodeImage) {
      const link = document.createElement('a');
      link.href = ticket.qrCodeImage;
      link.download = `ticket-${ticket.ticketId}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleCopyTicketId = () => {
    navigator.clipboard.writeText(ticket.ticketId);
    // You could add a toast notification here
  };

  return (
    <>
      <motion.div
        className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/30 overflow-hidden hover:border-navratri-orange/30 transition-all duration-300"
        whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
      >
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-navratri-orange/20 to-navratri-yellow/20 p-4 border-b border-slate-700/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getStatusIcon(ticket.status)}</span>
              <div>
                <h3 className="text-white font-bold text-lg">{ticket.eventName}</h3>
                <p className="text-slate-400 text-sm">Ticket #{ticket.ticketId.slice(-8)}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
              {ticket.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-6 space-y-4">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Price:</span>
            <span className="text-white font-bold text-xl">₹{ticket.price}</span>
          </div>

          {/* Purchase Date */}
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Purchased:</span>
            <span className="text-slate-300">{formatDate(ticket.createdAt)}</span>
          </div>

          {/* Entry Status */}
          {ticket.status === 'used' && ticket.entryTime && (
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Entry Time:</span>
              <span className="text-blue-300">{formatDate(ticket.entryTime)}</span>
            </div>
          )}

          {/* Scanned Info */}
          {ticket.isScanned && ticket.scannedBy && (
            <div className="bg-slate-700/30 rounded-lg p-3">
              <p className="text-slate-400 text-sm">Scanned by:</p>
              <p className="text-white font-medium">{ticket.scannedBy.name}</p>
              <p className="text-slate-400 text-xs">{formatDate(ticket.scannedAt)}</p>
            </div>
          )}

          {/* QR Code Section */}
          {ticket.status === 'active' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">QR Code:</span>
                <motion.button
                  onClick={() => setShowQR(!showQR)}
                  className="px-3 py-1 bg-navratri-orange/20 text-navratri-orange rounded-lg text-sm hover:bg-navratri-orange/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showQR ? 'Hide QR' : 'Show QR'}
                </motion.button>
              </div>

              {showQR && (
                <motion.div
                  className="text-center space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img
                      src={ticket.qrCodeImage}
                      alt={`QR Code for ticket ${ticket.ticketId}`}
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  
                  <div className="flex gap-2 justify-center">
                    <motion.button
                      onClick={handleDownloadQR}
                      className="px-3 py-1 bg-blue-600/50 text-blue-300 rounded text-sm hover:bg-blue-600/70 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      📥 Download
                    </motion.button>
                    
                    <motion.button
                      onClick={handleCopyTicketId}
                      className="px-3 py-1 bg-purple-600/50 text-purple-300 rounded text-sm hover:bg-purple-600/70 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      📋 Copy ID
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-700/30">
            {ticket.status === 'active' && (
              <motion.button
                onClick={() => setShowCancelConfirm(true)}
                className="w-full px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel Ticket
              </motion.button>
            )}
            
            {ticket.status === 'used' && (
              <div className="text-center text-green-400 font-medium">
                ✅ Ticket Used - Entry Completed
              </div>
            )}
            
            {ticket.status === 'cancelled' && (
              <div className="text-center text-red-400 font-medium">
                ❌ Ticket Cancelled
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4"
          >
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-xl font-bold text-white mb-4">Cancel Ticket?</h3>
              <p className="text-slate-300 mb-6">
                Are you sure you want to cancel this ticket? This action cannot be undone.
              </p>
              
              <div className="flex gap-3">
                <motion.button
                  onClick={() => {
                    onCancel(ticket.id);
                    setShowCancelConfirm(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Yes, Cancel
                </motion.button>
                <motion.button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Keep Ticket
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default TicketCard;