// frontend/src/components/common/navbar/Navbar.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { GoogleSignInButton } from "../../ui/Button";
import UserProfile from "../../auth/UserProfile";

const Navbar = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate scale and opacity based on scroll
  const titleScale = Math.max(0.7, 1 - scrollY * 0.002);
  const subtitleOpacity = Math.max(0, 1 - scrollY * 0.008);
  const subtitleY = scrollY * 0.5;

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}>
      
      {/* Mobile Menu Toggle */}
      <div className="md:hidden absolute top-4 left-4 z-60">
        <motion.button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-slate-800/50 backdrop-blur-xl rounded-lg border border-slate-700/30 text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </motion.button>
      </div>

      {/* Authentication Section - Top Right */}
      <div className="absolute top-4 right-4 z-60">
        {loading ? (
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm hidden sm:inline">Loading...</span>
          </div>
        ) : user ? (
          <UserProfile />
        ) : (
          <GoogleSignInButton variant="secondary" className="text-xs sm:text-sm px-3 py-2 sm:px-4">
            <span className="hidden sm:inline">Sign In</span>
            <span className="sm:hidden">Sign In</span>
          </GoogleSignInButton>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: isMobileMenuOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="md:hidden fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/30 z-50 p-6"
      >
        <div className="mt-16">
          <h3 className="text-white font-bold text-lg mb-4">Menu</h3>
          <div className="space-y-3">
            <button
              onClick={() => {
                navigate("/");
                setIsMobileMenuOpen(false);
              }}
              className="block w-full text-left text-slate-300 hover:text-white transition-colors py-2"
            >
              Home
            </button>
            {user && (
              <button
                onClick={() => {
                  navigate("/dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left text-slate-300 hover:text-white transition-colors py-2"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-6 sm:py-8 pt-8 sm:pt-12">
        <div className="flex flex-col items-center">
          {/* Main Title with glassmorphism background on scroll */}
          <motion.div
            className={`flex justify-center items-center transition-all duration-300 rounded-full px-4 sm:px-6 py-2 sm:py-3 ${
              isScrolled
                ? "bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 shadow-lg"
                : "bg-transparent"
            }`}
            style={{
              transform: `scale(${titleScale})`,
              transformOrigin: "center center",
            }}>
            <motion.h1
              className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl cursor-pointer font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent text-center whitespace-nowrap"
              onClick={() => navigate("/")}
              style={{
                transform: `scale(${titleScale})`,
                transformOrigin: "center center",
              }}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "loop",
              }}>
              Garba Rass 2025
            </motion.h1>
          </motion.div>

          {/* Subtitle - slides away on scroll */}
          <motion.p
            className="text-sm sm:text-lg md:text-xl text-slate-300 font-light text-center mt-2 sm:mt-4 px-4"
            style={{
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
            }}>
            Pre-Navratri Grand Celebration
          </motion.p>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;