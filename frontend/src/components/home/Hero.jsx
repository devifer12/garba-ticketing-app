import React, { memo, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { debounce } from "../../utils/performance";
import { PrimaryButton, GoogleSignInButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { formatDate, formatTime } from "../../utils/helpers";
import LazyImage from "../ui/LazyImage";
import hero1 from "../../assets/hero1.webp";
import Dandiya from "../../assets/dandiya.webp";
import { useNavigate } from "react-router-dom";

const Hero = memo(({ event }) => {
  const { user, backendUser } = useAuth();
  const navigate = useNavigate();

  // Get user role from backendUser or default to 'guest' if authenticated but no backend user yet
  const userRole = backendUser?.role || (user ? 'guest' : null);

  // Debounced event data processing to prevent excessive re-calculations
  const debouncedEventProcessor = useCallback(
    debounce((eventData) => {
      if (eventData && process.env.NODE_ENV === "development") {
        console.log("Processing event data:", eventData.name);
      }
    }, 300),
    [],
  );

  // Process event data when it changes
  React.useEffect(() => {
    if (event) {
      debouncedEventProcessor(event);
    }
  }, [event, debouncedEventProcessor]);

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

  // Handle "View My Tickets" button click
  const handleViewTickets = useCallback(() => {
    navigate("/dashboard", { replace: false });
    // Scroll to tickets section after navigation
    setTimeout(() => {
      const ticketsSection = document.getElementById("tickets-section");
      if (ticketsSection) {
        ticketsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 400);
  }, [navigate]);

  // Handle "My Dashboard" button click
  const handleMyDashboard = useCallback(() => {
    navigate("/dashboard", { replace: false });
  }, [navigate]);

  // Determine which buttons to show based on user role
  const renderActionButtons = () => {
    // Pre-login state - show both buttons
    if (!user) {
      return (
        <>
          <div className="h-14 sm:h-16 flex items-center">
            <PrimaryButton className="w-auto sm:w-auto text-base sm:text-xl px-8 sm:px-8 py-3 sm:py-4">
              🎟️ Book Your Tickets Now
            </PrimaryButton>
          </div>
          <div className="sm:h-16 flex items-center">
            <GoogleSignInButton
              className="w-auto sm:w-auto text-base sm:text-xl px-10 sm:px-12 py-3 sm:py-4"
              showTextOnMobile={true}
            >
              📱 Sign In with Google
            </GoogleSignInButton>
          </div>
        </>
      );
    }

    // Post-login states based on role
    switch (userRole) {
      case 'guest':
        return (
          <>
            <div className="h-14 sm:h-16 flex items-center">
              <PrimaryButton className="w-auto sm:w-auto text-base sm:text-xl px-8 sm:px-8 py-3 sm:py-4">
                🎟️ Book Your Tickets Now
              </PrimaryButton>
            </div>
            <div className="h-14 sm:h-16 flex items-center">
              <motion.button
                onClick={handleViewTickets}
                className="bg-slate-800/50 backdrop-blur-xl text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-base sm:text-xl font-semibold border border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-700/50 transition-all duration-300 min-w-[200px] sm:min-w-[250px]"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                🎫 View My Tickets
              </motion.button>
            </div>
          </>
        );

      case 'admin':
      case 'manager':
      case 'qrchecker':
        return (
          <div className="h-14 sm:h-16 flex items-center">
            <motion.button
              onClick={handleMyDashboard}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-base sm:text-xl font-bold shadow-xl border border-blue-500/20 transition-all duration-300 min-w-[200px] sm:min-w-[250px]"
              whileHover={{
                scale: 1.02,
                boxShadow: "0 20px 40px rgba(59,130,246,0.3)",
                y: -2,
              }}
              whileTap={{ scale: 0.98 }}
              animate={{
                boxShadow: [
                  "0 10px 30px rgba(59,130,246,0.2)",
                  "0 15px 35px rgba(147,51,234,0.25)",
                  "0 10px 30px rgba(59,130,246,0.2)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-sm sm:text-base md:text-lg">
                🏠 My Dashboard
              </span>
            </motion.button>
          </div>
        );

      default:
        // Fallback for authenticated users without role yet
        return (
          <div className="h-14 sm:h-16 flex items-center">
            <motion.button
              onClick={handleMyDashboard}
              className="bg-slate-600/50 backdrop-blur-xl text-white px-8 sm:px-12 py-3 sm:py-4 rounded-full text-base sm:text-xl font-semibold border border-slate-500/50 hover:border-slate-400/50 hover:bg-slate-500/50 transition-all duration-300 min-w-[200px] sm:min-w-[250px]"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              🔄 Loading Dashboard...
            </motion.button>
          </div>
        );
    }
  };

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

            {/* CTA Buttons - Role-based rendering */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 items-center lg:items-start"
            >
              {renderActionButtons()}
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