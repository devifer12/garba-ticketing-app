import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { eventAPI, adminAPI, authAPI } from "../../../../services/api";
import { useApi } from "../../../../hooks/useApi";
import { ANIMATION_VARIANTS } from "../../../../utils/constants.js";
import LoadingSpinner from "../../../ui/LoadingSpinner";
import UserAvatar from "../../../ui/UserAvatar";
import EventManager from "./EventManager";
import UserManagement from "./UserManagement";
import TicketManagement from "./TicketManagement";
import AnalyticsDashboard from "./AnalyticsDashboard";
import RefundManagement from "./RefundManagement";

const AdminDashboard = () => {
  const { user, backendUser, refreshUserData } = useAuth();
  const { loading, error, execute } = useApi();
  const [currentView, setCurrentView] = useState("dashboard");
  const [eventStatus, setEventStatus] = useState({
    exists: false,
    loading: true,
    eventData: null,
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    totalRevenue: 0,
    revenueToday: 0,
    loading: true,
  });
  const [roleCheckLoading, setRoleCheckLoading] = useState(false);
  const navigate = useNavigate();

  const isAdmin = backendUser?.role === "admin";
  const isManager = backendUser?.role === "manager";
  const hasAdminAccess = isAdmin || isManager;

  const checkEventStatus = async () => {
    try {
      await execute(
        async (signal) => {
          const existsResponse = await eventAPI.checkEventExists(signal);
          const exists = existsResponse.data.exists;

          let eventData = null;
          if (exists) {
            try {
              const eventResponse = await eventAPI.getCurrentEvent(signal);
              eventData = eventResponse.data.data;
            } catch (eventError) {
              if (eventError.name !== "AbortError") {
                console.warn(
                  "Event exists but could not fetch details:",
                  eventError,
                );
              }
            }
          }

          setEventStatus({ exists, loading: false, error: null, eventData });
        },
        {
          cacheKey: "admin-event-status",
          cacheDuration: 3 * 60 * 1000, // 3 minutes cache
        },
      );
    } catch (error) {
      console.error("Failed to check event status:", error);
      setEventStatus({
        exists: false,
        loading: false,
        error: error.message,
        eventData: null,
      });
    }
  };

  const fetchDashboardStats = async () => {
    try {
      await execute(
        async (signal) => {
          const [usersResponse, analyticsResponse] = await Promise.all([
            adminAPI.getUserCount(signal).catch(() => ({ data: { count: 0 } })),
            adminAPI.getDashboardAnalytics(signal).catch(() => ({
              data: {
                data: {
                  users: { total: 0 },
                  tickets: { total: 0 },
                  revenue: { total: 0, today: 0 },
                },
              },
            })),
          ]);

          const analyticsData = analyticsResponse.data.data;

          setStats({
            totalUsers: usersResponse.data.count || 0,
            totalTickets: analyticsData.tickets?.total || 0,
            totalRevenue: analyticsData.revenue?.total || 0,
            revenueToday: analyticsData.revenue?.today || 0,
            averageTicketValue:
              analyticsData.analytics?.averageTicketValue || 0,
            conversionRate: analyticsData.analytics?.conversionRate || 0,
            loading: false,
          });
        },
        {
          cacheKey: "admin-dashboard-stats",
          cacheDuration: 2 * 60 * 1000, // 2 minutes cache
        },
      );
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
      setStats({
        totalUsers: 0,
        totalTickets: 0,
        totalRevenue: 0,
        revenueToday: 0,
        averageTicketValue: 0,
        conversionRate: 0,
        loading: false,
      });
    }
  };

  const handleAssignAdminRole = async () => {
    setRoleCheckLoading(true);
    try {
      await execute(
        async () => {
          const response = await authAPI.assignAdminRole();
          if (response?.data?.success) {
            await refreshUserData();
          }
          return response;
        },
        {
          showSuccess: true,
          successMessage: "Admin role assigned successfully!",
        },
      );
    } catch (error) {
      console.error("Failed to assign admin role:", error);
    } finally {
      setRoleCheckLoading(false);
    }
  };

  useEffect(() => {
    if (backendUser) {
      if (!hasAdminAccess) {
        handleAssignAdminRole();
      } else {
        // Only fetch data if user has admin access
        Promise.all([checkEventStatus(), fetchDashboardStats()]).catch(
          (error) => {
            console.error("Failed to load admin dashboard data:", error);
          },
        );
      }
    }
  }, [backendUser, hasAdminAccess]);

  if (backendUser && !hasAdminAccess) {
    return (
      <AdminAccessRequired
        user={user || backendUser}
        onAssignRole={handleAssignAdminRole}
        loading={roleCheckLoading}
        onNavigateGuest={() => navigate("/dashboard/guest")}
      />
    );
  }

  if (currentView !== "dashboard") {
    return (
      <SubView
        view={currentView}
        onBack={() => setCurrentView("dashboard")}
        userRole={backendUser?.role}
      />
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
        <AdminHeader user={user || backendUser} userRole={backendUser?.role} />
        <StatsCards stats={stats} />
        <EventStatusCard
          eventStatus={eventStatus}
          onManageEvent={() => setCurrentView("event-manager")}
        />
        <ManagementCards
          onViewChange={setCurrentView}
          userRole={backendUser?.role}
        />
      </div>
    </motion.div>
  );
};

// Extracted components
const AdminAccessRequired = ({
  user,
  onAssignRole,
  loading,
  onNavigateGuest,
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={ANIMATION_VARIANTS.fadeIn}
    className="max-w-4xl mx-auto"
  >
    <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
      <div className="text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent mb-4">
          Admin Access Required
        </h1>

        <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <UserAvatar user={user} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAssignRole}
            disabled={loading}
            className="mt-6 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg mx-auto"
          >
            {loading ? (
              <LoadingSpinner size="sm" message="Requesting Access..." />
            ) : (
              <>
                <span className="text-xl">🔑</span>
                Request Admin Access
              </>
            )}
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNavigateGuest}
          className="px-6 py-3 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 rounded-lg transition-all flex items-center gap-2 mx-auto"
        >
          <span>👤</span>
          Go to Guest Dashboard
        </motion.button>
      </div>
    </div>
  </motion.div>
);

