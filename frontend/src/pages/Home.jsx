import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { eventAPI } from '../services/api';
import Navbar from '../components/common/navbar/Navbar';
import Hero from '../components/home/Hero';
import AboutSection from '../components/home/AboutSection';
import EventDetails from '../components/home/EventDetails';
import TicketSection from '../components/home/TicketSection';
import FeaturesSection from '../components/home/FeaturesSection';
import VenueSection from '../components/home/VenueSection';
import FAQSection from '../components/home/FAQSection';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Home = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await eventAPI.getCurrentEvent();
        setEvent(response.data.data);
      } catch (err) {
        console.error('Failed to fetch event data:', err);
        setError('Failed to load event information');
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading Event Details..." />
      </div>
    );
  }

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
        <Hero event={event} />

        {/* About Section */}
        <AboutSection event={event} />

        {/* Event Details Section */}
        <EventDetails event={event} />

        {/* Ticket Section */}
        <TicketSection event={event} />

        {/* Features Section */}
        {event?.features && event.features.length > 0 && (
          <FeaturesSection event={event} />
        )}

        {/* Venue Section */}
        <VenueSection event={event} />

        {/* FAQ Section */}
        <FAQSection />

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-red-300 font-bold text-xl mb-2">Error Loading Event</h3>
              <p className="text-red-200">{error}</p>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Home;