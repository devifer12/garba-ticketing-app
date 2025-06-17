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
  const [hasCamera, setHasCamera] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scannerReady, setScannerReady] = useState(false);

  // Check camera availability and initialize
  useEffect(() => {
    const checkCameraAndInit = async () => {
      try {
        setIsInitializing(true);
        setError(null);
        
        console.log('🔍 Checking camera availability...');
        
        // Check if camera is available
        const cameraAvailable = await QrScanner.hasCamera();
        console.log('📷 Camera available:', cameraAvailable);
        setHasCamera(cameraAvailable);

        if (!cameraAvailable) {
          setError('No camera found on this device');
          return;
        }

        // Get available cameras
        console.log('📋 Getting camera list...');
        const cameraList = await QrScanner.listCameras(true);
        console.log('📋 Available cameras:', cameraList);
        setCameras(cameraList);
        
        // Prefer back camera for scanning
        const backCamera = cameraList.find(camera => 
          camera.label.toLowerCase().includes('back') || 
          camera.label.toLowerCase().includes('rear') ||
          camera.label.toLowerCase().includes('environment')
        );
        const preferredCamera = backCamera || cameraList[0];
        console.log('🎯 Selected camera:', preferredCamera);
        setSelectedCamera(preferredCamera);

      } catch (err) {
        console.error('❌ Camera check failed:', err);
        setError('Failed to access camera: ' + err.message);
        setHasCamera(false);
        if (onError) onError(err);
      } finally {
        setIsInitializing(false);
      }
    };

    checkCameraAndInit();
  }, [onError]);

  // Initialize scanner when camera is selected and video element is ready
  useEffect(() => {
    if (!hasCamera || !selectedCamera || !videoRef.current) return;

    const initScanner = async () => {
      try {
        console.log('🔧 Initializing QR Scanner...');
        
        // Clean up existing scanner
        if (scannerRef.current) {
          console.log('🧹 Cleaning up existing scanner...');
          try {
            scannerRef.current.destroy();
          } catch (cleanupError) {
            console.warn('⚠️ Error during scanner cleanup:', cleanupError);
          }
          scannerRef.current = null;
          setScannerReady(false);
        }

        // Wait a bit to ensure video element is ready
        await new Promise(resolve => setTimeout(resolve, 100));

        // Create new scanner instance with throttling
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            const now = Date.now();
            // Throttle scans to prevent rapid-fire scanning of the same code
            if (now - lastScanTime < 2000) {
              console.log('🔄 Scan throttled - too soon after last scan');
              return;
            }
            
            setLastScanTime(now);
            console.log('✅ QR Code detected:', result.data);
            
            if (onScan) {
              onScan(result.data);
            }
          },
          {
            onDecodeError: (error) => {
              // Silently handle decode errors (normal when no QR code is visible)
              console.debug('🔍 QR decode error (normal):', error.message);
            },
            preferredCamera: selectedCamera.id,
            highlightScanRegion: true,
            highlightCodeOutline: true,
            maxScansPerSecond: 2,
            returnDetailedScanResult: true,
          }
        );

        console.log('✅ QR Scanner initialized successfully');
        setScannerReady(true);

        // Set overlay styling if scanner has overlay
        if (scannerRef.current.$overlay) {
          scannerRef.current.$overlay.style.background = overlayColor;
          if (scannerRef.current.$overlay.style.borderColor !== undefined) {
            scannerRef.current.$overlay.style.borderColor = scanBoxColor;
          }
        }

      } catch (err) {
        console.error('❌ Scanner initialization failed:', err);
        setError('Failed to initialize scanner: ' + err.message);
        setScannerReady(false);
        if (onError) onError(err);
      }
    };

    initScanner();

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        console.log('🧹 Cleaning up scanner on unmount...');
        try {
          scannerRef.current.destroy();
        } catch (err) {
          console.warn('⚠️ Error during scanner cleanup:', err);
        }
        scannerRef.current = null;
        setScannerReady(false);
      }
    };
  }, [hasCamera, selectedCamera, onScan, onError, overlayColor, scanBoxColor]);

  // Handle scanner start/stop based on isActive prop - FIXED: Only start when scanner is ready
  useEffect(() => {
    if (!scannerRef.current || hasCamera === false || !scannerReady) return;

    const handleScannerState = async () => {
      try {
        if (isActive && !isScanning) {
          console.log('▶️ Starting scanner...');
          await scannerRef.current.start();
          setIsScanning(true);
          setError(null);
          console.log('✅ Scanner started successfully');
        } else if (!isActive && isScanning) {
          console.log('⏹️ Stopping scanner...');
          scannerRef.current.stop();
          setIsScanning(false);
          console.log('✅ Scanner stopped successfully');
        }
      } catch (err) {
        console.error('❌ Scanner state change failed:', err);
        setError('Failed to control camera: ' + err.message);
        setIsScanning(false);
        if (onError) onError(err);
      }
    };

    // Add a delay to ensure scanner is fully ready
    const timer = setTimeout(handleScannerState, 200);
    return () => clearTimeout(timer);
  }, [isActive, isScanning, hasCamera, onError, scannerReady]);

  const switchCamera = async () => {
    if (cameras.length <= 1 || !scannerRef.current || !scannerReady) return;

    try {
      console.log('🔄 Switching camera...');
      const currentIndex = cameras.findIndex(cam => cam.id === selectedCamera?.id);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      
      console.log('📷 Switching to camera:', nextCamera);
      
      // Stop current scanner
      if (isScanning) {
        scannerRef.current.stop();
        setIsScanning(false);
      }
      
      // Wait a bit before switching
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set new camera
      await scannerRef.current.setCamera(nextCamera.id);
      setSelectedCamera(nextCamera);
      
      // Restart if it was active
      if (isActive) {
        await new Promise(resolve => setTimeout(resolve, 100));
        await scannerRef.current.start();
        setIsScanning(true);
      }
      
      console.log('✅ Camera switched successfully');
    } catch (err) {
      console.error('❌ Failed to switch camera:', err);
      setError('Failed to switch camera: ' + err.message);
    }
  };

  // Show loading state during initialization
  if (isInitializing || hasCamera === null) {
    return (
      <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        <div className="aspect-square flex items-center justify-center p-8">
          <div className="text-center">
            <motion.div
              className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <h3 className="text-white font-bold text-xl mb-2">Initializing Camera</h3>
            <p className="text-slate-400">
              Checking camera permissions and availability...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show no camera message
  if (hasCamera === false) {
    return (
      <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}>
        <div className="aspect-square flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📷</div>
            <h3 className="text-white font-bold text-xl mb-2">No Camera Available</h3>
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
    <div className={`relative bg-slate-800 rounded-xl overflow-hidden ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full aspect-square object-cover"
        playsInline
        muted
        autoPlay
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
              {isScanning ? 'Scanning...' : scannerReady ? 'Ready' : 'Initializing...'}
            </span>
          </div>
        </div>

        {/* Camera Switch Button */}
        {cameras.length > 1 && scannerReady && (
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
              : scannerReady 
                ? 'Camera ready - click Start Scanner to begin'
                : 'Preparing camera...'
            }
          </p>
          {selectedCamera && (
            <p className="text-slate-300 text-xs mt-1">
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

      {/* Loading Overlay - Show when scanner should be active but isn't ready yet */}
      {isActive && !isScanning && !error && hasCamera && !scannerReady && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="text-center">
            <motion.div
              className="w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-white text-sm">Preparing scanner...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;