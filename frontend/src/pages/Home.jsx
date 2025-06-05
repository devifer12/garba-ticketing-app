import React from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/common/navbar/Navbar';
import Hero from '../components/home/Hero';
import AboutSection from '../components/home/AboutSection';

const Home = () => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Subtle geometric patterns */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-40 h-40 border border-navratri-orange rounded-full"></div>
          <div className="absolute top-40 right-32 w-24 h-24 border border-navratri-pink rounded-full"></div>
          <div className="absolute bottom-32 left-1/3 w-32 h-32 border border-navratri-yellow rounded-full"></div>
        </div>

        {/* Subtle floating orbs */}
        {navratriColors.slice(0, 4).map((color, index) => (
          <motion.div
            key={index}
            className={`absolute w-20 h-20 bg-gradient-to-r from-${color} to-transparent rounded-full opacity-5 blur-xl`}
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 12 + index * 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            style={{
              left: `${20 + index * 20}%`,
              top: `${30 + index * 15}%`,
            }}
          />
        ))}

        {/* Premium gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10"></div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <Hero />

        {/* About Section */}
        <AboutSection />
      </main>
    </div>
  );
};

export default Home;