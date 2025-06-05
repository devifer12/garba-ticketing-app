// frontend/src/components/home/Hero.jsx
import React from "react";
import { motion } from "framer-motion";
import { PrimaryButton, GoogleSignInButton } from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import hero1 from "../../assets/hero1.png";
import Dandiya from "../../assets/dandiya.png";

const Hero = () => {
  const { user, signInWithGoogle, signOut } = useAuth();

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

  // Handle ticket booking
  const handleBookTicket = async () => {
    if (!user) {
      // If user is not signed in, prompt them to sign in first
      try {
        await signInWithGoogle();
        // After successful sign-in, proceed with booking logic
        console.log("User signed in, proceeding with booking...");
        // Add your booking logic here
      } catch (error) {
        console.error("Sign-in failed:", error);
      }
    } else {
      // User is already signed in, proceed with booking
      console.log("Proceeding with ticket booking for:", user.displayName);
      // Add your booking logic here
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      console.log("Successfully signed in with Google");
    } catch (error) {
      console.error("Google Sign-In failed:", error);
    }
  };

  return (
    <section className="min-h-screen pt-48 pb-16 relative">
      {/* Animated colorful dots */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-12">
        <motion.div
          variants={itemVariants}
          className="flex justify-center space-x-2 mb-8">
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

      {/* Hero Content with Image */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Side - Text Content */}
          <motion.div variants={itemVariants} className="space-y-8">
            <motion.h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight"
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
              className="text-xl text-slate-300 leading-relaxed max-w-md"
              variants={itemVariants}>
              Join us for an unforgettable evening of traditional Garba and
              Raas, celebrating the vibrant colors and culture of Navratri.
            </motion.p>

            {/* Feature Highlights */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-2 h-2 bg-navratri-orange rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-slate-300">
                  Traditional Gujarati Music & Dance
                </span>
              </div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-2 h-2 bg-navratri-pink rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                />
                <span className="text-slate-300">
                  Professional Dance Instructors
                </span>
              </div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-2 h-2 bg-navratri-yellow rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                />
                <span className="text-slate-300">
                  Authentic Gujarati Snacks & Refreshments
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 pt-4">
              <PrimaryButton
                onClick={() => {
                  if (user) {
                    handleBookTicket();
                  } else {
                    handleGoogleSignIn();
                  }
                }}>
                🎟️ Book Your Tickets Now
              </PrimaryButton>

              <GoogleSignInButton>📱 Sign In with Google</GoogleSignInButton>
            </motion.div>

            {/* Limited Tickets Warning */}
            <motion.div variants={itemVariants}>
              <motion.p
                className="cursor-default text-navratri-yellow font-bold text-lg"
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
          <motion.div variants={itemVariants} className="relative">
            <motion.div
              className="relative rounded-3xl overflow-hidden "
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}>
              <img
                src={hero1}
                alt="Garba Dancers"
                className="w-full h-auto object-cover drop-shadow-xl drop-shadow-neutral-700"
              />

              {/* Floating decorative elements around image */}
              <motion.div
                className="absolute -top-4 -right-4 w-8 h-8 bg-navratri-orange rounded-full opacity-60"
                animate={{
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-4 -left-4 w-6 h-6 bg-navratri-pink rounded-full opacity-60"
                animate={{
                  y: [0, 10, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              />
              <motion.div
                className="absolute top-1/2 -left-6 w-4 h-4 bg-navratri-yellow rounded-full opacity-50"
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
              className="absolute -top-8 left-8 w-12 h-12 opacity-40"
              animate={{
                rotate: [0, 15, -15, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.img
              src={Dandiya}
              alt="Dandiya"
              className="absolute -bottom-6 right-12 w-10 h-10 opacity-40 rotate-45"
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