const AdminHeader = ({ user, userRole }) => (
  <motion.div variants={ANIMATION_VARIANTS.item} className="text-center mb-8">
    <motion.div
      className="text-6xl mb-4"
      animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
    >
      {userRole === "admin" ? "👑" : "📋"}
    </motion.div>

    <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-4">
      {userRole === "admin" ? "Admin Dashboard" : "Manager Dashboard"}
    </h1>

    <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
      <h2 className="text-2xl font-bold text-white mb-4">
        Welcome, {userRole === "admin" ? "Administrator" : "Manager"}!
      </h2>
      <UserAvatar user={user} />
    </div>
  </motion.div>
);

const StatsCards = ({ stats }) => (
  <motion.div
    variants={ANIMATION_VARIANTS.item}
    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
  >
    {[
      {
        icon: "👥",
        title: "Total Users",
        value: stats.totalUsers,
        color: "blue",
      },
      {
        icon: "🎫",
        title: "Tickets Sold",
        value: stats.totalTickets,
        color: "green",
      },
      {
        icon: "💰",
        title: "Total Revenue",
        value: `₹${stats.totalRevenue.toLocaleString()}`,
        color: "purple",
        subtitle: `₹${stats.revenueToday} today`,
      },
      {
        icon: "📊",
        title: "Avg. Ticket Value",
        value: `₹${stats.averageTicketValue || 0}`,
        color: "orange",
        subtitle: "per ticket",
      },
    ].map((stat, index) => (
      <motion.div
        key={index}
        className={`bg-gradient-to-br from-${stat.color}-900/40 to-${stat.color}-800/40 backdrop-blur-xl rounded-xl p-6 border border-${stat.color}-700/30`}
        whileHover={{ scale: 1.02 }}
      >
        <div className="text-3xl mb-3">{stat.icon}</div>
        <h3 className={`text-${stat.color}-300 font-medium mb-1`}>
          {stat.title}
        </h3>
        {stats.loading ? (
          <div
            className={`animate-pulse bg-${stat.color}-700/30 h-8 w-16 rounded`}
          ></div>
        ) : (
          <>
            <p className="text-white text-2xl font-bold">{stat.value}</p>
            {stat.subtitle && (
              <p className={`text-${stat.color}-400 text-sm mt-1`}>
                {stat.subtitle}
              </p>
            )}
          </>
        )}
      </motion.div>
    ))}
  </motion.div>
);

