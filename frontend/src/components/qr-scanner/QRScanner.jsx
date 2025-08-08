import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QrScanner from "qr-scanner";

const QRScanner = ({ onScan, onError, isActive = false, isProcessing = false, className = "" }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [lastScanTime, setLastScanTime] = useState(0);
  const internalProcessingRef = useRef(false);
  const isInitializingRef = useRef(false);

  // Check camera availability
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const cameraAvailable = await QrScanner.hasCamera();
        setHasCamera(cameraAvailable);
        
        if (!cameraAvailable) {
          setError("No camera found on this device");
        }
      } catch (err) {
        console.error("Camera check failed:", err);
        setHasCamera(false);
        setError("Failed to access camera: " + err.message);
      }
    };

    checkCamera();
  }, []);

  // Cleanup function
  const cleanupScanner = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      } catch (err) {
        console.warn("Scanner cleanup error:", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
    isInitializingRef.current = false;
  }, []);

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    if (!hasCamera || !videoRef.current || isInitializingRef.current) return;

    // Cleanup any existing scanner
    cleanupScanner();
    isInitializingRef.current = true;

    const handleScanResult = (result) => {
      const now = Date.now();
      
      // Prevent rapid scanning (1 second cooldown) and check if already processing
      if (now - lastScanTime < 1000 || internalProcessingRef.current || isProcessing) {
        return;
      }

      setLastScanTime(now);
      internalProcessingRef.current = true;
      
      console.log("QR Code detected:", result.data);
      
      if (onScan) {
        onScan(result.data);
      }

      // Force scanner restart after successful scan to prevent camera issues
      setTimeout(() => {
        console.log("Restarting scanner after successful scan...");
        cleanupScanner();
        setTimeout(async () => {
          await initializeScanner();
          if (isActive) {
            await controlScanner(true);
          }
          internalProcessingRef.current = false;
          console.log("Scanner restarted and ready for next scan");
        }, 1000);
      }, 500);
    };

    try {
      const scanner = new QrScanner(videoRef.current, handleScanResult, {
        onDecodeError: (error) => {
          // Silent - this is normal when no QR code is in view
        },
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 1, // Reduced to prevent camera issues
        preferredCamera: 'environment', // Prefer back camera on mobile
      });

      scannerRef.current = scanner;
      setError(null);
      isInitializingRef.current = false;
      
      console.log("Scanner initialized successfully");
    } catch (err) {
      console.error("Scanner initialization failed:", err);
      setError("Failed to initialize scanner: " + err.message);
      isInitializingRef.current = false;
      if (onError) onError(err);
    }
  }, [hasCamera, onScan, onError, lastScanTime, isProcessing, cleanupScanner]);

  // Handle scanner start/stop with better error handling
  const controlScanner = useCallback(async (shouldStart) => {
    if (!scannerRef.current) {
      if (shouldStart) {
        await initializeScanner();
        if (scannerRef.current) {
          await controlScanner(true);
        }
      }
      return;
    }

    try {
      if (shouldStart && !isScanning) {
        console.log("Starting scanner...");
        await scannerRef.current.start();
        setIsScanning(true);
        setError(null);
        console.log("Scanner started successfully");
      } else if (!shouldStart && isScanning) {
        console.log("Stopping scanner...");
        scannerRef.current.stop();
        setIsScanning(false);
        console.log("Scanner stopped successfully");
      }
    } catch (err) {
      console.error("Scanner control failed:", err);
      setError("Failed to control camera: " + err.message);
      setIsScanning(false);
      
      // Try to reinitialize on error
      cleanupScanner();
      if (shouldStart) {
        setTimeout(() => {
          initializeScanner();
        }, 1000);
      }
      
      if (onError) onError(err);
    }
  }, [isScanning, initializeScanner, cleanupScanner, onError]);

  // Initialize scanner when component mounts or camera becomes available
  useEffect(() => {
    if (hasCamera && videoRef.current) {
      initializeScanner();
    }

    return cleanupScanner;
  }, [hasCamera, initializeScanner, cleanupScanner]);

  // Handle active state changes
  useEffect(() => {
    controlScanner(isActive);
  }, [isActive, controlScanner]);

  // Reset processing state when isProcessing changes
  useEffect(() => {
    if (!isProcessing) {
      internalProcessingRef.current = false;
    }
  }, [isProcessing]);

  // Video stream monitoring
  useEffect(() => {
    if (!videoRef.current || !isScanning) return;

    const video = videoRef.current;
    let streamCheckInterval;

    const checkVideoStream = () => {
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.warn("Video stream lost, attempting to recover...");
        // Stream is lost, reinitialize scanner
        cleanupScanner();
        setTimeout(() => {
          initializeScanner().then(() => {
            if (isActive) {
              controlScanner(true);
            }
          });
        }, 1000);
        return false;
      }
      return true;
    };

    // Check video stream every 2 seconds
    streamCheckInterval = setInterval(() => {
      if (!checkVideoStream()) {
        clearInterval(streamCheckInterval);
      }
    }, 2000);

    // Also check when video metadata loads
    const handleLoadedMetadata = () => {
      console.log("Video metadata loaded:", video.videoWidth, "x", video.videoHeight);
    };

    const handleError = (e) => {
      console.error("Video error:", e);
      setError("Video stream error");
      cleanupScanner();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      if (streamCheckInterval) {
        clearInterval(streamCheckInterval);
      }
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [isScanning, isActive, cleanupScanner, initializeScanner, controlScanner]);

  // Loading state
  if (hasCamera === null) {
    return (
      <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <motion.div
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-white">Checking camera...</p>
          </div>
        </div>
      </div>
    );
  }

  // No camera state
  if (!hasCamera) {
    return (
      <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        <div className="h-64 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-white font-bold text-xl mb-2">No Camera Available</h3>
            <p className="text-slate-400 mb-4">Camera access is required to scan QR codes.</p>
            <button
              onClick={() => {
                setHasCamera(null);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-64 object-cover"
        playsInline
        muted
        autoPlay
        style={{ 
          backgroundColor: '#1e293b', // Fallback background
          minHeight: '256px'
        }}
      />

      {/* Status Overlay */}
      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <motion.div
            className={`w-2 h-2 rounded-full ${
              isProcessing
                ? "bg-yellow-400"
                : isScanning
                  ? "bg-green-400"
                  : "bg-red-400"
            }`}
            animate={isScanning && !isProcessing ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-white text-sm font-medium">
            {isProcessing
              ? "Processing..."
              : isScanning
                ? "Scanning..."
                : "Camera Off"}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg p-3 text-center">
          <p className="text-white text-sm">
            {isProcessing
              ? "Processing ticket - please wait..."
              : isScanning
                ? "Point camera at QR code to scan ticket"
                : "Click 'Start Camera' to begin scanning"}
          </p>
        </div>
      </div>

      {/* Manual Restart Button (for debugging) */}
      {error && (
        <div className="absolute top-16 right-4">
          <button
            onClick={() => {
              setError(null);
              cleanupScanner();
              setTimeout(initializeScanner, 500);
            }}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
          >
            Restart Camera
          </button>
        </div>
      )}

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-4 bg-red-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center"
          >
            <div className="text-center p-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h4 className="text-white font-bold mb-2">Camera Error</h4>
              <p className="text-red-200 text-sm mb-3">{error}</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setError(null)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setError(null);
                    cleanupScanner();
                    setTimeout(initializeScanner, 500);
                  }}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Lost Overlay */}
      {isScanning && !error && (
        <div className="absolute inset-0">
          {/* Check if video has no dimensions (stream lost) */}
          {videoRef.current && (videoRef.current.videoWidth === 0 || videoRef.current.videoHeight === 0) && (
            <div className="absolute inset-4 bg-yellow-900/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <div className="text-center p-4">
                <div className="text-4xl mb-2">📷</div>
                <h4 className="text-white font-bold mb-2">Camera Feed Lost</h4>
                <p className="text-yellow-200 text-sm mb-3">Camera connection was interrupted</p>
                <button
                  onClick={() => {
                    cleanupScanner();
                    setTimeout(() => {
                      initializeScanner().then(() => {
                        if (isActive) {
                          controlScanner(true);
                        }
                      });
                    }, 500);
                  }}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                >
                  Reconnect Camera
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRScanner;