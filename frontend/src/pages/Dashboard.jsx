import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/navbar/Navbar';

// Import role-based dashboard components
import AdminDashboard from '../components/dashboard/roles/admin/AdminDashboard';
import GuestDashboard from '../components/dashboard/roles/GuestDashboard';
import ManagerDashboard from '../components/dashboard/roles/ManagerDashboard';
import QrCheckerDashboard from '../components/dashboard/roles/QrCheckerDashboard';

const Dashboard = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const { user, backendUser, loading, isAuthenticated } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Determine user role from backend user data
  useEffect(() => {
    if (backendUser?.role) {
      setUserRole(backendUser.role);
    } else if (user) {
      // Fallback to 'guest' if no role is set
      setUserRole('guest');
    }
  }, [backendUser, user]);

  // Handle role-based redirection
  useEffect(() => {
    if (!loading && isAuthenticated && userRole) {
      // If no role in URL, redirect to role-specific dashboard
      if (!role) {
        setIsRedirecting(true);
        navigate(`/dashboard/${userRole}`, { replace: true });
        return;
      }

      // If role in URL doesn't match user's role, redirect to correct role
      if (role !== userRole) {
        setIsRedirecting(true);
        navigate(`/dashboard/${userRole}`, { replace: true });
        return;
      }

      setIsRedirecting(false);
    }
  }, [loading, isAuthenticated, userRole, role, navigate]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // Loading state
  if (loading || isRedirecting || !userRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="w-16 h-16 border-4 border-navratri-orange border-t-transparent rounded-full mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRedirecting ? 'Redirecting...' : 'Loading Dashboard...'}
          </h2>
          <p className="text-slate-400">
            {isRedirecting ? 'Taking you to your dashboard' : 'Please wait while we set up your dashboard'}
          </p>
        </motion.div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Will redirect to home
  }

  // Invalid role handling
  const validRoles = ['admin', 'guest', 'manager', 'qrchecker'];
  if (!validRoles.includes(role || userRole)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Navbar />
        <motion.div
          className="text-center max-w-md mx-auto p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/30">
            <motion.div
              className="text-6xl mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
            >
              ⚠️
            </motion.div>
            <h2 className="text-2xl font-bold text-white mb-4">Invalid Role</h2>
            <p className="text-slate-400 mb-6">
              Your account role "{role || userRole}" is not recognized. Please contact support.
            </p>
            <motion.button
              onClick={() => navigate('/', { replace: true })}
              className="px-6 py-3 bg-navratri-orange text-white rounded-lg font-semibold hover:bg-navratri-orange/80 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Go to Home
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    const currentRole = role || userRole;
    
    switch (currentRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'qrchecker':
        return <QrCheckerDashboard />;
      case 'guest':
      default:
        return <GuestDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Subtle geometric patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-32 right-20 w-32 h-32 border border-navratri-orange rounded-full"></div>
          <div className="absolute bottom-40 left-16 w-24 h-24 border border-navratri-pink rounded-full"></div>
        </div>

        {/* Floating orbs */}
        <motion.div
          className="absolute w-16 h-16 bg-gradient-to-r from-navratri-yellow to-transparent rounded-full opacity-10 blur-xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ left: '15%', top: '25%' }}
        />

        <motion.div
          className="absolute w-20 h-20 bg-gradient-to-r from-navratri-green to-transparent rounded-full opacity-8 blur-xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 25, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ right: '20%', top: '40%' }}
        />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Dashboard Content */}
      <main className="relative z-10 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4"
        >
          {renderDashboard()}
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;