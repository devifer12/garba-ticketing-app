import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import ErrorNotification from "./components/common/ErrorNotification";
import Preloader from "./components/common/Preloader.jsx";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import { AuthProvider } from "./context/AuthContext";
import { eventAPI } from "./services/api";
import { logBundleSize, monitorMemoryUsage } from "./utils/performance";

// Scroll to top component
const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);
  
  return null;
};
function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  // Initialize performance monitoring
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      logBundleSize();
      monitorMemoryUsage();
    }
  }, []);

  // Fetch event data immediately when app starts
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await eventAPI.getCurrentEvent();
        setEventData(response.data.data);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch event data:", err);
        }
        // Don't block the UI - continue without event data
      } finally {
        setEventLoading(false);
      }
    };

    fetchEventData();
  }, []);

  // Preload resources in background
  useEffect(() => {
    const preloadResources = async () => {
      // Preload critical images
      const criticalImages = [
        "/src/assets/hero1.webp",
        "/src/assets/dandiya.webp",
        // Add more critical images here
      ];

      const imagePromises = criticalImages.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve; // Continue even if image fails
            img.src = src;
          })
      );

      // Wait for images to load or timeout after 3 seconds
      await Promise.race([
        Promise.all(imagePromises),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    };

    preloadResources();
  }, []);

  const handlePreloaderComplete = () => {
    setIsLoading(false);
    setTimeout(() => {
      setShowContent(true);
    }, 100);
  };

  return (
    <ErrorBoundary>
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      {showContent && (
        <AuthProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route
                path="/"
                element={
                  <Home eventData={eventData} eventLoading={eventLoading} />
                }
              />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/:role" element={<Dashboard />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route
                path="/cancellation-policy"
                element={<CancellationPolicy />}
              />
              <Route path="/refund-policy" element={<RefundPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
            </Routes>
            
            {/* Global Error Notification */}
            <ErrorNotification />

            {/* Toast Notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              theme="dark"
              toastStyle={{
                backgroundColor: "#1e293b",
                color: "#f1f5f9",
                border: "1px solid #334155",
              }}
            />
          </BrowserRouter>
        </AuthProvider>
      )}
    </ErrorBoundary>
  );
}

export default App;