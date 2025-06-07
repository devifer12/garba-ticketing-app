import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";

const QrCheckerDashboard = () => {
  const { user, backendUser } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto">
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-slate-700/30">
        {/* Header */}
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
                    className="w-12 h-12 rounded-full object-cover border-2 border-blue-400/50"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {(user?.displayName || backendUser?.name)?.charAt(0) || "M"}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-white font-medium">
                    {user?.displayName || backendUser?.name || "Manager"}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {user?.email || backendUser?.email}
                  </p>
                </div>
              </div>
            )}

            {/* QR Checker Features Preview */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl mb-2">📱</div>
                <h3 className="text-white font-semibold mb-1">QR Scanner</h3>
                <p className="text-slate-400 text-sm">Scan tickets & verify entry</p>
              </motion.div>
              
              <motion.div
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl mb-2">✅</div>
                <h3 className="text-white font-semibold mb-1">Entry Validation</h3>
                <p className="text-slate-400 text-sm">Validate ticket authenticity</p>
              </motion.div>
              
              <motion.div
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl mb-2">📊</div>
                <h3 className="text-white font-semibold mb-1">Scan History</h3>
                <p className="text-slate-400 text-sm">View scanning activity</p>
              </motion.div>
              
              <motion.div
                className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/30"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-2xl mb-2">🔍</div>
                <h3 className="text-white font-semibold mb-1">Manual Lookup</h3>
                <p className="text-slate-400 text-sm">Search tickets manually</p>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default QrCheckerDashboard;
