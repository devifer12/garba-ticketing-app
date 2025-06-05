import React from 'react';
import { motion } from 'framer-motion';
import { PrimaryButton, SecondaryButton } from '../ui/Button';

const Hero = () => {
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
    date: "August 15, 2025",
    time: "6:00 PM - 10:00 PM",
    venue: "Vrindavan hall, Kandivali",
    price: "₹399",
    capacity: "300 People Only",
  };

  return (
    <section className="min-h-screen pt-32 pb-16 relative">
      {/* Animated colorful dots */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-16"
      >
        <motion.div 
          variants={itemVariants}
          className="flex justify-center space-x-2 mb-12"
        >
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

      {/* Event Details Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4"
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {/* Date & Time Card */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-navratri-orange/30 transition-all duration-300"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
          >
            <motion.div
              className="text-4xl mb-3"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              📅
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Date & Time</h3>
            <p className="text-slate-300">{eventDetails.date}</p>
            <p className="text-slate-300">{eventDetails.time}</p>
          </motion.div>

          {/* Venue Card */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-navratri-pink/30 transition-all duration-300"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
          >
            <motion.div
              className="text-4xl mb-3"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              📍
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2">Venue</h3>
            <p className="text-slate-300">{eventDetails.venue}</p>
          </motion.div>

          {/* Ticket Price Card */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-navratri-yellow/20 md:col-span-2 lg:col-span-1 relative overflow-hidden"
            whileHover={{
              y: -5,
              boxShadow: "0 20px 40px rgba(255,215,0,0.1)",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-yellow/5 to-transparent"></div>
            <motion.div
              className="text-4xl mb-3 relative z-10"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
            >
              🎫
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">
              Ticket Price
            </h3>
            <p className="text-3xl font-bold text-navratri-yellow relative z-10">
              {eventDetails.price}
            </p>
            <p className="text-sm text-slate-400 relative z-10">
              {eventDetails.capacity}
            </p>
          </motion.div>
        </div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10"
        >
          <PrimaryButton>
            🎟️ Book Your Tickets Now
          </PrimaryButton>

          <SecondaryButton>
            📱 Sign In with Google
          </SecondaryButton>
        </motion.div>

        {/* Limited Tickets Warning */}
        <motion.div variants={itemVariants} className="text-center">
          <motion.p
            className="text-navratri-yellow font-bold text-lg"
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            ⚡ Only {eventDetails.capacity.split(" ")[0]} Tickets Available!
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;