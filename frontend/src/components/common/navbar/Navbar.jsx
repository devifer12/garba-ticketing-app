import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {useNavigate} from "react-router-dom"

const Navbar = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

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
  const titleScale = Math.max(0.8, 1 - scrollY * 0.003);
  const subtitleOpacity = Math.max(0, 1 - scrollY * 0.008);
  const subtitleY = scrollY * 0.5;

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}>
      <div className="container mx-auto px-4 py-8 pt-12">
        <div className="flex flex-col items-center">
          {/* Main Title with glassmorphism background on scroll */}
          <motion.div
            className={`flex justify-center items-center transition-all duration-300 rounded-full px-6 py-3 ${
              isScrolled
                ? "bg-slate-800/30 backdrop-blur-xl border border-slate-700/30 shadow-lg"
                : "bg-transparent"
            }`}
            style={{
              transform: `scale(${titleScale})`,
              transformOrigin: "center center",
            }}>
            <motion.h1
              className="text-4xl md:text-6xl cursor-pointer font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent text-center whitespace-nowrap"
              onClick={() => navigate("/")}
              style={{
                transform: `scale(${titleScale})`,
                transformOrigin: "center center", // Changed from 'center top' to 'center center'
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
            className="text-lg md:text-xl text-slate-300 font-light text-center mt-4"
            style={{
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`,
            }}>
            Pre-Navratri Grand Celebration
          </motion.p>

          {/* Decorative Dandiya Sticks */}
          <motion.div
            className="flex items-center gap-4 mt-4"
            style={{ opacity: subtitleOpacity }}
            animate={{
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
            }}></motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
