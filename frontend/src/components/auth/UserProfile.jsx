// frontend/src/components/auth/UserProfile.jsx
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { GoogleSignInButton } from "../ui/Button";
import { useNavigate } from "react-router-dom";

const UserProfile = ({ className = "" }) => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const travelToDashboard = () => {
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 sm:gap-4 cursor-pointer ${className}`}
      onClick={travelToDashboard}
      >
      {/* User Avatar */}
      <motion.div
        className="flex items-center gap-2 sm:gap-3 bg-slate-800/50 backdrop-blur-xl rounded-full px-2 sm:px-4 py-1 sm:py-2 border border-slate-700/30"
        whileHover={{ scale: 1.02 }}>
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName}
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-navratri-orange to-navratri-yellow flex items-center justify-center text-slate-900 font-bold text-xs sm:text-sm">
            {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
          </div>
        )}

        <div className="hidden sm:block">
          <p className="text-white font-medium text-xs sm:text-sm">
            {user.displayName || "User"}
          </p>
          <p className="text-slate-400 text-xs">{user.email}</p>
        </div>
      </motion.div>

      {/* Logout Button */}
      <GoogleSignInButton
        onClick={handleLogout}
        disabled={loading}
        className="text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2 cursor-pointer">
        {loading ? "Signing out..." : "Sign Out"}
      </GoogleSignInButton>
    </motion.div>
  );
};

export default UserProfile;