import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QrScanner from 'qr-scanner';

const QRScanner = ({ 
  onScan, 
  onError, 
  isActive = true, 
  className = '',
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  scanBoxColor = '#00ff00'
}) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);

  useEffect(() => {
    const initializeScanner = async () => {
      try {
        // Check if camera is available
        const hasCamera = await QrScanner.hasCamera();
        setHasCamera(hasCamera);

        if (!hasCamera) {
          setError('No camera found on this device');
          return;
        }

        // Get available cameras
        const cameras = await QrScanner.listCameras(true);
        setCameras(cameras);
        
        // Prefer back camera for scanning
        const backCamera = cameras.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );
        setSelectedCamera(backCamera || cameras[0]);

        if (videoRef.current) {
          // Initialize QR Scanner
          scannerRef.current = new QrScanner(
            videoRef.current,
            (result) => {
              if (onScan) {
                onScan(result.data);
              }
            },
            {
              onDecodeError: (error) => {
                // Silently handle decode errors (normal when no QR code is visible)
                console.debug('QR decode error:', error);
              },
              preferredCamera: selectedCamera?.id || 'environment',
              highlightScanRegion: true,
              highlightCodeOutline: true,
              maxScansPerSecond: 5,
            }
          );

          // Set overlay and scan region styling
          scannerRef.current.$overlay.style.background = overlayColor;
          scannerRef.current.$overlay.style.borderColor = scanBoxColor;
        }

      } catch (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to initialize camera: ' + err.message);
        if (onError) onError(err);
      }
    };

    initializeScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [selectedCamera, onScan, onError, overlayColor, scanBoxColor]);

  useEffect(() => {
    if (scannerRef.current && hasCamera) {
      if (isActive && !isScanning) {
        startScanning();
      } else if (!isActive && isScanning) {
        stopScanning();
      }
    }
  }, [isActive, hasCamera]);

  const startScanning = async () => {
    try {
      if (scannerRef.current && !isScanning) {
        await scannerRef.current.start();
        setIsScanning(true);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to start scanner:', err);
      setError('Failed to start camera: ' + err.message);
      if (onError) onError(err);
    }
  };

  const stopScanning = () => {
    try {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop();
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Failed to stop scanner:', err);
    }
  };

  const switchCamera = async () => {
    if (cameras.length <= 1) return;

    try {
      const currentIndex = cameras.findIndex(cam => cam.id === selectedCamera?.id);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      
      setSelectedCamera(nextCamera);
      
      if (scannerRef.current) {
        await scannerRef.current.setCamera(nextCamera.id);
      }
    } catch (err) {
      console.error('Failed to switch camera:', err);
      setError('Failed to switch camera');
    }
  };

  if (!hasCamera) {
    return (
      <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        <div className="aspect-square flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-white font-bold text-xl mb-2">No Camera Available</h3>
            <p className="text-slate-400">
              Camera access is required to scan QR codes. Please ensure your device has a camera and grant permission.
            </p>
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
        className="w-full aspect-square object-cover"
        playsInline
        muted
      />

      {/* Scanner Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        {/* Status Indicator */}
        <div className="bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <motion.div
              className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-400' : 'bg-red-400'}`}
              animate={isScanning ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-white text-sm font-medium">
              {isScanning ? 'Scanning...' : 'Camera Off'}
            </span>
          </div>
        </div>

        {/* Camera Switch Button */}
        {cameras.length > 1 && (
          <motion.button
            onClick={switchCamera}
            className="bg-black/50 backdrop-blur-sm rounded-lg p-2 text-white hover:bg-black/70 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.button>
        )}
      </div>

      {/* Scanning Instructions */}
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-center">
          <p className="text-white text-sm">
            {isScanning 
              ? 'Point camera at QR code to scan ticket'
              : 'Camera is not active'
            }
          </p>
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
              <p className="text-red-200 text-sm">{error}</p>
              <motion.button
                onClick={() => setError(null)}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Dismiss
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {!isScanning && hasCamera && isActive && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="text-center">
            <motion.div
              className="w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-white text-sm">Starting camera...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;