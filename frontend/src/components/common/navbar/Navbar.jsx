import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      setIsScrolled(currentScrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate scale and opacity based on scroll
  const titleScale = Math.max(0.4, 1 - scrollY * 0.003);
  const subtitleOpacity = Math.max(0, 1 - scrollY * 0.008);
  const subtitleY = scrollY * 0.5;

  return (
    <motion.nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-transparent backdrop-blur-xl border-b border-slate-700/30' 
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center">
          {/* Main Title */}
          <motion.h1
            className="text-4xl md:text-6xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent text-center"
            style={{ 
              transform: `scale(${titleScale})`,
              transformOrigin: 'center top'
            }}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatType: "loop",
            }}
          >
            Garba Rass 2025
          </motion.h1>

          {/* Subtitle - slides away on scroll */}
          <motion.p 
            className="text-lg md:text-xl text-slate-300 font-light text-center mt-2"
            style={{ 
              opacity: subtitleOpacity,
              transform: `translateY(${subtitleY}px)`
            }}
          >
            Pre-Navratri Grand Celebration
          </motion.p>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;