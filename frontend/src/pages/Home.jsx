import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { eventAPI } from '../services/api';
import Navbar from '../components/common/navbar/Navbar';
import Footer from '../components/common/footer/Footer';
import Hero from '../components/home/Hero';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LazySection from '../components/common/LazySection';

// Lazy load non-critical components
const AboutSection = lazy(() => import('../components/home/AboutSection'));
const EventDetails = lazy(() => import('../components/home/EventDetails'));
const CountdownSection = lazy(() => import('../components/home/CountdownSection'));
const FeaturesSection = lazy(() => import('../components/home/FeaturesSection'));
const VenueSection = lazy(() => import('../components/home/VenueSection'));
const FAQSection = lazy(() => import('../components/home/FAQSection'));

const Home = () => {
  const [event, setEvent] = useState(null);
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
        const response = await eventAPI.getCurrentEvent();
        setEvent(response.data.data);
      } catch (err) {
        console.error('Failed to fetch event data:', err);
        // OPTIMIZED: Don't block the UI for event data - show default content
        if (err.name !== 'AbortError') {
          setError('Failed to load event information');
        }
      }
    };

    // OPTIMIZED: Reduce initial loading time
    const timer = setTimeout(fetchEventData, 100);
    return () => clearTimeout(timer);
  }, []);

  // OPTIMIZED: Show content immediately with skeleton loading
  const SectionFallback = () => (
    <div className="py-12 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-6 sm:h-8 bg-slate-700/50 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-slate-700/30 rounded w-1/2 mx-auto mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 sm:h-48 bg-slate-700/30 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden relative">
      {/* OPTIMIZED: Reduced background elements for better performance */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-40 h-40 border border-navratri-orange rounded-full"></div>
          <div className="absolute bottom-32 left-1/3 w-32 h-32 border border-navratri-yellow rounded-full"></div>
        </div>

        {/* OPTIMIZED: Reduced floating orbs for better performance */}
        {navratriColors.slice(0, 2).map((color, index) => (
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
              left: `${20 + index * 40}%`,
              top: `${30 + index * 20}%`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section - Always load immediately */}
        <Hero event={event} />

        {/* OPTIMIZED: Lazy loaded sections with better fallbacks */}
        <LazySection fallback={<SectionFallback />}>
          <Suspense fallback={<SectionFallback />}>
            <AboutSection event={event} />
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionFallback />}>
          <Suspense fallback={<SectionFallback />}>
            <EventDetails event={event} />
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionFallback />}>
          <Suspense fallback={<SectionFallback />}>
            <CountdownSection event={event} />
          </Suspense>
        </LazySection>

        {event?.features && event.features.length > 0 && (
          <LazySection fallback={<SectionFallback />}>
            <Suspense fallback={<SectionFallback />}>
              <FeaturesSection event={event} />
            </Suspense>
          </LazySection>
        )}

        <LazySection fallback={<SectionFallback />}>
          <Suspense fallback={<SectionFallback />}>
            <VenueSection event={event} />
          </Suspense>
        </LazySection>

        <LazySection fallback={<SectionFallback />}>
          <Suspense fallback={<SectionFallback />}>
            <FAQSection />
          </Suspense>
        </LazySection>

        {/* OPTIMIZED: Error Display - non-blocking */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="container mx-auto px-4 py-8"
          >
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-6 text-center max-w-md mx-auto">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-yellow-300 font-bold text-xl mb-2">Event Data Unavailable</h3>
              <p className="text-yellow-200 text-sm">
                Some event details couldn't be loaded, but you can still explore the page.
              </p>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer - Lazy loaded */}
      <LazySection>
        <Suspense fallback={<div className="h-96 bg-slate-900"></div>}>
          <Footer />
        </Suspense>
      </LazySection>
    </div>
  );
};

export default Home;