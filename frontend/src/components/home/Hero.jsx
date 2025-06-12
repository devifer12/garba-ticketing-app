// frontend/src/components/home/Hero.jsx
import React from "react";
import { motion } from "framer-motion";
import { PrimaryButton, GoogleSignInButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import hero1 from "../../assets/hero1.png";
import Dandiya from "../../assets/dandiya.png";

const Hero = () => {
  const { user } = useAuth();

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

  return (
    <section className="min-h-screen pt-32 sm:pt-40 md:pt-48 pb-8 sm:pb-16 relative">
      {/* Animated colorful dots */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-8 sm:mb-12">
        <motion.div
          variants={itemVariants}
          className="flex justify-center space-x-1 sm:space-x-2 mb-6 sm:mb-8 px-4">
          {navratriColors.map((color, index) => (
            <motion.div
              key={color}
              className={`w-2 h-2 sm:w-3 sm:h-3 bg-${color} rounded-full`}
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

      {/* Hero Content with Image */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side - Text Content */}
          <motion.div variants={itemVariants} className="space-y-6 sm:space-y-8 text-center lg:text-left">
            <motion.h2
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                repeatType: "loop",
              }}>
              Dance to the
              <span className="block bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent">
                Rhythm of Joy
              </span>
            </motion.h2>

            <motion.p
              className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-md mx-auto lg:mx-0"
              variants={itemVariants}>
              Join us for an unforgettable evening of traditional Garba and
              Raas, celebrating the vibrant colors and culture of Navratri.
            </motion.p>

            {/* Feature Highlights */}
            <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 justify-center lg:justify-start">
                <motion.div
                  className="w-2 h-2 bg-navratri-orange rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-slate-300 text-sm sm:text-base">
                  Traditional Gujarati Music & Dance
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-center lg:justify-start">
                <motion.div
                  className="w-2 h-2 bg-navratri-pink rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <span className="text-slate-300 text-sm sm:text-base">
                  Professional Dance Instructors
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 justify-center lg:justify-start">
                <motion.div
                  className="w-2 h-2 bg-navratri-yellow rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
                <span className="text-slate-300 text-sm sm:text-base">
                  Authentic Gujarati Snacks & Refreshments
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 items-center lg:items-start">
              
              {/* Primary Buy Tickets Button */}
              <PrimaryButton className="w-full sm:w-auto text-base sm:text-xl px-6 sm:px-8 py-3 sm:py-4">
                🎟️ Book Your Tickets Now
              </PrimaryButton>

              {/* Secondary Sign In Button - Only show if not authenticated */}
              {!user && (
                <GoogleSignInButton className="w-full sm:w-auto text-base sm:text-xl px-6 sm:px-8 py-3 sm:py-4">
                  📱 Sign In with Google
                </GoogleSignInButton>
              )}
            </motion.div>

            {/* Limited Tickets Warning */}
            <motion.div variants={itemVariants}>
              <motion.p
                className="cursor-default text-navratri-yellow font-bold text-base sm:text-lg text-center lg:text-left"
                animate={{
                  opacity: [0.7, 1, 0.7],
                  scale: [1, 1.02, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}>
                ⚡ Only 300 Tickets Available!
              </motion.p>
            </motion.div>
          </motion.div>

          {/* Right Side - Hero Image */}
          <motion.div variants={itemVariants} className="relative order-first lg:order-last">
            <motion.div
              className="relative rounded-3xl overflow-hidden"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}>
              <img
                src={hero1}
                alt="Garba Dancers"
                className="w-full h-auto object-cover drop-shadow-xl drop-shadow-neutral-700 max-h-96 sm:max-h-none"
              />

              {/* Floating decorative elements around image */}
              <motion.div
                className="absolute -top-2 -right-2 sm:-top-4 sm:-right-4 w-6 h-6 sm:w-8 sm:h-8 bg-navratri-orange rounded-full opacity-60"
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-2 -left-2 sm:-bottom-4 sm:-left-4 w-4 h-4 sm:w-6 sm:h-6 bg-navratri-pink rounded-full opacity-60"
                animate={{
                  y: [0, 10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              />
              <motion.div
                className="absolute top-1/2 -left-3 sm:-left-6 w-3 h-3 sm:w-4 sm:h-4 bg-navratri-yellow rounded-full opacity-50"
                animate={{
                  x: [0, -5, 0],
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>

            {/* Decorative Dandiya elements */}
            <motion.img
              src={Dandiya}
              alt="Dandiya"
              className="absolute -top-4 sm:-top-8 left-4 sm:left-8 w-8 h-8 sm:w-12 sm:h-12 opacity-40"
              animate={{
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.img
              src={Dandiya}
              alt="Dandiya"
              className="absolute -bottom-3 sm:-bottom-6 right-6 sm:right-12 w-6 h-6 sm:w-10 sm:h-10 opacity-40 rotate-45"
              animate={{
                rotate: [45, 60, 30, 45],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;