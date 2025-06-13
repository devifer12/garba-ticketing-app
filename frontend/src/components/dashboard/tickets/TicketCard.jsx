import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TicketCard = ({ ticket }) => {
  const [showQR, setShowQR] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-900/30 text-green-300 border-green-700/30',
      used: 'bg-blue-900/30 text-blue-300 border-blue-700/30'
    };
    return colors[status] || colors.active;
  };

  const getStatusIcon = (status) => {
    const icons = {
      active: '✅',
      used: '🎯'
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
      link.download = `garba-ticket-${ticket.ticketId}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      const event = new CustomEvent('showToast', {
        detail: { message: 'QR Code downloaded successfully!', type: 'success' }
      });
      window.dispatchEvent(event);
    }
  };

  const handleCopyTicketId = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticketId);
      
      // Show success message
      const event = new CustomEvent('showToast', {
        detail: { message: 'Ticket ID copied to clipboard!', type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Failed to copy ticket ID:', error);
    }
  };

  const handlePrintTicket = () => {
    // Create a printable version of the ticket
    const printWindow = window.open('', '_blank');
    const ticketHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Garba Ticket - ${ticket.ticketId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              background: white;
              color: black;
            }
            .ticket { 
              border: 2px solid #333; 
              padding: 20px; 
              max-width: 400px; 
              margin: 0 auto;
              border-radius: 10px;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 1px solid #ccc;
              padding-bottom: 15px;
            }
            .qr-code { 
              text-align: center; 
              margin: 20px 0; 
            }
            .qr-code img { 
              width: 150px; 
              height: 150px; 
            }
            .details { 
              margin: 10px 0; 
            }
            .label { 
              font-weight: bold; 
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <h1>🎭 Garba Rass 2025</h1>
              <h2>${ticket.eventName}</h2>
            </div>
            
            <div class="qr-code">
              <img src="${ticket.qrCodeImage}" alt="QR Code" />
            </div>
            
            <div class="details">
              <div><span class="label">Ticket ID:</span> ${ticket.ticketId}</div>
              <div><span class="label">Price:</span> ₹${ticket.price}</div>
              <div><span class="label">Status:</span> ${ticket.status.toUpperCase()}</div>
              <div><span class="label">Purchased:</span> ${formatDate(ticket.createdAt)}</div>
              ${ticket.entryTime ? `<div><span class="label">Entry Time:</span> ${formatDate(ticket.entryTime)}</div>` : ''}
            </div>
            
            <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
              <p>Present this QR code at the venue for entry</p>
              <p>Keep this ticket safe and do not share with others</p>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #ff6500; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Ticket</button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">Close</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(ticketHTML);
    printWindow.document.close();
  };

  return (
    <motion.div
      className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/30 overflow-hidden hover:border-navratri-orange/30 transition-all duration-300"
      whileHover={{ y: -2, boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}
      layout
    >
      {/* Ticket Header */}
      <div className="bg-gradient-to-r from-navratri-orange/20 to-navratri-yellow/20 p-4 border-b border-slate-700/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getStatusIcon(ticket.status)}</span>
            <div>
              <h3 className="text-white font-bold text-lg">{ticket.eventName}</h3>
              <p className="text-slate-400 text-sm">#{ticket.ticketId.slice(-8)}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
            {ticket.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Ticket Body */}
      <div className="p-6 space-y-4">
        {/* Price and Purchase Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <span className="text-slate-400 text-sm">Price</span>
            <p className="text-white font-bold text-xl">₹{ticket.price}</p>
          </div>
          <div className="text-center">
            <span className="text-slate-400 text-sm">Purchased</span>
            <p className="text-slate-300 text-sm">{formatDate(ticket.createdAt)}</p>
          </div>
        </div>

        {/* Entry Status */}
        {ticket.status === 'used' && ticket.entryTime && (
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-400">🎯</span>
              <span className="text-blue-300 font-medium">Entry Completed</span>
            </div>
            <p className="text-blue-200 text-sm">Entered at: {formatDate(ticket.entryTime)}</p>
            {ticket.scannedBy && (
              <p className="text-blue-200 text-xs">Scanned by: {ticket.scannedBy.name}</p>
            )}
          </div>
        )}

        {/* QR Code Section */}
        {ticket.status === 'active' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">QR Code:</span>
              <motion.button
                onClick={() => setShowQR(!showQR)}
                className="px-3 py-1 bg-navratri-orange/20 text-navratri-orange rounded-lg text-sm hover:bg-navratri-orange/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showQR ? 'Hide QR' : 'Show QR'}
              </motion.button>
            </div>

            <motion.div
              initial={false}
              animate={{ height: showQR ? 'auto' : 0, opacity: showQR ? 1 : 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {showQR && (
                <div className="text-center space-y-4 pt-2">
                  <div className="bg-white p-4 rounded-lg inline-block">
                    <img
                      src={ticket.qrCodeImage}
                      alt={`QR Code for ticket ${ticket.ticketId}`}
                      className="w-32 h-32 mx-auto"
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <motion.button
                      onClick={handleDownloadQR}
                      className="px-3 py-2 bg-blue-600/50 text-blue-300 rounded text-xs hover:bg-blue-600/70 transition-colors flex items-center justify-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>📥</span>
                      <span>Download</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={handleCopyTicketId}
                      className="px-3 py-2 bg-purple-600/50 text-purple-300 rounded text-xs hover:bg-purple-600/70 transition-colors flex items-center justify-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>📋</span>
                      <span>Copy ID</span>
                    </motion.button>
                    
                    <motion.button
                      onClick={handlePrintTicket}
                      className="px-3 py-2 bg-green-600/50 text-green-300 rounded text-xs hover:bg-green-600/70 transition-colors flex items-center justify-center gap-1"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>🖨️</span>
                      <span>Print</span>
                    </motion.button>
                  </div>
                  
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-xs text-center">
                      💡 Present this QR code at the venue entrance for quick check-in
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Additional Details Toggle */}
        <div className="border-t border-slate-700/30 pt-4">
          <motion.button
            onClick={() => setShowFullDetails(!showFullDetails)}
            className="w-full text-left text-slate-400 hover:text-slate-300 transition-colors text-sm flex items-center justify-between"
            whileHover={{ scale: 1.01 }}
          >
            <span>View Details</span>
            <motion.span
              animate={{ rotate: showFullDetails ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ▼
            </motion.span>
          </motion.button>
          
          <motion.div
            initial={false}
            animate={{ height: showFullDetails ? 'auto' : 0, opacity: showFullDetails ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {showFullDetails && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Full Ticket ID:</span>
                  <span className="text-slate-300 font-mono text-xs">{ticket.ticketId}</span>
                </div>
                {ticket.qrCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">QR Code:</span>
                    <span className="text-slate-300 font-mono text-xs">{ticket.qrCode.slice(0, 20)}...</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Created:</span>
                  <span className="text-slate-300">{formatDate(ticket.createdAt)}</span>
                </div>
                {ticket.updatedAt && ticket.updatedAt !== ticket.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Last Updated:</span>
                    <span className="text-slate-300">{formatDate(ticket.updatedAt)}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* Status Display */}
        <div className="pt-4 border-t border-slate-700/30">
          {ticket.status === 'used' && (
            <div className="text-center text-green-400 font-medium py-2">
              ✅ Ticket Used - Entry Completed
            </div>
          )}
          
          {ticket.status === 'active' && (
            <div className="text-center text-green-400 font-medium py-2">
              🎫 Active Ticket - Ready for Entry
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TicketCard;