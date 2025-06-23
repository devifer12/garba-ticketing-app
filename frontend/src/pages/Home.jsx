import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { eventAPI } from '../services/api';
import Navbar from '../components/common/navbar/Navbar';
import Footer from '../components/common/footer/Footer';
import Hero from '../components/home/Hero';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Lazy load non-critical components
const AboutSection = lazy(() => import('../components/home/AboutSection'));
const EventDetails = lazy(() => import('../components/home/EventDetails'));
const CountdownSection = lazy(() => import('../components/home/CountdownSection'));
const FeaturesSection = lazy(() => import('../components/home/FeaturesSection'));
const VenueSection = lazy(() => import('../components/home/VenueSection'));
const FAQSection = lazy(() => import('../components/home/FAQSection'));

const Home = () => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(false); // Changed to false for faster initial render

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const response = await eventAPI.getCurrentEvent();
        setEvent(response.data.data);
      } catch (err) {
        console.error('Failed to fetch event data:', err);
        // Don't block the UI - show default content
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately without delay
    fetchEventData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* Simplified background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-20 left-20 w-40 h-40 border border-navratri-orange/20 rounded-full"></div>
        <div className="absolute bottom-32 right-1/3 w-32 h-32 border border-navratri-yellow/20 rounded-full"></div>
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* Hero Section - Always load immediately */}
        <Hero event={event} />

        {/* Lazy loaded sections with minimal fallbacks */}
        <Suspense fallback={<div className="h-20" />}>
          <AboutSection event={event} />
        </Suspense>

        <Suspense fallback={<div className="h-20" />}>
          <EventDetails event={event} />
        </Suspense>

        <Suspense fallback={<div className="h-20" />}>
          <CountdownSection event={event} />
        </Suspense>

        {event?.features && event.features.length > 0 && (
          <Suspense fallback={<div className="h-20" />}>
            <FeaturesSection event={event} />
          </Suspense>
        )}

        <Suspense fallback={<div className="h-20" />}>
          <VenueSection event={event} />
        </Suspense>

        <Suspense fallback={<div className="h-20" />}>
          <FAQSection />
        </Suspense>
      </main>

      {/* Footer - Lazy loaded */}
      <Suspense fallback={<div className="h-96 bg-slate-900" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Home;