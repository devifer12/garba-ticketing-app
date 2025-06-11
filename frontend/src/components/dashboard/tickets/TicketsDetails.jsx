import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { ticketAPI, eventAPI, apiUtils } from "../../../services/api";
import { toast } from "react-toastify";
import TicketCard from "./TicketCard";
import PurchaseTicketModal from "./PurchaseTicketModal";

const TicketsDetails = () => {
  const { user, backendUser } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user && backendUser) {
      fetchData();
    }
  }, [user, backendUser]);

  // Listen for custom toast events
  useEffect(() => {
    const handleToast = (event) => {
      const { message, type } = event.detail;
      if (type === 'success') {
        toast.success(message);
      } else if (type === 'error') {
        toast.error(message);
      } else {
        toast(message);
      }
    };

    window.addEventListener('showToast', handleToast);
    return () => window.removeEventListener('showToast', handleToast);
  }, []);

  const fetchData = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Fetch user's tickets and event details in parallel
      const [ticketsResponse, eventResponse] = await Promise.all([
        ticketAPI.getMyTickets().catch(err => {
          console.warn('Failed to fetch tickets:', err);
          return { data: { tickets: [] } };
        }),
        eventAPI.getCurrentEvent().catch(err => {
          console.warn('Failed to fetch event:', err);
          return { data: { data: null } };
        })
      ]);

      setTickets(ticketsResponse.data.tickets || []);
      setEvent(eventResponse.data.data);
      
      if (showRefreshIndicator) {
        toast.success('Data refreshed successfully!');
      }
      
    } catch (err) {
      console.error('Failed to fetch data:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`Failed to load data: ${errorMessage}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handlePurchaseTickets = async (quantity) => {
    try {
      setPurchasing(true);
      
      const response = await ticketAPI.createBooking({ quantity });
      
      if (response.data.success) {
        toast.success(`🎉 ${quantity} ticket(s) purchased successfully!`);
        setShowPurchaseModal(false);
        
        // Refresh tickets and event data
        await fetchData();
      }
      
    } catch (err) {
      console.error('Failed to purchase tickets:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      toast.error(`Failed to purchase tickets: ${errorMessage}`);
    } finally {
      setPurchasing(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    try {
      const response = await ticketAPI.cancelTicket(ticketId);
      
      if (response.data.success) {
        toast.success('Ticket cancelled successfully');
        await fetchData(); // Refresh data
      }
      
    } catch (err) {
      console.error('Failed to cancel ticket:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      toast.error(`Failed to cancel ticket: ${errorMessage}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return timeString;
    }
  };

  // Filter tickets by status
  const activeTickets = tickets.filter(t => t.status === 'active');
  const usedTickets = tickets.filter(t => t.status === 'used');
  const cancelledTickets = tickets.filter(t => t.status === 'cancelled');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navratri-orange mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-white mb-2">Loading Tickets</h2>
          <p className="text-slate-400">Please wait while we fetch your tickets...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/30">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-white mb-4">Error Loading Tickets</h2>
            <p className="text-slate-400 mb-6">{error}</p>
            <motion.button
              onClick={() => fetchData()}
              className="px-6 py-3 bg-navratri-orange text-white rounded-lg font-semibold hover:bg-navratri-orange/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4">
            My Tickets
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-navratri-orange to-navratri-pink rounded-full mx-auto mb-4"></div>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-6 text-sm">
            <div className="text-center">
              <span className="text-slate-400">Total:</span>
              <span className="text-white font-bold ml-1">{tickets.length}</span>
            </div>
            <div className="text-center">
              <span className="text-green-400">Active:</span>
              <span className="text-white font-bold ml-1">{activeTickets.length}</span>
            </div>
            <div className="text-center">
              <span className="text-blue-400">Used:</span>
              <span className="text-white font-bold ml-1">{usedTickets.length}</span>
            </div>
            {cancelledTickets.length > 0 && (
              <div className="text-center">
                <span className="text-red-400">Cancelled:</span>
                <span className="text-white font-bold ml-1">{cancelledTickets.length}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Event Information */}
        {event && (
          <motion.div
            className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-white mb-4">{event.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl mb-2">📅</div>
                  <h3 className="text-white font-semibold mb-1">Date</h3>
                  <p className="text-slate-300">{formatDate(event.date)}</p>
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl mb-2">🕐</div>
                  <h3 className="text-white font-semibold mb-1">Time</h3>
                  <p className="text-slate-300">
                    {formatTime(event.startTime)} - {formatTime(event.endTime)}
                  </p>
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="text-2xl mb-2">📍</div>
                  <h3 className="text-white font-semibold mb-1">Venue</h3>
                  <p className="text-slate-300">{event.venue}</p>
                </div>
              </div>
            </div>

            {/* Purchase Section */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-navratri-orange/20 to-navratri-yellow/20 rounded-xl p-6 mb-6">
                <h4 className="text-white font-bold text-xl mb-2">Ticket Price: ₹{event.ticketPrice}</h4>
                <p className="text-slate-300 mb-4">
                  {event.availableTickets > 0 
                    ? `${event.availableTickets} tickets remaining` 
                    : 'Sold Out!'
                  }
                </p>
                
                <div className="flex justify-center gap-4">
                  {event.availableTickets > 0 ? (
                    <motion.button
                      onClick={() => setShowPurchaseModal(true)}
                      className="px-8 py-4 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300 flex items-center gap-3"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={purchasing}
                    >
                      <span className="text-xl">🎟️</span>
                      {purchasing ? 'Processing...' : 'Buy More Tickets'}
                    </motion.button>
                  ) : (
                    <div className="px-8 py-4 bg-red-600/50 text-red-200 font-bold rounded-xl border border-red-500/30">
                      <span className="text-xl mr-2">😔</span>
                      Event Sold Out
                    </div>
                  )}
                  
                  <motion.button
                    onClick={() => fetchData(true)}
                    disabled={refreshing}
                    className="px-6 py-4 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-xl transition-all flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tickets Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {tickets.length > 0 ? (
            <div className="space-y-8">
              {/* Active Tickets */}
              {activeTickets.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-green-400">✅</span>
                    Active Tickets ({activeTickets.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <TicketCard 
                          ticket={ticket} 
                          onCancel={handleCancelTicket}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Used Tickets */}
              {usedTickets.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-400">🎯</span>
                    Used Tickets ({usedTickets.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {usedTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <TicketCard 
                          ticket={ticket} 
                          onCancel={handleCancelTicket}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cancelled Tickets */}
              {cancelledTickets.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-red-400">❌</span>
                    Cancelled Tickets ({cancelledTickets.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cancelledTickets.map((ticket, index) => (
                      <motion.div
                        key={ticket.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <TicketCard 
                          ticket={ticket} 
                          onCancel={handleCancelTicket}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-12 border border-slate-700/30">
                <div className="text-6xl mb-6">🎫</div>
                <h3 className="text-2xl font-bold text-white mb-4">No Tickets Yet</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  You haven't purchased any tickets yet. Get your tickets now and join the celebration!
                </p>
                
                {event && event.availableTickets > 0 && (
                  <motion.button
                    onClick={() => setShowPurchaseModal(true)}
                    className="px-8 py-4 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300 flex items-center gap-3 mx-auto"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-xl">🎟️</span>
                    Buy Your First Ticket
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <PurchaseTicketModal
          event={event}
          onClose={() => setShowPurchaseModal(false)}
          onPurchase={handlePurchaseTickets}
          purchasing={purchasing}
        />
      )}
    </div>
  );
};

export default TicketsDetails;