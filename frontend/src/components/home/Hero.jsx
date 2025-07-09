import React, { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { PrimaryButton, GoogleSignInButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime } from "../../utils/helpers";
import LazyImage from "../ui/LazyImage";
import hero1 from "../../assets/hero1.webp";
import Dandiya from "../../assets/dandiya.webp";

const Hero = memo(({ event }) => {
  const { user } = useAuth();

  // Memoize animation variants to prevent recreation
  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1, // Further reduced for performance
        },
      },
    }),
    [],
  );

  const itemVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 15 }, // Further reduced
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }, // Further reduced
      },
    }),
    [],
  );

  // Memoize formatted event data
  const eventData = useMemo(() => {
    if (!event) return null;
    return {
      formattedDate: formatDate(event.date, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: undefined,
      }),
      dateShort: formatDate(event.date, { month: "short", day: "numeric" }),
      timeRange: `${formatTime(event.startTime)} - ${formatTime(event.endTime)}`,
    };
  }, [event]);

  return (
    <section className="min-h-screen pt-32 sm:pt-40 md:pt-48 pb-8 sm:pb-16 relative">
      {/* Hero Content with Image */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4"
      >
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side - Text Content */}
          <motion.div
            variants={itemVariants}
            className="space-y-6 sm:space-y-8 text-center lg:text-left"
          >
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 10, // Slower for better performance
                repeat: Infinity,
                repeatType: "loop",
              }}
            >
              {event && eventData && (
                <>
                  {event.name}
                  <span className="block bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent">
                    {eventData.formattedDate}
                  </span>
                </>
              )}
            </motion.h2>

            <motion.p
              className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-md mx-auto lg:mx-0"
              variants={itemVariants}
            >
              {event?.description ||
                "Experience the spirit of Navratri come alive in all its glory—vibrant colors, electrifying energy, and the timeless rhythm of Garba."}
            </motion.p>

            {/* Event Quick Info - Fixed dimensions to prevent layout shift */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0"
            >
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 h-[100%] flex flex-col justify-center">
                <div className="text-2xl mb-2">📅</div>
                <p className="text-slate-400 text-sm">Date</p>
                <p className="text-white font-semibold">
                  {eventData?.dateShort || "Sept 7"}
                </p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 h-[100%] flex flex-col justify-center">
                <div className="text-2xl mb-2">🕐</div>
                <p className="text-slate-400 text-sm">Time</p>
                <p className="text-white font-semibold">
                  {eventData?.timeRange || "6:30 PM - 10:30 PM"}
                </p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 border border-slate-700/30 h-[100%] flex flex-col justify-center">
                <div className="text-2xl mb-2">📍</div>
                <p className="text-slate-400 text-sm">Venue</p>
                <p className="text-white font-semibold text-sm">
                  {event?.venue || "Balaji Hall, virar, mumbai"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-navratri-orange/20 to-navratri-yellow/20 backdrop-blur-xl rounded-xl p-4 border border-navratri-orange/30 h-[100%] flex flex-col justify-center">
                <div className="text-2xl mb-2">🎫</div>
                <p className="text-navratri-yellow text-sm">Price</p>
                <p className="text-white font-bold text-lg">
                  ₹{event?.ticketPrice || "299"}/-
                </p>
                <p className="text-navratri-yellow/70 text-sm">
                  Group Discounts Available
                </p>
              </div>
            </motion.div>

            {/* CTA Buttons - Fixed dimensions */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 items-center lg:items-start"
            >
              {/* Primary Buy Tickets Button */}
              <div className="h-14 sm:h-16 flex items-center">
                <PrimaryButton className="w-auto sm:w-auto text-base sm:text-xl px-8 sm:px-8 py-3 sm:py-4">
                  🎟️ Book Your Tickets Now
                </PrimaryButton>
              </div>

              {/* Secondary Sign In Button - Only show if not authenticated */}
              {!user && (
                <div className="h-14 sm:h-16 flex items-center">
                  <GoogleSignInButton
                    className="w-auto sm:w-auto text-base sm:text-xl px-10 sm:px-12 py-3 sm:py-4"
                    showTextOnMobile={true}
                  >
                    📱 Sign In with Google
                  </GoogleSignInButton>
                </div>
              )}
            </motion.div>

            {/* Limited Tickets Warning - Fixed height */}
            <motion.div
              variants={itemVariants}
              className="h-8 flex items-center justify-center lg:justify-start"
            >
              <motion.p
                className="cursor-default text-navratri-yellow font-bold text-base sm:text-lg text-center lg:text-left"
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.01, 1], // Reduced from 1.02
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ⚡{" "}
                {event
                  ? `Only ${event.availableTickets} Tickets Left!`
                  : "Only 300 Tickets left!"}
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Right Side - Hero Image with optimized responsive loading */}
          <motion.div
            variants={itemVariants}
            className="relative order-first lg:order-last"
          >
            <motion.div
              className="relative rounded-3xl overflow-hidden"
              whileHover={{ scale: 1.01 }} // Reduced from 1.02
              transition={{ duration: 0.3 }}
            >
              <LazyImage
                src={event && hero1}
                alt={event?.name || "Garba Dancers"}
                className="w-full drop-shadow-xl drop-shadow-neutral-700"
                aspectRatio="1/1"
                priority={true}
                responsive={true}
                mobileSrc={event && hero1} // Use same image for now, can be optimized later
                placeholder={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-slate-400">Loading image...</div>
                  </div>
                }
                fallback={hero1}
              />

              {/* Floating decorative elements - Reduced animation complexity */}
              <motion.div
                className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-navratri-orange rounded-full opacity-60"
                animate={{
                  y: [0, -8, 0], // Reduced from -10
                  scale: [1, 1.05, 1], // Reduced from 1.1
                }}
                transition={{ duration: 4, repeat: Infinity }} // Increased duration
              />
              <motion.div
                className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-4 h-4 sm:w-6 sm:h-6 bg-navratri-pink rounded-full opacity-60"
                animate={{
                  y: [0, 8, 0], // Reduced from 10
                  scale: [1, 1.1, 1], // Reduced from 1.2
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }} // Increased duration
              />
            </motion.div>

            {/* Decorative Dandiya elements - Simplified animations */}
            <motion.img
              src={Dandiya}
              alt="Dandiya"
              className="absolute -top-4 sm:-top-8 left-4 sm:left-8 w-8 h-8 sm:w-12 sm:h-12 opacity-40"
              animate={{
                rotate: [0, 10, -10, 0], // Reduced from 15
                scale: [1, 1.05, 1], // Reduced from 1.1
              }}
              transition={{ duration: 6, repeat: Infinity }} // Increased duration
              loading="lazy"
            />
            <motion.img
              src={Dandiya}
              alt="Dandiya"
              className="absolute -bottom-3 sm:-bottom-6 right-6 sm:right-12 w-6 h-6 sm:w-10 sm:h-10 opacity-40 rotate-45"
              animate={{
                rotate: [45, 55, 35, 45], // Reduced range
                scale: [1, 1.1, 1], // Reduced from 1.2
              }}
              transition={{ duration: 5, repeat: Infinity, delay: 1 }} // Increased duration
              loading="lazy"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
});

Hero.displayName = "Hero";

export default Hero;