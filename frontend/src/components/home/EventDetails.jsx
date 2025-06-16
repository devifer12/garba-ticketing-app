import React from "react";
import { motion } from "framer-motion";
import { PrimaryButton, GoogleSignInButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime } from "../../utils/helpers";

const EventDetails = ({ event }) => {
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

  // Default event details if no event data
  const defaultEventDetails = {
    date: "August 15, 2025",
    time: "6:00 PM - 10:00 PM",
    venue: "Vrindavan hall, Kandivali",
    price: "₹399",
    capacity: "300 People Only",
  };

  const eventDetails = event ? {
    date: formatDate(event.date),
    time: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`,
    venue: event.venue,
    price: `₹${event.ticketPrice}`,
    capacity: `${event.totalTickets} People Only`,
    available: event.availableTickets
  } : defaultEventDetails;

  return (
    <section className="flex flex-col justify-center items-center py-12 sm:py-20 relative">
      {/* Decorative Dandiya Sticks */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Left side decorative elements */}
        <motion.div
          className="absolute top-20 left-4 sm:left-10 w-2 h-12 sm:h-16 bg-gradient-to-b from-navratri-red to-navratri-orange rounded-full opacity-20"
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
          className="absolute top-32 left-8 sm:left-16 w-2 h-12 sm:h-16 bg-gradient-to-b from-navratri-yellow to-navratri-green rounded-full opacity-20"
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
          className="absolute top-20 right-4 sm:right-10 w-2 h-12 sm:h-16 bg-gradient-to-b from-navratri-pink to-navratri-violet rounded-full opacity-20"
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
          className="absolute top-32 right-8 sm:right-16 w-2 h-12 sm:h-16 bg-gradient-to-b from-navratri-blue to-navratri-indigo rounded-full opacity-20"
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

      {/* Event Image - Updated to use backend image */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto flex justify-center items-center h-32 sm:h-40 md:h-50 w-full max-w-sm sm:max-w-md md:max-w-lg rounded-xl mb-4 sm:mb-5 overflow-hidden">
        {event?.eventImage ? (
          <motion.img 
            src={event.eventImage} 
            alt={`${event.name} venue`}
            className="w-full h-full object-cover rounded-xl shadow-lg"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="bg-slate-700/50 backdrop-blur-xl w-full h-full rounded-xl flex items-center justify-center border border-slate-600/30">
            <div className="text-center p-4">
              <div className="text-3xl sm:text-4xl mb-2">🏢</div>
              <h3 className="text-white font-medium text-lg sm:text-xl mb-1">Venue Image</h3>
              <p className="text-slate-400 text-sm">Image will be displayed here</p>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4">
        
        {/* Section Title */}
        <motion.div variants={itemVariants} className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4">
            Event Details
          </h2>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-navratri-orange to-navratri-yellow rounded-full mx-auto"></div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12 max-w-6xl mx-auto">
          {/* Date & Time Card */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50 hover:border-navratri-orange/30 transition-all duration-300 relative overflow-hidden group"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-orange/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <motion.div
              className="text-3xl sm:text-4xl mb-2 sm:mb-3 relative z-10"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}>
              📅
            </motion.div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 relative z-10">
              Date & Time
            </h3>
            <p className="text-slate-300 relative z-10 text-sm sm:text-base">{eventDetails.date}</p>
            <p className="text-slate-300 relative z-10 text-sm sm:text-base">{eventDetails.time}</p>
          </motion.div>

          {/* Venue Card */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-slate-700/50 hover:border-navratri-pink/30 transition-all duration-300 relative overflow-hidden group"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
            {/* Decorative background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-pink/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <motion.div
              className="text-3xl sm:text-4xl mb-2 sm:mb-3 relative z-10"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}>
              📍
            </motion.div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 relative z-10">
              Venue
            </h3>
            <p className="text-slate-300 relative z-10 text-sm sm:text-base">{eventDetails.venue}</p>
          </motion.div>

          {/* Ticket Price Card */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-navratri-yellow/20 sm:col-span-2 lg:col-span-1 relative overflow-hidden group"
            whileHover={{
              y: -5,
              boxShadow: "0 20px 40px rgba(255,215,0,0.1)",
            }}>
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-yellow/5 to-transparent"></div>
            <motion.div
              className="text-3xl sm:text-4xl mb-2 sm:mb-3 relative z-10"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 3, -3, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}>
              🎫
            </motion.div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2 relative z-10">
              Ticket Price
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-navratri-yellow relative z-10">
              {eventDetails.price}
            </p>
            <p className="text-xs sm:text-sm text-slate-400 relative z-10">
              {eventDetails.capacity}
            </p>
            {event && (
              <p className="text-xs sm:text-sm text-navratri-green relative z-10 mt-1">
                {eventDetails.available} tickets remaining
              </p>
            )}
          </motion.div>
        </div>

        {/* CTA Buttons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-10 px-4">
          
          {/* Primary Buy Tickets Button */}
          <PrimaryButton className="w-auto sm:w-auto text-base sm:text-xl px-7 sm:px-8 py-3 sm:py-4">
            🎟️ Book Your Tickets Now
          </PrimaryButton>

          {/* Secondary Sign In Button - Only show if not authenticated */}
          {!user && (
            <GoogleSignInButton 
              className="w-auto sm:w-auto text-base sm:text-xl px-10 sm:px-8 py-3 sm:py-4"
              showTextOnMobile={true}
            >
              📱 Sign In with Google
            </GoogleSignInButton>
          )}
        </motion.div>

        {/* Limited Tickets Warning */}
        <motion.div variants={itemVariants} className="text-center px-4">
          <motion.p
            className="text-navratri-yellow font-bold text-base sm:text-lg"
            animate={{
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.02, 1],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}>
            ⚡ {event ? `Only ${event.availableTickets} Tickets Available!` : 'Only 300 Tickets Available!'}
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default EventDetails;