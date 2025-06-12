import React from 'react';
import { motion } from 'framer-motion';

const VenueSection = ({ event }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
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

  if (!event) return null;

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-28 h-28 border border-navratri-indigo/10 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-36 h-36 border border-navratri-orange/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-navratri-yellow/5 rounded-full blur-xl"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4 relative z-10"
      >
        <div className="max-w-6xl mx-auto">
          {/* Section Title */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-indigo via-navratri-blue to-navratri-green bg-clip-text text-transparent mb-4">
              Venue Information
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-navratri-indigo to-navratri-green rounded-full mx-auto mb-4"></div>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Join us at our beautiful venue for an unforgettable Garba experience
            </p>
          </motion.div>

          {/* Main Venue Card */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-12 border border-slate-700/30 relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-navratri-indigo via-navratri-blue to-navratri-green"></div>
            </div>

            <div className="relative z-10">
              {/* Venue Header */}
              <div className="text-center mb-8">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  📍
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  {event.venue}
                </h3>
                <p className="text-slate-300 text-lg">
                  The perfect setting for our Garba celebration
                </p>
              </div>

              {/* Venue Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Date & Time */}
                <div className="bg-slate-700/50 rounded-2xl p-6 text-center">
                  <div className="text-3xl mb-3">📅</div>
                  <h4 className="text-white font-bold text-lg mb-2">Date & Time</h4>
                  <p className="text-slate-300 text-sm mb-1">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-slate-300 text-sm">
                    {event.startTime} - {event.endTime}
                  </p>
                </div>

                {/* Capacity */}
                <div className="bg-slate-700/50 rounded-2xl p-6 text-center">
                  <div className="text-3xl mb-3">👥</div>
                  <h4 className="text-white font-bold text-lg mb-2">Capacity</h4>
                  <p className="text-navratri-green font-bold text-xl">
                    {event.totalTickets}
                  </p>
                  <p className="text-slate-300 text-sm">people</p>
                </div>

                {/* Facilities */}
                <div className="bg-slate-700/50 rounded-2xl p-6 text-center md:col-span-2 lg:col-span-1">
                  <div className="text-3xl mb-3">🏢</div>
                  <h4 className="text-white font-bold text-lg mb-2">Facilities</h4>
                  <div className="space-y-1 text-slate-300 text-sm">
                    <p>✓ Air Conditioned</p>
                    <p>✓ Parking Available</p>
                    <p>✓ Sound System</p>
                  </div>
                </div>
              </div>

              {/* Venue Features */}
              <div className="bg-gradient-to-r from-navratri-indigo/20 to-navratri-blue/20 rounded-2xl p-6 mb-8 border border-navratri-indigo/30">
                <h4 className="text-white font-bold text-xl mb-4 text-center">
                  🌟 Venue Highlights
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { icon: "🎵", text: "Professional Sound System" },
                    { icon: "💡", text: "LED Lighting Setup" },
                    { icon: "🚗", text: "Ample Parking Space" },
                    { icon: "🍽️", text: "Food & Beverage Area" },
                    { icon: "🚻", text: "Clean Restroom Facilities" },
                    { icon: "🔒", text: "Secure Environment" },
                    { icon: "♿", text: "Wheelchair Accessible" },
                    { icon: "📶", text: "Free WiFi Available" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-slate-300 text-sm">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Directions */}
              <div className="text-center">
                <h4 className="text-white font-bold text-xl mb-4">
                  🗺️ Getting There
                </h4>
                <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                  The venue is easily accessible by public transport and has ample parking space. 
                  Detailed directions will be provided with your ticket confirmation.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <motion.button
                    className="px-6 py-3 bg-navratri-blue/20 text-navratri-blue border border-navratri-blue/30 rounded-lg hover:bg-navratri-blue/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(event.venue)}`, '_blank')}
                  >
                    📍 View on Google Maps
                  </motion.button>
                  
                  <motion.button
                    className="px-6 py-3 bg-navratri-green/20 text-navratri-green border border-navratri-green/30 rounded-lg hover:bg-navratri-green/30 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🚗 Get Directions
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default VenueSection;