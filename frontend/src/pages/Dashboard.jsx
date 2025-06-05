import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/navbar/Navbar';

const Dashboard = () => {
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Subtle geometric patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-32 right-20 w-32 h-32 border border-navratri-orange rounded-full"></div>
          <div className="absolute bottom-40 left-16 w-24 h-24 border border-navratri-pink rounded-full"></div>
        </div>

        {/* Floating orbs */}
        <motion.div
          className="absolute w-16 h-16 bg-gradient-to-r from-navratri-yellow to-transparent rounded-full opacity-10 blur-xl"
          animate={{
            x: [0, 40, 0],
            y: [0, -20, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ left: '15%', top: '25%' }}
        />

        <motion.div
          className="absolute w-20 h-20 bg-gradient-to-r from-navratri-green to-transparent rounded-full opacity-8 blur-xl"
          animate={{
            x: [0, -30, 0],
            y: [0, 25, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{ right: '20%', top: '40%' }}
        />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Dashboard Content */}
      <main className="relative z-10 pt-48 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4"
        >
          {/* Welcome Section */}
          <motion.div
            variants={itemVariants}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-navratri-orange/5 via-transparent to-navratri-pink/5 rounded-3xl blur-3xl"></div>
            
            <div className="relative bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
              {/* Header */}
              <motion.div
                className="mb-8"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
              >
                <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-navratri-orange via-navratri-yellow to-navratri-pink bg-clip-text text-transparent mb-4">
                  Welcome to Your Dashboard
                </h1>
                
                {/* Decorative line */}
                <motion.div 
                  className="w-24 h-1 bg-gradient-to-r from-navratri-orange to-navratri-yellow rounded-full mx-auto"
                  animate={{
                    scaleX: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </motion.div>

              {/* User Greeting */}
              {user && (
                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-4 mb-4">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName}
                        className="w-16 h-16 rounded-full object-cover border-2 border-navratri-orange/30"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-navratri-orange to-navratri-yellow flex items-center justify-center text-slate-900 font-bold text-xl">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-white">
                        Hello, {user.displayName?.split(' ')[0] || 'Friend'}! 👋
                      </h2>
                      <p className="text-slate-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Main Content */}
              <motion.div
                className="space-y-6"
                variants={itemVariants}
              >
                <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
                  Get ready for the most spectacular <span className="text-navratri-orange font-semibold">Garba Rass 2025</span> celebration! 
                  Your dashboard will be your central hub for managing tickets, accessing event updates, and connecting with fellow dancers.
                </p>

                {/* Status Card */}
                <motion.div
                  className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30"
                  whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                >
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <motion.div
                      className="text-3xl"
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      🎭
                    </motion.div>
                    <h3 className="text-xl font-bold text-white">Event Status</h3>
                  </div>
                  <p className="text-slate-300 text-center">
                    More features coming soon! Stay tuned for ticket management, event schedules, and exclusive updates.
                  </p>
                </motion.div>

                {/* Decorative elements */}
                <div className="flex justify-center mt-8 space-x-4">
                  {['🎵', '💃', '🎉', '✨'].map((emoji, index) => (
                    <motion.div
                      key={index}
                      className="text-2xl"
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                    >
                      {emoji}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Call to action */}
              <motion.div
                className="mt-8"
                variants={itemVariants}
              >
                <motion.p 
                  className="text-navratri-yellow font-bold text-lg"
                  animate={{
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                >
                  🎊 The celebration begins August 15, 2025! 🎊
                </motion.p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;