import React from "react";
import { motion } from "framer-motion";
import { PrimaryButton, GoogleSignInButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const EventDetails = () => {
  const { user } = useAuth();

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
    <section className=" flex flex-col justify-center items-center py-20 relative">
      {/* Decorative Dandiya Sticks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left side decorative elements */}
        <motion.div
          className="absolute top-20 left-10 w-2 h-16 bg-gradient-to-b from-navratri-red to-navratri-orange rounded-full opacity-20"
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
          }}
        />
        <motion.div
          className="absolute top-32 left-16 w-2 h-16 bg-gradient-to-b from-navratri-yellow to-navratri-green rounded-full opacity-20"
          animate={{
            rotate: [0, -15, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 0.5,
          }}
        />

        {/* Right side decorative elements */}
        <motion.div
          className="absolute top-20 right-10 w-2 h-16 bg-gradient-to-b from-navratri-pink to-navratri-violet rounded-full opacity-20"
          animate={{
            rotate: [0, -15, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 1,
          }}
        />
        <motion.div
          className="absolute top-32 right-16 w-2 h-16 bg-gradient-to-b from-navratri-blue to-navratri-indigo rounded-full opacity-20"
          animate={{
            rotate: [0, 15, -15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: 1.5,
          }}
        />
      </div>

      {/* Event Details Cards */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className=" mx-auto flex justify-center items-center h-50 w-100 bg-gray-700 rounded-xl mb-5">
        <h1 className="text-3xl">Venue image</h1>
      </motion.div>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-6xl mx-auto">
          {/* Date & Time Card */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-navratri-orange/30 transition-all duration-300 relative overflow-hidden group"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <motion.div
              className="text-4xl mb-3 relative z-10"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}>
              📅
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">
              Date & Time
            </h3>
            <p className="text-slate-300 relative z-10">{eventDetails.date}</p>
            <p className="text-slate-300 relative z-10">{eventDetails.time}</p>
          </motion.div>

          {/* Venue Card */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 hover:border-navratri-pink/30 transition-all duration-300 relative overflow-hidden group"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <motion.div
              className="text-4xl mb-3 relative z-10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              📍
            </motion.div>
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">
              Venue
            </h3>
            <p className="text-slate-300 relative z-10">{eventDetails.venue}</p>
          </motion.div>

          {/* Ticket Price Card */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-navratri-yellow/20 md:col-span-2 lg:col-span-1 relative overflow-hidden group"
            whileHover={{
              y: -5,
              boxShadow: "0 20px 40px rgba(255,215,0,0.1)",
            }}>
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-yellow/5 to-transparent"></div>
            <motion.div
              className="text-4xl mb-3 relative z-10"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}>
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
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10">
          
          {/* Primary Buy Tickets Button - Updated */}
          <PrimaryButton>
            🎟️ Book Your Tickets Now
          </PrimaryButton>

          {/* Secondary Sign In Button - Only show if not authenticated */}
          {!user && (
            <GoogleSignInButton>
              📱 Sign In with Google
            </GoogleSignInButton>
          )}
        </motion.div>

        {/* Limited Tickets Warning */}
        <motion.div variants={itemVariants} className="text-center">
          <motion.p
            className="text-navratri-yellow font-bold text-lg"
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}>
            ⚡ Only {eventDetails.capacity.split(" ")[0]} Tickets Available!
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default EventDetails;