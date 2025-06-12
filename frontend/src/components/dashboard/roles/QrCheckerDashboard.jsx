import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { ticketAPI, apiUtils } from "../../../services/api";
import QRScanner from "../../qr-scanner/QRScanner";
import TicketVerificationModal from "../../qr-scanner/TicketVerificationModal";

const QrCheckerDashboard = () => {
  const { user, backendUser } = useAuth();
  const [scannerActive, setScannerActive] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [stats, setStats] = useState({
    totalScanned: 0,
    validEntries: 0,
    rejectedScans: 0
  });

  // Load scan history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('qr_scan_history');
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setScanHistory(history);
        
        // Calculate stats from history
        const totalScanned = history.length;
        const validEntries = history.filter(scan => scan.status === 'valid' && scan.marked).length;
        const rejectedScans = history.filter(scan => scan.status !== 'valid').length;
        
        setStats({ totalScanned, validEntries, rejectedScans });
      } catch (error) {
        console.error('Failed to load scan history:', error);
      }
    }
  }, []);

  // Save scan history to localStorage
  const saveScanHistory = (newHistory) => {
    try {
      localStorage.setItem('qr_scan_history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save scan history:', error);
    }
  };

  // Add scan to history
  const addToScanHistory = (qrCode, ticket, status, marked = false) => {
    const scanEntry = {
      id: Date.now(),
      qrCode,
      ticket,
      status,
      marked,
      timestamp: new Date().toISOString(),
      scannedBy: backendUser?.name || user?.displayName || 'Unknown'
    };

    const newHistory = [scanEntry, ...scanHistory.slice(0, 49)]; // Keep last 50 scans
    setScanHistory(newHistory);
    saveScanHistory(newHistory);

    // Update stats
    const totalScanned = newHistory.length;
    const validEntries = newHistory.filter(scan => scan.status === 'valid' && scan.marked).length;
    const rejectedScans = newHistory.filter(scan => scan.status !== 'valid').length;
    
    setStats({ totalScanned, validEntries, rejectedScans });
  };

  const handleQRScan = async (qrCode) => {
    if (loading) return;

    try {
      setLoading(true);
      console.log('QR Code scanned:', qrCode);

      // Validate QR code format
      if (!apiUtils.isValidQRCode(qrCode)) {
        setVerificationStatus('invalid');
        setCurrentTicket(null);
        setShowVerificationModal(true);
        addToScanHistory(qrCode, null, 'invalid');
        toast.error('Invalid QR code format');
        return;
      }

      // Verify ticket with backend
      const response = await ticketAPI.verifyQRCode(qrCode);
      
      if (response.data.success) {
        const ticket = response.data.ticket;
        
        // Determine verification status
        let status = 'valid';
        if (ticket.status === 'used') {
          status = 'used';
        } else if (ticket.status === 'cancelled') {
          status = 'cancelled';
        }

        setCurrentTicket(ticket);
        setVerificationStatus(status);
        setShowVerificationModal(true);
        addToScanHistory(qrCode, ticket, status);

        // Show appropriate toast
        if (status === 'valid') {
          toast.success(`Valid ticket for ${ticket.user?.name}`);
        } else if (status === 'used') {
          toast.warning('Ticket already used');
        } else if (status === 'cancelled') {
          toast.error('Ticket has been cancelled');
        }
      }

    } catch (error) {
      console.error('QR verification error:', error);
      const errorMessage = apiUtils.formatErrorMessage(error);
      
      setVerificationStatus('invalid');
      setCurrentTicket(null);
      setShowVerificationModal(true);
      addToScanHistory(qrCode, null, 'invalid');
      
      toast.error(`Verification failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsUsed = async () => {
    if (!currentTicket || verificationStatus !== 'valid') return;

    try {
      setLoading(true);
      
      const response = await ticketAPI.markTicketAsUsed(currentTicket.qrCode);
      
      if (response.data.success) {
        toast.success('Entry allowed! Ticket marked as used.');
        
        // Update scan history to mark this entry as completed
        const updatedHistory = scanHistory.map(scan => 
          scan.qrCode === currentTicket.qrCode && scan.status === 'valid'
            ? { ...scan, marked: true }
            : scan
        );
        setScanHistory(updatedHistory);
        saveScanHistory(updatedHistory);
        
        // Update stats
        setStats(prev => ({
          ...prev,
          validEntries: prev.validEntries + 1
        }));
        
        setShowVerificationModal(false);
        setCurrentTicket(null);
        setVerificationStatus(null);
      }
      
    } catch (error) {
      console.error('Mark as used error:', error);
      const errorMessage = apiUtils.formatErrorMessage(error);
      toast.error(`Failed to mark ticket as used: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleScanError = (error) => {
    console.error('Scanner error:', error);
    toast.error('Scanner error: ' + error.message);
  };

  const toggleScanner = () => {
    setScannerActive(!scannerActive);
    if (!scannerActive) {
      toast.info('QR Scanner activated');
    } else {
      toast.info('QR Scanner deactivated');
    }
  };

  const clearScanHistory = () => {
    setScanHistory([]);
    setStats({ totalScanned: 0, validEntries: 0, rejectedScans: 0 });
    localStorage.removeItem('qr_scan_history');
    toast.success('Scan history cleared');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
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
            }}
          >
            📱
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent mb-4">
            QR Checker Dashboard
          </h1>

          <motion.div
            className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-6"
            animate={{
              scaleX: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />

          <div className="bg-slate-700/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
            <h2 className="text-2xl font-bold text-white mb-4">
              Entry Verification Station
            </h2>
            <p className="text-lg text-slate-300 mb-4">
              You are{" "}
              <span className="text-green-400 font-semibold">QR Checker</span>!
            </p>

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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { icon: "📊", title: "Total Scanned", value: stats.totalScanned, color: "blue" },
            { icon: "✅", title: "Valid Entries", value: stats.validEntries, color: "green" },
            { icon: "❌", title: "Rejected", value: stats.rejectedScans, color: "red" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`bg-gradient-to-br from-${stat.color}-900/40 to-${stat.color}-800/40 backdrop-blur-xl rounded-xl p-6 border border-${stat.color}-700/30`}
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl mb-3">{stat.icon}</div>
              <h3 className={`text-${stat.color}-300 font-medium mb-1`}>{stat.title}</h3>
              <p className="text-white text-2xl font-bold">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* QR Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scanner */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📷</span>
              QR Code Scanner
            </h3>
            
            <motion.button
              onClick={toggleScanner}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                scannerActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {scannerActive ? '⏹️ Stop Scanner' : '▶️ Start Scanner'}
            </motion.button>
          </div>

          <QRScanner
            onScan={handleQRScan}
            onError={handleScanError}
            isActive={scannerActive}
            className="w-full"
            overlayColor="rgba(0, 0, 0, 0.6)"
            scanBoxColor="#10b981"
          />

          {!scannerActive && (
            <div className="mt-4 text-center">
              <p className="text-slate-400 text-sm">
                Click "Start Scanner" to begin scanning QR codes
              </p>
            </div>
          )}
        </div>

        {/* Scan History */}
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-2xl">📋</span>
              Recent Scans
            </h3>
            
            {scanHistory.length > 0 && (
              <motion.button
                onClick={clearScanHistory}
                className="px-4 py-2 bg-red-600/50 hover:bg-red-600/70 text-red-300 rounded-lg text-sm transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Clear History
              </motion.button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {scanHistory.length > 0 ? (
              scanHistory.map((scan) => (
                <motion.div
                  key={scan.id}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/30"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      scan.status === 'valid' 
                        ? scan.marked 
                          ? 'bg-green-900/30 text-green-300' 
                          : 'bg-yellow-900/30 text-yellow-300'
                        : scan.status === 'used'
                        ? 'bg-blue-900/30 text-blue-300'
                        : 'bg-red-900/30 text-red-300'
                    }`}>
                      {scan.status === 'valid' 
                        ? scan.marked ? 'Entry Allowed' : 'Valid (Pending)'
                        : scan.status === 'used' ? 'Already Used'
                        : scan.status === 'cancelled' ? 'Cancelled'
                        : 'Invalid'
                      }
                    </span>
                    <span className="text-slate-400 text-xs">
                      {formatDate(scan.timestamp)}
                    </span>
                  </div>
                  
                  {scan.ticket ? (
                    <div className="text-sm">
                      <p className="text-white font-medium">{scan.ticket.user?.name}</p>
                      <p className="text-slate-400 text-xs">{scan.ticket.eventName}</p>
                    </div>
                  ) : (
                    <p className="text-red-400 text-sm">Invalid QR Code</p>
                  )}
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-slate-400">No scans yet</p>
                <p className="text-slate-500 text-sm">Start scanning QR codes to see history</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Modal */}
      <TicketVerificationModal
        isOpen={showVerificationModal}
        onClose={() => {
          setShowVerificationModal(false);
          setCurrentTicket(null);
          setVerificationStatus(null);
        }}
        ticket={currentTicket}
        verificationStatus={verificationStatus}
        onMarkAsUsed={handleMarkAsUsed}
        loading={loading}
      />
    </motion.div>
  );
};

export default QrCheckerDashboard;