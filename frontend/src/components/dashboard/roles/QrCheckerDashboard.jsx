import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { ticketAPI } from "../../../services/api";
import QRScanner from "../../qr-scanner/QRScanner";

const QrCheckerDashboard = () => {
  const { user, backendUser } = useAuth();
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [stats, setStats] = useState({
    totalScanned: 0,
    validEntries: 0,
    alreadyUsed: 0,
    invalidCodes: 0,
  });
  const isProcessingRef = useRef(false);

  const handleQRScan = async (qrCode) => {
    if (isProcessingRef.current) {
      console.log("Already processing, skipping scan");
      return;
    }

    try {
      isProcessingRef.current = true;
      setLoading(true);
      console.log("Processing QR Code:", qrCode);

      // Basic validation
      if (!qrCode || typeof qrCode !== "string" || qrCode.trim().length === 0) {
        showScanResult({
          type: "error",
          title: "❌ Invalid QR Code",
          message: "QR code is empty or malformed",
          details: "Please scan a valid ticket QR code",
        });
        updateStats("invalidCodes");
        return;
      }

      const trimmedQR = qrCode.trim();

      // Verify ticket with backend
      const response = await ticketAPI.verifyQRCode(trimmedQR);

      if (response.data.success) {
        const ticket = response.data.ticket;

        // Double-check ticket status on frontend as well
        if (ticket.status === "used") {
          const entryTime = ticket.entryTime
            ? new Date(ticket.entryTime).toLocaleString()
            : "Unknown";

          showScanResult({
            type: "error",
            title: "❌ Already Used",
            message: "This ticket has already been used",
            details: `Previously scanned on: ${entryTime}`,
            ticket: ticket,
          });
          updateStats("alreadyUsed");
          return;
        }

        if (ticket.status === "cancelled") {
          showScanResult({
            type: "error",
            title: "❌ Ticket Cancelled",
            message: "This ticket has been cancelled",
            details: "This ticket is no longer valid for entry",
            ticket: ticket,
          });
          updateStats("invalidCodes");
          return;
        }

        // Mark ticket as used for valid active tickets
        if (ticket.status === "active") {
          const markResponse = await ticketAPI.markTicketAsUsed(trimmedQR);

          if (markResponse.data.success) {
            showScanResult({
              type: "success",
              title: "✅ Entry Allowed",
              message: `Welcome ${ticket.user?.name || "Guest"}!`,
              details: "Ticket has been marked as used successfully",
              ticket: ticket,
            });
            updateStats("validEntries");
          } else {
            throw new Error("Failed to mark ticket as used");
          }
        }
      } else {
        // This should not happen if verify-qr is working correctly
        showScanResult({
          type: "error",
          title: "❌ Invalid Ticket",
          message: "QR code not recognized",
          details:
            "This QR code is not a valid ticket or doesn't exist in our system",
        });
        updateStats("invalidCodes");
      }
    } catch (error) {
      console.error("QR verification error:", error);

      // Handle specific error responses properly based on errorType
      const errorData = error.response?.data;
      const errorType = errorData?.errorType;

      if (error.response?.status === 404) {
        if (errorType === "TICKET_NOT_FOUND") {
          showScanResult({
            type: "error",
            title: "❌ Ticket Not Found",
            message: "This ticket doesn't exist",
            details: "The QR code doesn't match any ticket in our system",
          });
        } else {
          showScanResult({
            type: "error",
            title: "❌ Invalid QR Format",
            message: "QR code format is incorrect",
            details: "Please scan a valid ticket QR code",
          });
        }
        updateStats("invalidCodes");
      } else if (error.response?.status === 400) {
        // Check the specific error type for 400 errors
        if (errorType === "ALREADY_USED") {
          const ticket = errorData.ticket;
          const entryTime = ticket?.usedAt
            ? new Date(ticket.usedAt).toLocaleString()
            : "Unknown";

          showScanResult({
            type: "error",
            title: "❌ Already Used",
            message: "This ticket has already been used",
            details: `Previously used on: ${entryTime}`,
            ticket: ticket,
          });
          updateStats("alreadyUsed");
        } else if (errorType === "TICKET_CANCELLED") {
          showScanResult({
            type: "error",
            title: "❌ Ticket Cancelled",
            message: "This ticket has been cancelled",
            details: "This ticket is no longer valid for entry",
          });
          updateStats("invalidCodes");
        } else {
          // Generic 400 error
          showScanResult({
            type: "error",
            title: "❌ Invalid Request",
            message: errorData?.error || "Invalid QR code",
            details: "Please try scanning again",
          });
          updateStats("invalidCodes");
        }
      } else if (
        error.code === "NETWORK_ERROR" ||
        error.message.includes("Network Error")
      ) {
        showScanResult({
          type: "error",
          title: "🌐 Network Error",
          message: "Connection problem",
          details: "Please check your internet connection and try again",
        });
      } else {
        showScanResult({
          type: "error",
          title: "⚠️ Verification Failed",
          message: "Unable to verify ticket",
          details: errorData?.error || "Please try again",
        });
      }
    } finally {
      // Reset processing flag quickly to allow next scan
      setTimeout(() => {
        isProcessingRef.current = false;
        setLoading(false);
        console.log("Ready for next scan");
      }, 300);
    }
  };

  const showScanResult = (result) => {
    setScanResult(result);
    setShowResult(true);
    updateStats("totalScanned");

    // Auto-hide after 2.5 seconds (reduced for faster scanning)
    setTimeout(() => {
      setShowResult(false);
      setScanResult(null);
    }, 2500);
  };

  const updateStats = (type) => {
    setStats((prev) => ({
      ...prev,
      totalScanned:
        type === "totalScanned" ? prev.totalScanned + 1 : prev.totalScanned,
      validEntries:
        type === "validEntries" ? prev.validEntries + 1 : prev.validEntries,
      alreadyUsed:
        type === "alreadyUsed" ? prev.alreadyUsed + 1 : prev.alreadyUsed,
      invalidCodes:
        type === "invalidCodes" ? prev.invalidCodes + 1 : prev.invalidCodes,
    }));
  };

  const handleScanError = (error) => {
    console.error("Scanner error:", error);
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
  };

  const resetStats = () => {
    setStats({
      totalScanned: 0,
      validEntries: 0,
      alreadyUsed: 0,
      invalidCodes: 0,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Scan Result Overlay */}
      <AnimatePresence>
        {showResult && scanResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              className={`max-w-md w-full rounded-2xl p-8 text-center border-2 ${
                scanResult.type === "success"
                  ? "bg-green-900/90 border-green-500/50"
                  : "bg-red-900/90 border-red-500/50"
              } backdrop-blur-xl shadow-2xl`}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}>
              <motion.div
                className="text-8xl mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 10,
                }}>
                {scanResult.type === "success" ? "✅" : "❌"}
              </motion.div>

              <h2 className="text-3xl font-bold text-white mb-3">
                {scanResult.title}
              </h2>

              <p
                className={`text-xl font-semibold mb-2 ${
                  scanResult.type === "success"
                    ? "text-green-200"
                    : "text-red-200"
                }`}>
                {scanResult.message}
              </p>

              <p
                className={`text-sm mb-4 ${
                  scanResult.type === "success"
                    ? "text-green-300"
                    : "text-red-300"
                }`}>
                {scanResult.details}
              </p>

              {scanResult.ticket && (
                <div className="mt-6 p-4 bg-black/30 rounded-lg border border-white/20">
                  <p className="text-white font-medium">
                    {scanResult.ticket.user?.name || "Guest"}
                  </p>
                  <p className="text-slate-300 text-sm">
                    {scanResult.ticket.eventName}
                  </p>
                  <p className="text-slate-400 text-xs mt-1">
                    Ticket ID: {scanResult.ticket.ticketId}
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}>
          <motion.div
            className="text-6xl mb-4"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
            }}>
            📱
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent mb-4">
            QR Checker Dashboard
          </h1>

          <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
            <h2 className="text-2xl font-bold text-white mb-4">
              Ticket Verification Station
            </h2>

            {/* User Info */}
            {(user || backendUser) && (
              <div className="flex items-center justify-center gap-4 mt-6">
                {user?.photoURL || backendUser?.profilePicture ? (
                  <img
                    src={user?.photoURL || backendUser?.profilePicture}
                    alt={user?.displayName || backendUser?.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-green-400/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {(user?.displayName || backendUser?.name)?.charAt(0) || "Q"}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-white font-medium">
                    {user?.displayName || backendUser?.name || "QR Checker"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {user?.email || backendUser?.email}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: "📊",
              title: "Total Scanned",
              value: stats.totalScanned,
              color: "blue",
            },
            {
              icon: "✅",
              title: "Valid Entries",
              value: stats.validEntries,
              color: "green",
            },
            {
              icon: "🔄",
              title: "Already Used",
              value: stats.alreadyUsed,
              color: "yellow",
            },
            {
              icon: "❌",
              title: "Invalid",
              value: stats.invalidCodes,
              color: "red",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`bg-slate-700/50 backdrop-blur-xl rounded-xl p-4 border border-slate-600/30 text-center`}
              whileHover={{ scale: 1.02 }}>
              <div className="text-2xl mb-2">{stat.icon}</div>
              <h3 className="text-slate-300 font-medium text-sm mb-1">
                {stat.title}
              </h3>
              <p className="text-white text-xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Camera Controls */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">📷</span>
            Camera Controls
          </h3>

          <div className="space-y-4">
            <motion.button
              onClick={toggleCamera}
              className={`w-full px-6 py-4 rounded-xl font-bold text-lg transition-all ${
                cameraActive
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>
              {cameraActive ? "🛑 Stop Camera" : "▶️ Start Camera"}
            </motion.button>

            <div
              className={`p-4 rounded-lg border ${
                cameraActive
                  ? "bg-green-900/20 border-green-700/30"
                  : "bg-slate-700/30 border-slate-600/30"
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    cameraActive ? "bg-green-400" : "bg-slate-400"
                  }`}></div>
                <span className="text-white font-medium">
                  {cameraActive ? "Camera Active" : "Camera Inactive"}
                </span>
              </div>
              <p className="text-slate-400 text-sm">
                {cameraActive
                  ? "Point camera at QR codes to scan tickets"
                  : "Click 'Start Camera' to begin scanning"}
              </p>
            </div>

            {loading && (
              <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-300 font-medium">
                    Processing ticket...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* QR Scanner */}
        <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">📱</span>
            QR Code Scanner
          </h3>

          <QRScanner
            onScan={handleQRScan}
            onError={handleScanError}
            isActive={cameraActive}
            isProcessing={loading}
            className="w-full"
          />

          {!cameraActive && (
            <div className="mt-4 text-center p-6 bg-slate-700/30 rounded-xl border border-slate-600/30">
              <div className="text-4xl mb-3">📱</div>
              <h4 className="text-white font-bold mb-2">Ready to Scan</h4>
              <p className="text-slate-400 text-sm">
                Click "Start Camera" above to begin scanning QR codes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Reset Stats Button */}
      <div className="text-center">
        <motion.button
          onClick={resetStats}
          className="px-6 py-3 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 rounded-lg transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}>
          Reset Statistics
        </motion.button>
      </div>
    </motion.div>
  );
};

export default QrCheckerDashboard;
