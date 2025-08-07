import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QrScanner from "qr-scanner";

const QRScanner = ({
  onScan,
  onError,
  isActive = true,
  isProcessing = false,
  className = "",
  overlayColor = "rgba(0, 0, 0, 0.5)",
  scanBoxColor = "#00ff00",
}) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scannerReady, setScannerReady] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      console.log("🧹 Cleaning up scanner...");
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      } catch (cleanupError) {
        console.warn("⚠️ Error during scanner cleanup:", cleanupError);
      }
      scannerRef.current = null;
    }
    setScannerReady(false);
    setIsScanning(false);
    setVideoReady(false);
    setCameraStream(null);
  }, []);

  // Handle QR scan result
  const handleScanResult = useCallback(
    (result) => {
      const now = Date.now();

      // Throttle scans to prevent rapid-fire scanning (increased to 3 seconds)
      if (now - lastScanTime < 3000) {
        console.log("🔄 Scan throttled - too soon after last scan");
        return;
      }

      setLastScanTime(now);
      console.log("✅ QR Code detected:", result.data);

      // Pause scanner immediately to prevent multiple scans
      setIsPaused(true);

      // Don't show any result overlay immediately - let the parent handle it
      if (onScan) {
        onScan(result.data);
      }
    },
    [lastScanTime, onScan],
  );

  // Check camera availability and initialize
  useEffect(() => {
    const checkCameraAndInit = async () => {
      if (!mountedRef.current) return;

      try {
        setIsInitializing(true);
        setError(null);

        console.log("🔍 Checking camera availability...");

        // Add timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(
            () => reject(new Error("Camera initialization timeout")),
            10000,
          );
        });

        // Check if camera is available with timeout
        const cameraAvailable = await Promise.race([
          QrScanner.hasCamera(),
          timeoutPromise,
        ]);

        console.log("📷 Camera available:", cameraAvailable);

        if (!mountedRef.current) return;
        setHasCamera(cameraAvailable);

        if (!cameraAvailable) {
          setError("No camera found on this device");
          return;
        }

        // Get available cameras with timeout
        console.log("📋 Getting camera list...");
        const cameraList = await Promise.race([
          QrScanner.listCameras(true),
          timeoutPromise,
        ]);

        console.log("📋 Available cameras:", cameraList);

        if (!mountedRef.current) return;
        setCameras(cameraList);

        if (cameraList.length === 0) {
          setError("No cameras detected");
          setHasCamera(false);
          return;
        }

        // Prefer back camera for scanning
        const backCamera = cameraList.find(
          (camera) =>
            camera.label.toLowerCase().includes("back") ||
            camera.label.toLowerCase().includes("rear") ||
            camera.label.toLowerCase().includes("environment"),
        );
        const preferredCamera = backCamera || cameraList[0];
        console.log("🎯 Selected camera:", preferredCamera);
        setSelectedCamera(preferredCamera);
      } catch (err) {
        console.error("❌ Camera check failed:", err);
        if (mountedRef.current) {
          const errorMessage = err.message.includes("timeout")
            ? "Camera initialization timed out. Please check camera permissions and try again."
            : `Failed to access camera: ${err.message}`;
          setError(errorMessage);
          setHasCamera(false);
          if (onError) onError(err);
        }
      } finally {
        if (mountedRef.current) {
          setIsInitializing(false);
        }
      }
    };

    // Add a small delay before starting initialization
    const initTimer = setTimeout(checkCameraAndInit, 100);

    return () => clearTimeout(initTimer);
  }, [onError]);

  // Initialize scanner when camera is selected and video element is ready
  useEffect(() => {
    if (
      !hasCamera ||
      !selectedCamera ||
      !videoRef.current ||
      !mountedRef.current
      // scannerRef.current 
    )
      return;

    const initScanner = async () => {
      try {
        console.log("🔧 Initializing QR Scanner...");
        setVideoReady(false);

        // Clean up existing scanner first
        cleanupScanner();

        // Wait for video element to be ready
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (!mountedRef.current || !videoRef.current) return;

        // Create scanner with proper error handling
        const scanner = new QrScanner(videoRef.current, handleScanResult, {
          onDecodeError: (error) => {
            console.debug("🔍 QR decode error (normal):", error.message);
          },
          preferredCamera: selectedCamera.id,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 1,
          returnDetailedScanResult: true,
        });

        scannerRef.current = scanner;
        console.log("✅ QR Scanner initialized successfully");

        if (mountedRef.current) {
          setScannerReady(true);
          setVideoReady(true);
          setError(null);
        }

        // Set overlay styling if scanner has overlay
        if (scannerRef.current && scannerRef.current.$overlay) {
          scannerRef.current.$overlay.style.background = overlayColor;
          if (scannerRef.current.$overlay.style.borderColor !== undefined) {
            scannerRef.current.$overlay.style.borderColor = scanBoxColor;
          }
        }
      } catch (err) {
        console.error("❌ Scanner initialization failed:", err);
        if (mountedRef.current) {
          const errorMessage = `Failed to initialize scanner: ${err.message}`;
          setError(errorMessage);
          setScannerReady(false);
          setVideoReady(false);
          if (onError) onError(err);
        }
      }
    };

    // Initialize immediately without delay
    initScanner();
  }, [
    hasCamera,
    selectedCamera,
    handleScanResult,
    overlayColor,
    scanBoxColor,
    cleanupScanner,
    onError,
  ]);

  // Handle scanner start/stop based on isActive prop
  useEffect(() => {
    if (
      !scannerRef.current ||
      !scannerReady ||
      !videoReady ||
      hasCamera === false ||
      !mountedRef.current
    )
      return;

    const handleScannerState = async () => {
      try {
        if (isActive && !isScanning && !isPaused) {
          console.log("▶️ Starting scanner...");
          await scannerRef.current.start();
          if (mountedRef.current) {
            setIsScanning(true);
            setCameraStream(true);
            setError(null);
            console.log("✅ Scanner started successfully");
          }
        } else if (!isActive && isScanning) {
          console.log("⏹️ Stopping scanner...");
          scannerRef.current.stop();
          if (mountedRef.current) {
            setIsScanning(false);
            setCameraStream(false);
            console.log("✅ Scanner stopped successfully");
          }
        }
      } catch (err) {
        console.error("❌ Scanner state change failed:", err);
        if (mountedRef.current) {
          setError("Failed to control camera: " + err.message);
          setIsScanning(false);
          setCameraStream(false);
          if (onError) onError(err);
        }
      }
    };

    // Only handle state change if not paused and prevent redundant calls
    if (!isPaused && scannerRef.current) {
      const currentlyScanning = scannerRef.current._active;
      if (
        (isActive && !currentlyScanning) ||
        (!isActive && currentlyScanning)
      ) {
        handleScannerState();
      }
    }
  }, [
    isActive,
    isScanning,
    isPaused,
    hasCamera,
    scannerReady,
    videoReady,
    onError,
  ]);

  // Handle pause/resume when isPaused changes
  useEffect(() => {
    if (
      !scannerRef.current ||
      !scannerReady ||
      !videoReady ||
      !mountedRef.current
    )
      return;

    const handlePauseResume = async () => {
      try {
        const currentlyScanning = scannerRef.current._active;

        if (isPaused && currentlyScanning) {
          console.log("⏸️ Pausing scanner...");
          scannerRef.current.stop();
          setCameraStream(false);
          // Don't change isScanning state, just pause temporarily
        } else if (!isPaused && isActive && !currentlyScanning) {
          console.log("▶️ Resuming scanner...");
          await scannerRef.current.start();
          if (mountedRef.current) {
            setIsScanning(true);
            setCameraStream(true);
          }
        }
      } catch (err) {
        console.error("❌ Scanner pause/resume failed:", err);
        if (mountedRef.current) {
          setError("Failed to pause/resume scanner: " + err.message);
          setCameraStream(false);
        }
      }
    };

    handlePauseResume();
  }, [isPaused, isActive, isScanning, scannerReady, videoReady]);

  useEffect(() => {
    if (!isProcessing && isPaused) {
      console.log("✅ Parent processing finished, resuming scanner...");
      setIsPaused(false);
      setShowResult(false);
      setScanResult(null);
    }
  }, [isProcessing, isPaused]);
  
  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current || !scannerReady) return;

    try {
      console.log("🔄 Switching camera...");
      const currentIndex = cameras.findIndex(
        (cam) => cam.id === selectedCamera?.id,
      );
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];

      console.log("📷 Switching to camera:", nextCamera);

      // Stop current scanner
      if (isScanning) {
        scannerRef.current.stop();
        setIsScanning(false);
      }

      // Wait a bit before switching
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Set new camera
      await scannerRef.current.setCamera(nextCamera.id);
      setSelectedCamera(nextCamera);

      // Restart if it was active
      if (isActive && !isPaused) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        await scannerRef.current.start();
        setIsScanning(true);
        setCameraStream(true);
      }

      console.log("✅ Camera switched successfully");
    } catch (err) {
      console.error("❌ Failed to switch camera:", err);
      setError("Failed to switch camera: " + err.message);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("🔄 Component unmounting...");
      mountedRef.current = true;
      cleanupScanner();
    };
  }, [cleanupScanner]);

  // Show loading state during initialization
  if (isInitializing || hasCamera === null) {
    return (
      <div
        className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}
      >
        <div className="h-64 sm:h-80 md:aspect-square flex items-center justify-center p-4 sm:p-8">
          <div className="text-center">
            <motion.div
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h3 className="text-white font-bold text-xl mb-2">
              Setting up camera...
            </h3>
            <p className="text-slate-400">
              Please wait while we prepare the scanner
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show no camera message
  if (hasCamera === false) {
    return (
      <div
        className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}
      >
        <div className="h-64 sm:h-80 md:aspect-square flex items-center justify-center p-4 sm:p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-white font-bold text-xl mb-2">
              No Camera Available
            </h3>
            <p className="text-slate-400 mb-4">
              Camera access is required to scan QR codes. Please ensure:
            </p>
            <ul className="text-slate-400 text-sm text-left space-y-1">
              <li>• Your device has a camera</li>
              <li>• Camera permissions are granted</li>
              <li>• Camera is not being used by another app</li>
              <li>• You're using HTTPS (required for camera access)</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}
    >
      {/* Video Element - Only show when ready */}
      <video
        ref={videoRef}
        className={`w-full h-64 sm:h-80 md:aspect-square object-cover transition-opacity duration-300 ${
          videoReady && cameraStream ? "opacity-100" : "opacity-0"
        }`}
        playsInline
        muted
        autoPlay
      />

      {/* Video Loading Overlay */}
      {(!videoReady || !cameraStream) && isActive && scannerReady && (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        </div>
      )}

      {/* Scanner Controls Overlay - Mobile Optimized */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
        {/* Status Indicator */}
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 sm:px-3 sm:py-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${
                isPaused
                  ? "bg-yellow-400"
                  : isScanning
                    ? "bg-green-400"
                    : "bg-red-400"
              }`}
              animate={isScanning && !isPaused ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-white text-xs sm:text-sm font-medium">
              {isPaused
                ? "Processing..."
                : isScanning
                  ? "Scanning..."
                  : scannerReady
                    ? "Ready"
                    : "Initializing..."}
            </span>
          </div>
        </div>

        {/* Camera Switch Button */}
        {cameras.length > 1 && scannerReady && (
          <motion.button
            onClick={switchCamera}
            className="bg-black/70 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 text-white hover:bg-black/80 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Scan Result Display */}
      <AnimatePresence>
        {showResult && scanResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute inset-4 bg-blue-900/95 backdrop-blur-xl rounded-xl flex items-center justify-center z-30 border border-blue-500/50"
          >
            <div className="text-center p-6">
              <motion.div
                className="text-6xl mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                📱
              </motion.div>
              <h3 className="text-white font-bold text-xl mb-2">
                QR Code Detected!
              </h3>
              <p className="text-blue-200 text-sm mb-3">
                Processing ticket verification...
              </p>
              <motion.div
                className="w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <p className="text-blue-300 text-xs mt-3 font-mono">
                QR: {scanResult.qrCode.substring(0, 20)}...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanning Instructions - Mobile Optimized */}
      <div className="absolute bottom-2 left-2 right-2 z-10">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2 sm:p-4 text-center">
          <p className="text-white text-xs sm:text-sm">
            {showResult
              ? "Verifying ticket - please wait..."
              : isPaused
                ? "Processing complete - ready for next scan"
                : isScanning
                  ? "Point camera at QR code to scan ticket"
                  : scannerReady
                    ? "Camera ready - click Start Scanner to begin"
                    : "Preparing camera..."}
          </p>
          {selectedCamera && !showResult && (
            <p className="text-slate-300 text-xs mt-1 hidden sm:block">
              Using: {selectedCamera.label}
            </p>
          )}
        </div>
      </div>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-4 bg-red-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center z-20"
          >
            <div className="text-center p-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h4 className="text-white font-bold mb-2">Scanner Error</h4>
              <p className="text-red-200 text-sm mb-3">{error}</p>
              <div className="flex gap-2 justify-center">
                <motion.button
                  onClick={() => setError(null)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Dismiss
                </motion.button>
                <motion.button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reload
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scanner Initialization Overlay */}
      {isActive && !scannerReady && !error && hasCamera && (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center z-10">
          <div className="text-center">
            <motion.div
              className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-3"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-white text-sm">Initializing scanner...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;