const EventStatusCard = ({ eventStatus, onManageEvent }) => (
  <motion.div
    variants={ANIMATION_VARIANTS.item}
    className="mb-8 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl p-6 border border-slate-600/30 shadow-lg"
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2">
        <span className="text-2xl">🎪</span>
        Event Status
      </h3>
      {!eventStatus.loading && (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            eventStatus.exists
              ? "bg-green-900/50 text-green-300 border border-green-700/30"
              : "bg-red-900/50 text-red-300 border border-red-700/30"
          }`}
        >
          {eventStatus.exists ? "Configured" : "Not Configured"}
        </span>
      )}
    </div>

    {eventStatus.loading ? (
      <LoadingSpinner message="Loading event status..." />
    ) : (
      <div className="space-y-4">
        <p className="text-slate-300 text-sm">
          {eventStatus.exists
            ? "The event is currently configured and active."
            : "No event has been created yet."}
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onManageEvent}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium rounded-lg transition-all flex items-center gap-2"
        >
          <span>🎪</span>
          {eventStatus.exists ? "Manage Event" : "Create Event"}
        </motion.button>
      </div>
    )}
  </motion.div>
);

const ManagementCards = ({ onViewChange, userRole }) => {
  const cards = [
    {
      icon: "👥",
      title: "Manage Users",
      description:
        "View and manage registered users, permissions, and user activity.",
      view: "user-management",
      color: "indigo",
      adminOnly: false,
    },
    {
      icon: "🎫",
      title: "Manage Tickets",
      description:
        "View ticket sales, process refunds, and manage ticket inventory.",
      view: "ticket-management",
      color: "emerald",
      adminOnly: false,
    },
    {
      icon: "📊",
      title: "Analytics",
      description:
        "View detailed reports, charts, and insights about event performance.",
      view: "analytics",
      color: "violet",
      adminOnly: false,
    },
    {
      icon: "💰",
      title: "Manage Refunds",
      description:
        "Track and manage refund requests, process manual refunds.",
      view: "refund-management",
      color: "purple",
      adminOnly: false,
    },
  ];

  // Show all cards for both admin and manager
  const visibleCards = cards;

  return (
    <motion.div
      variants={ANIMATION_VARIANTS.item}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {visibleCards.map((card, index) => (
        <motion.div
          key={index}
          className={`bg-gradient-to-br from-${card.color}-900/40 to-${card.color}-800/40 backdrop-blur-xl rounded-xl p-6 border border-${card.color}-700/30 cursor-pointer`}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onViewChange(card.view)}
        >
          <div className="text-4xl mb-4">{card.icon}</div>
          <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
          <p className={`text-${card.color}-300 text-sm mb-4`}>
            {card.description}
          </p>
          <div
            className={`flex items-center text-${card.color}-400 text-sm font-medium`}
          >
            <span>Open {card.title}</span>
            <span className="ml-2">→</span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

const SubView = ({ view, onBack, userRole }) => {
  const components = {
    "event-manager": EventManager,
    "user-management": UserManagement,
    "ticket-management": TicketManagement,
    analytics: AnalyticsDashboard,
    "refund-management": RefundManagement,
  };

  const Component = components[view];

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 rounded-lg transition-all flex items-center gap-2"
        >
          ← Back to Dashboard
        </button>
      </div>
      {Component && <Component userRole={userRole} />}
    </div>
  );
};

export default AdminDashboard;