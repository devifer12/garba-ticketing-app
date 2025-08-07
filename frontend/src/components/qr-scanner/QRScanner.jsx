import React, { useRef, useEffect, useState } from "react";
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

  // Initialize scanner
  useEffect(() => {
    if (!hasCamera || !videoRef.current) return;

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

      // Reset internal processing flag quickly to allow scanner to continue
      setTimeout(() => {
        internalProcessingRef.current = false;
        console.log("Scanner ready for next scan");
      }, 500);
    };

    try {
      const scanner = new QrScanner(videoRef.current, handleScanResult, {
        onDecodeError: (error) => {
          // Silent - this is normal when no QR code is in view
        },
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 2,
      });

      scannerRef.current = scanner;
      setError(null);
    } catch (err) {
      console.error("Scanner initialization failed:", err);
      setError("Failed to initialize scanner: " + err.message);
      if (onError) onError(err);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, [hasCamera, onScan, onError, lastScanTime]);

  // Handle scanner start/stop
  useEffect(() => {
    if (!scannerRef.current) return;

    const handleScannerState = async () => {
      try {
        if (isActive && !isScanning) {
          await scannerRef.current.start();
          setIsScanning(true);
          setError(null);
        } else if (!isActive && isScanning) {
          scannerRef.current.stop();
          setIsScanning(false);
        }
      } catch (err) {
        console.error("Scanner control failed:", err);
        setError("Failed to control camera: " + err.message);
        setIsScanning(false);
        if (onError) onError(err);
      }
    };

    handleScannerState();
  }, [isActive, isScanning, onError]);

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
              onClick={() => window.location.reload()}
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
              <button
                onClick={() => setError(null)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRScanner;