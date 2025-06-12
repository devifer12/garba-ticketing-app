import React from 'react';
import { motion } from 'framer-motion';
import { PrimaryButton } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

const TicketSection = ({ event }) => {
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

  if (!event) return null;

  const soldPercentage = ((event.totalTickets - event.availableTickets) / event.totalTickets) * 100;

  return (
    <section className="py-12 sm:py-20 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-10 w-32 h-32 border border-navratri-green/10 rounded-full"></div>
        <div className="absolute bottom-10 left-10 w-24 h-24 border border-navratri-blue/10 rounded-full"></div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="container mx-auto px-4 relative z-10"
      >
        <div className="max-w-4xl mx-auto">
          {/* Section Title */}
          <motion.div
            variants={itemVariants}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-green via-navratri-blue to-navratri-violet bg-clip-text text-transparent mb-4">
              Ticket Information
            </h2>
            <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-navratri-green to-navratri-blue rounded-full mx-auto"></div>
          </motion.div>

          {/* Main Ticket Card */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 md:p-12 border border-slate-700/30 relative overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-navratri-orange via-navratri-yellow to-navratri-pink"></div>
            </div>

            <div className="relative z-10">
              {/* Ticket Header */}
              <div className="text-center mb-8">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🎫
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  Get Your Tickets Now!
                </h3>
                <p className="text-slate-300 text-lg">
                  Secure your spot at the most awaited Garba celebration
                </p>
              </div>

              {/* Ticket Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Price Information */}
                <div className="bg-gradient-to-br from-navratri-orange/20 to-navratri-yellow/20 rounded-2xl p-6 border border-navratri-orange/30">
                  <div className="text-center">
                    <div className="text-3xl mb-3">💰</div>
                    <h4 className="text-white font-bold text-xl mb-2">Ticket Price</h4>
                    <div className="text-4xl font-bold text-navratri-yellow mb-2">
                      ₹{event.ticketPrice}
                    </div>
                    <p className="text-slate-300 text-sm">per person</p>
                  </div>
                </div>

                {/* Availability Information */}
                <div className="bg-gradient-to-br from-navratri-green/20 to-navratri-blue/20 rounded-2xl p-6 border border-navratri-green/30">
                  <div className="text-center">
                    <div className="text-3xl mb-3">📊</div>
                    <h4 className="text-white font-bold text-xl mb-2">Availability</h4>
                    <div className="text-2xl font-bold text-navratri-green mb-2">
                      {event.availableTickets} / {event.totalTickets}
                    </div>
                    <p className="text-slate-300 text-sm">tickets remaining</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400 text-sm">Tickets Sold</span>
                  <span className="text-white font-semibold">{soldPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-navratri-orange to-navratri-yellow rounded-full"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${soldPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* What's Included */}
              <div className="bg-slate-700/50 rounded-2xl p-6 mb-8">
                <h4 className="text-white font-bold text-xl mb-4 text-center">
                  🎉 What's Included
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { icon: "🎭", text: "Traditional Garba & Raas" },
                    { icon: "🎵", text: "Live DJ & Music" },
                    { icon: "🍽️", text: "Gujarati Snacks" },
                    { icon: "🏆", text: "Dance Competitions" },
                    { icon: "📸", text: "Photo Opportunities" },
                    { icon: "🎁", text: "Surprise Gifts" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-slate-300">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* CTA Section */}
              <div className="text-center">
                {event.availableTickets > 0 ? (
                  <>
                    <PrimaryButton className="text-xl px-8 py-4 mb-4">
                      🎟️ Buy Tickets Now - ₹{event.ticketPrice}
                    </PrimaryButton>
                    <p className="text-slate-400 text-sm">
                      Secure payment • Instant confirmation • Mobile tickets
                    </p>
                  </>
                ) : (
                  <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-6">
                    <div className="text-4xl mb-3">😔</div>
                    <h4 className="text-red-300 font-bold text-xl mb-2">Sold Out!</h4>
                    <p className="text-red-200">
                      All tickets have been sold. Join our waitlist for updates.
                    </p>
                  </div>
                )}
              </div>

              {/* Urgency Message */}
              {event.availableTickets > 0 && event.availableTickets <= 50 && (
                <motion.div
                  className="mt-6 bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center"
                  animate={{
                    scale: [1, 1.02, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <p className="text-red-300 font-bold">
                    ⚡ Hurry! Only {event.availableTickets} tickets left!
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default TicketSection;