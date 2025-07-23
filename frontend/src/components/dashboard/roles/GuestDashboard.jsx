import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { eventAPI, ticketAPI } from "../../../services/api";
import { useApi } from "../../../hooks/useApi";
import { formatDate, formatTime } from "../../../utils/helpers";
import { ANIMATION_VARIANTS } from "../../../utils/constants";
import LoadingSpinner from "../../ui/LoadingSpinner";
import ErrorDisplay from "../../ui/ErrorDisplay";
import UserAvatar from "../../ui/UserAvatar";
import TicketsDetails from "../tickets/TicketsDetails";
import PurchaseTicketModal from "../tickets/PurchaseTicketModal";

const GuestDashboard = () => {
  const { user, backendUser } = useAuth();
  const { loading, error, execute, clearCache } = useApi();
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const fetchDashboardData = async () => {
    await execute(
      async (signal) => {
        // Fetch in parallel for better performance with caching
        const [eventResponse, ticketsResponse] = await Promise.all([
          eventAPI
            .getCurrentEvent(signal)
            .catch(() => ({ data: { data: null } })),
          ticketAPI
            .getMyTickets(signal)
            .catch(() => ({ data: { tickets: [] } })),
        ]);
        setEvent(eventResponse.data.data);
        setTickets(ticketsResponse.data.tickets || []);
      },
      {
        showLoading: false,
        cacheKey: `guest-dashboard-${user?.uid}`,
        cacheDuration: 2 * 60 * 1000, // 2 minutes cache
      },
    );
  };

  useEffect(() => {
    if (user && backendUser) {
      fetchDashboardData();
    }
  }, [user, backendUser]);

  const handlePurchaseTickets = async (quantity) => {
    setPurchasing(true);
    try {
      // This is now a fallback method for direct ticket creation
      // The primary payment flow goes through PhonePe via PurchaseTicketModal
      await execute(
        async (signal) => {
          const response = await ticketAPI.createBooking({ quantity }, signal);
          if (response.data.success) {
            setShowPurchaseModal(false);
            // Clear cache and refresh dashboard data after successful purchase
            clearCache(`guest-dashboard-${user?.uid}`);
            setTimeout(() => {
              fetchDashboardData();
            }, 500);
          }
          return response;
        },
        {
          showSuccess: true,
          successMessage: `🎉 ${quantity} ticket(s) purchased successfully!`,
          suppressErrorIfSuccessful: true,
        },
      );
    } catch (error) {
      console.log("Purchase error (may be false positive):", error.message);
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <LoadingSpinner size="lg" message="Loading Dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <ErrorDisplay
          error={error}
          onRetry={fetchDashboardData}
          title="Error Loading Dashboard"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={ANIMATION_VARIANTS.container}
        className="max-w-6xl mx-auto mb-8 px-4"
      >
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 border border-slate-700/30">
          {/* Header */}
          <motion.div
            variants={ANIMATION_VARIANTS.item}
            className="text-center mb-6 sm:mb-8"
          >
            <motion.div
              className="text-4xl sm:text-5xl md:text-6xl mb-4"
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              🎭
            </motion.div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4">
              Welcome to Garba Rass 2025!
            </h1>

            <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/30">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">
                Ready to Dance the Night Away?
              </h2>
              <p className="text-base sm:text-lg text-slate-300 mb-4">
                You are logged in as{" "}
                <span className="text-navratri-orange font-semibold">
                  Guest
                </span>
              </p>
              <UserAvatar user={user || backendUser} />
            </div>
          </motion.div>

          {/* Event Information */}
          {event && (
            <motion.div
              variants={ANIMATION_VARIANTS.item}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8"
            >
              <EventDetailsCard event={event} />
              <PurchaseSection
                event={event}
                onPurchase={() => setShowPurchaseModal(true)}
                purchasing={purchasing}
              />
            </motion.div>
          )}

          {/* Quick Actions */}
          <QuickActions tickets={tickets} onRefresh={fetchDashboardData} />
        </div>
      </motion.div>

      <div id="tickets-section">
        <TicketsDetails />
      </div>

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

// Extracted components
const EventDetailsCard = ({ event }) => (
  <div className="bg-slate-700/30 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-600/30">
    <div className="text-center mb-4 sm:mb-6">
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">
        {event.name}
      </h3>
      <div className="space-y-3 sm:space-y-4">
        {[
          { icon: "📅", title: "Date", value: formatDate(event.date) },
          {
            icon: "🕐",
            title: "Time",
            value: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`,
          },
          { icon: "📍", title: "Venue", value: event.venue },
        ].map((item, index) => (
          <div key={index} className="bg-slate-600/40 rounded-xl p-3 sm:p-4">
            <div className="text-xl sm:text-2xl mb-2">{item.icon}</div>
            <h4 className="text-white font-semibold mb-1 text-sm sm:text-base">
              {item.title}
            </h4>
            <p className="text-slate-300 text-sm sm:text-base">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const PurchaseSection = ({ event, onPurchase, purchasing }) => (
  <div className="bg-gradient-to-br from-navratri-orange/20 to-navratri-yellow/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-navratri-orange/30">
    <div className="text-center">
      <div className="text-3xl sm:text-4xl mb-4">🎫</div>
      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-4">
        Get Your Tickets
      </h3>

      <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="space-y-2 mb-3">
          <div className="text-center">
            <h4 className="text-white font-bold text-sm mb-2">Pricing Tiers</h4>
          </div>
          <div className="grid grid-cols-1 gap-2 text-xs">
            <div className="flex justify-between items-center bg-slate-700/30 rounded-lg p-2">
              <span className="text-slate-300">Individual (1-3):</span>
              <span className="text-white font-medium">
                ₹{event.ticketPrice}
              </span>
            </div>
            <div className="flex justify-between items-center bg-green-900/20 border border-green-700/30 rounded-lg p-2">
              <span className="text-green-300">Group 4+</span>
              <span className="text-green-400 font-medium">
                ₹{event.groupPrice4 || event.ticketPrice}
              </span>
            </div>
            {event.ticketPrice - (event.groupPrice4 || event.ticketPrice) >
              0 && (
              <div className="text-center">
                <span className="text-green-400 text-xs">
                  💰 Save ₹
                  {event.ticketPrice - (event.groupPrice4 || event.ticketPrice)}{" "}
                  when booking 4 or more!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {event.availableTickets > 0 ? (
        <motion.button
          onClick={onPurchase}
          className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={purchasing}
        >
          <span className="text-lg sm:text-xl">🎟️</span>
          {purchasing ? "Processing..." : "Buy Tickets Now"}
        </motion.button>
      ) : (
        <div className="w-full px-4 sm:px-6 md:px-8 py-3 sm:py-4 bg-red-600/50 text-red-200 font-bold rounded-xl border border-red-500/30 text-sm sm:text-base">
          <span className="text-lg sm:text-xl mr-2">😔</span>
          Event Sold Out
        </div>
      )}
    </div>
  </div>
);

const QuickActions = ({ tickets, onRefresh }) => (
  <motion.div
    variants={ANIMATION_VARIANTS.item}
    className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
  >
    {[
      {
        icon: "🎫",
        title: "My Tickets",
        description: "View and manage your purchased tickets",
        action: "View Tickets",
        count: tickets.length,
        onClick: () =>
          document
            .getElementById("tickets-section")
            ?.scrollIntoView({ behavior: "smooth" }),
      },
      {
        icon: "🔄",
        title: "Refresh Data",
        description: "Update your dashboard with latest information",
        action: "Refresh Now",
        onClick: onRefresh,
      },
    ].map((item, index) => (
      <motion.div
        key={index}
        className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-600/30 cursor-pointer"
        whileHover={{ scale: 1.02, y: -2 }}
        onClick={item.onClick}
      >
        <div className="text-2xl sm:text-3xl mb-3">{item.icon}</div>
        <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">
          {item.title}
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm mb-3">
          {item.description}
        </p>
        <div className="flex items-center text-navratri-orange text-xs sm:text-sm font-medium">
          <span>
            {item.action} {item.count !== undefined && `(${item.count})`}
          </span>
          <span className="ml-2">→</span>
        </div>
      </motion.div>
    ))}
  </motion.div>
);

export default GuestDashboard;