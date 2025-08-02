import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/common/navbar/Navbar";

const PaymentSuccess = () => {
  const navigate = useNavigate();

  const handleGoToDashboard = () => {
    navigate("/dashboard", { replace: true });
    setTimeout(() => {
      const ticketsSection = document.getElementById("tickets-section");
      if (ticketsSection) {
        ticketsSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 400);
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  // Show success page directly since Razorpay handles payment flow
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <motion.div className="flex items-center justify-center min-h-screen px-4 pt-20">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700/30 text-center">
            <motion.div
              className="text-6xl sm:text-8xl mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
              🎉
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Payment Successful!
            </h1>

            <p className="text-slate-300 mb-6 text-sm sm:text-base">
              Your tickets have been purchased successfully. You can view and
              download them from your dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={handleGoToDashboard}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                View My Tickets
              </motion.button>

              <motion.button
                onClick={handleGoHome}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}>
                Go Home
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
