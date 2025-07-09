import React, { useState, useEffect, Suspense, lazy } from "react";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../services/api";
import Navbar from "../components/common/navbar/Navbar";
import Footer from "../components/common/footer/Footer";
import Hero from "../components/home/Hero";

// Lazy load non-critical components
const AboutSection = lazy(() => import("../components/home/AboutSection"));
const EventDetails = lazy(() => import("../components/home/EventDetails"));
const CountdownSection = lazy(
  () => import("../components/home/CountdownSection"),
);
const FeaturesSection = lazy(
  () => import("../components/home/FeaturesSection"),
);
const VenueSection = lazy(() => import("../components/home/VenueSection"));
const FAQSection = lazy(() => import("../components/home/FAQSection"));

// Skeleton components to prevent layout shift
const SectionSkeleton = ({ height = "400px" }) => (
  <div className="py-12 sm:py-20" style={{ minHeight: height }}>
    <div className="container mx-auto px-4">
      <div className="max-w-6xl mx-auto">
        {/* Title skeleton */}
        <div className="text-center mb-8 sm:mb-12">
          <div
            className="h-12 sm:h-16 bg-slate-700/30 rounded-lg mx-auto mb-4 animate-pulse"
            style={{ width: "60%" }}
          ></div>
          <div className="w-24 h-1 bg-slate-600/30 rounded-full mx-auto mb-6"></div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/30 animate-pulse"
            >
              <div className="h-6 bg-slate-700/30 rounded mb-4"></div>
              <div className="h-4 bg-slate-700/30 rounded mb-2"></div>
              <div className="h-4 bg-slate-700/30 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Home = ({ eventData, eventLoading }) => {
  const { isAuthenticated, backendUser, initializing } = useAuth();
  const [dashboardDataPreloaded, setDashboardDataPreloaded] = useState(false);

  // Preload dashboard data if user is authenticated and event data is loaded
  useEffect(() => {
    const preloadDashboardData = async () => {
      if (
        !isAuthenticated ||
        !backendUser ||
        eventLoading ||
        initializing ||
        dashboardDataPreloaded
      ) {
        return;
      }

      try {
        // Preload dashboard data based on user role
        const role = backendUser.role || "guest";

        if (role === "admin") {
          // Preload admin dashboard data
          Promise.all([
            adminAPI.getDashboardAnalytics().catch(() => null),
            adminAPI.getTicketStats().catch(() => null),
            adminAPI.getUserCount().catch(() => null),
          ]);
        } else if (role === "guest") {
          // Preload user's tickets
          import("../services/api").then(({ ticketAPI }) => {
            ticketAPI.getMyTickets().catch(() => null);
          });
        }

        setDashboardDataPreloaded(true);

        if (process.env.NODE_ENV === "development") {
          console.log(`Dashboard data preloaded for role: ${role}`);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to preload dashboard data:", err);
        }
      }
    };

    preloadDashboardData();
  }, [
    isAuthenticated,
    backendUser,
    eventLoading,
    initializing,
    dashboardDataPreloaded,
  ]);

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
        <Hero event={eventData} />

        {/* Lazy loaded sections with skeleton fallbacks */}
        <Suspense fallback={<SectionSkeleton height="500px" />}>
          <AboutSection event={eventData} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="600px" />}>
          <EventDetails event={eventData} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="400px" />}>
          <CountdownSection event={eventData} />
        </Suspense>

        {eventData?.features && eventData.features.length > 0 && (
          <Suspense fallback={<SectionSkeleton height="500px" />}>
            <FeaturesSection event={eventData} />
          </Suspense>
        )}

        <Suspense fallback={<SectionSkeleton height="600px" />}>
          <VenueSection event={eventData} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton height="700px" />}>
          <FAQSection />
        </Suspense>
      </main>

      {/* Footer - Lazy loaded with skeleton */}
      <Suspense fallback={<div className="h-96 bg-slate-900/80" />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Home;