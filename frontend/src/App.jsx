import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import ErrorNotification from "./components/common/ErrorNotification";
import Preloader from "./components/common/Preloader.jsx";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  // Preload resources in background
  useEffect(() => {
    const preloadResources = async () => {
      // Preload critical images
      const imagePromises = [
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve; // Continue even if image fails
          img.src = "/src/assets/hero1.webp";
        }),
        new Promise((resolve) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = resolve;
          img.src = "/src/assets/dandiya.webp";
        }),
      ];

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
    <>
      {isLoading && <Preloader onComplete={handlePreloaderComplete} />}

      {showContent && (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/:role" element={<Dashboard />} />
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
      )}
    </>
  );
}

export default App;