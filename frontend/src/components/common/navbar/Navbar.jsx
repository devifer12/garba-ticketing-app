// frontend/src/components/common/navbar/Navbar.jsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { GoogleSignInButton } from "../../ui/Button";
import UserProfile from "../../auth/UserProfile";

const Navbar = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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
    <>
      {/* Fixed Navbar Container */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 transition-all duration-300 pointer-events-none"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}>
        {/* Top Bar with Controls */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div className="flex justify-end items-start">
            {/* Authentication Section - Right Side */}
            <div className="flex items-center mt-8 pointer-events-auto">
              {loading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm hidden lg:inline">Loading...</span>
                </div>
              ) : user ? (
                <UserProfile />
              ) : (
                <GoogleSignInButton
                  variant="secondary"
                  className="text-xs sm:text-sm w-auto min-w-auto"
                  showTextOnMobile={false}
                />
              )}
            </div>
          </div>
        </div>

        {/* Main Navbar Content - Centered */}
        <div className="container mx-auto px-4 lg:pt-8 md:pt-10 sm:py-8 pt-12 pointer-events-none">
          <div className="flex flex-col items-center pointer-events-none">
            {/* Main Title with glassmorphism background on scroll */}
            <motion.div
              className={`flex justify-center items-center transition-all duration-300 rounded-full px-4 sm:px-6 py-2 sm:py-3 cursor-pointer pointer-events-auto ${
                isScrolled
                  ? "bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 shadow-lg"
                  : "bg-transparent"
              }`}
              style={{
                transform: `scale(${titleScale})`,
                transformOrigin: "center center",
              }}
              onClick={() => {
                if (location.pathname === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else {
                  navigate("/");
                }
              }}>
              <motion.h1
                className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent text-center whitespace-nowrap"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                style={{
                  transform: `scale(${titleScale})`,
                  transformOrigin: "center center",
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
              className="text-sm sm:text-lg md:text-xl text-slate-300 font-light text-center mt-2 sm:mt-4 px-4 pointer-events-none"
              style={{
                opacity: subtitleOpacity,
                transform: `translateY(${subtitleY}px)`,
              }}>
              Pre-Navratri Grand Celebration
            </motion.p>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navbar;
