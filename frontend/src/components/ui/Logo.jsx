import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Logo = () => {
  const navigate = useNavigate();
  const navratriColors = [
    "navratri-red",
    "navratri-orange",
    "navratri-yellow",
    "navratri-green",
    "navratri-blue",
    "navratri-indigo",
    "navratri-violet",
    "navratri-pink",
    "navratri-white",
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const eventDetails = {
    title: "Garba Rass 2025",
    subtitle: "Pre-Navratri Grand Celebration",
    date: "August 15, 2025",
    time: "6:00 PM - 10:00 PM",
    venue: "Vrindavan hall, Kandivali",
    price: "₹399",
    capacity: "300 People Only",
    // artists: ["DJ Vedant", "Kiran Dave", "Garba Queen Asha"],
  };
  
  return (
    <header>
      {/* Header */}
          <motion.div variants={itemVariants}>
            <motion.h1
              className="text-6xl md:text-8xl font-bold mb-4 font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "loop",
              }}
              style={{
                backgroundSize: "200% 200%",
              }}>
              {eventDetails.title}
            </motion.h1>

            <motion.p className="text-2xl md:text-3xl text-slate-300 mb-2 font-light">
              {eventDetails.subtitle}
            </motion.p>

            <motion.div className="flex justify-center space-x-2 mb-12">
              {navratriColors.map((color, index) => (
                <motion.div
                  key={color}
                  className={`w-3 h-3 bg-${color} rounded-full`}
                  animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.1,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
    </header>
  );
};

export default Logo;
