// frontend/src/components/auth/UserProfile.jsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const UserProfile = ({ className = "" }) => {
  const { user, backendUser, logout, loading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const userRole = backendUser?.role || 'guest';
  const displayName = user.displayName || backendUser?.name || "User";
  const email = user.email || backendUser?.email;
  const photoURL = user.photoURL || backendUser?.profilePicture;

  const handleLogout = async () => {
    try {
      setIsDropdownOpen(false);
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleNavigation = (path) => {
    setIsDropdownOpen(false);
    navigate(path);
  };

  // Define menu items based on user role
  const getMenuItems = () => {
    const items = [
      {
        icon: "🏠",
        label: "Dashboard",
        action: () => handleNavigation("/dashboard"),
        show: true
      }
    ];

    // Add role-specific items
    if (userRole === 'guest') {
      items.push({
        icon: "🎫",
        label: "My Tickets",
        action: () => handleNavigation("/dashboard"),
        show: true
      });
    }

    if (userRole === 'qrchecker') {
      items.push({
        icon: "📱",
        label: "QR Scanner",
        action: () => handleNavigation("/dashboard/qrchecker"),
        show: true
      });
    }

    if (userRole === 'admin' || userRole === 'manager') {
      items.push({
        icon: "👥",
        label: "Manage Users",
        action: () => handleNavigation("/dashboard"),
        show: true
      });
    }

    // Always add sign out at the end
    items.push({
      icon: "🚪",
      label: "Sign Out",
      action: handleLogout,
      show: true,
      danger: true
    });

    return items.filter(item => item.show);
  };

  const menuItems = getMenuItems();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* User Profile Button */}
      <motion.button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 sm:gap-3 bg-slate-800/50 backdrop-blur-xl rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-slate-700/30 hover:border-slate-600/50 transition-all duration-200 cursor-pointer"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={loading}
      >
        {/* User Avatar */}
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-slate-600/30"
          />
        ) : (
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-navratri-orange to-navratri-yellow flex items-center justify-center text-slate-900 font-bold text-xs sm:text-sm">
            {displayName.charAt(0)}
          </div>
        )}

        {/* User Info - Hidden on mobile */}
        <div className="hidden sm:block text-left">
          <p className="text-white font-medium text-xs sm:text-sm leading-tight">
            {displayName}
          </p>
          <p className="text-slate-400 text-xs leading-tight">
            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
          </p>
        </div>

        {/* Dropdown Arrow */}
        <motion.div
          animate={{ rotate: isDropdownOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-slate-400"
        >
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-56 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* User Info Header - Visible on mobile */}
            <div className="sm:hidden px-4 py-3 border-b border-slate-700/30 bg-slate-700/30">
              <p className="text-white font-medium text-sm">{displayName}</p>
              <p className="text-slate-400 text-xs">{email}</p>
              <p className="text-navratri-orange text-xs font-medium mt-1">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={index}
                  onClick={item.action}
                  disabled={loading && item.danger}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                    item.danger 
                      ? 'text-red-300 hover:bg-red-900/20 hover:text-red-200' 
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm font-medium">
                    {loading && item.danger ? 'Signing out...' : item.label}
                  </span>
                  {loading && item.danger && (
                    <div className="ml-auto w-3 h-3 border border-red-300 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Footer with role badge */}
            <div className="px-4 py-2 border-t border-slate-700/30 bg-slate-700/20">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Logged in as</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  userRole === 'admin' ? 'bg-red-900/30 text-red-300' :
                  userRole === 'manager' ? 'bg-blue-900/30 text-blue-300' :
                  userRole === 'qrchecker' ? 'bg-green-900/30 text-green-300' :
                  'bg-gray-900/30 text-gray-300'
                }`}>
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;