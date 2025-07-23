import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { paymentAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Navbar from "../components/common/navbar/Navbar";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState("checking");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  // Get payment parameters from URL
  const merchantOrderId = searchParams.get("merchantOrderId");
  const transactionId = searchParams.get("transactionId");
  const status = searchParams.get("status");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!merchantOrderId) {
        setError("Invalid payment reference");
        setPaymentStatus("error");
        return;
      }

      try {
        const response = await paymentAPI.checkPaymentStatus(merchantOrderId);

        if (response.data.success) {
          setPaymentDetails(response.data.payment);
          setPaymentStatus(response.data.payment.status);
        } else {
          setError(response.data.message || "Payment verification failed");
          setPaymentStatus("error");
        }
      } catch (err) {
        console.error("Payment status check failed:", err);
        setError("Failed to verify payment status");
        setPaymentStatus("error");
      }
    };

    checkPaymentStatus();
  }, [merchantOrderId]);

  const handleGoToDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  if (paymentStatus === "checking") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <LoadingSpinner size="lg" message="Verifying Payment Status" />
            <p className="text-slate-400 mt-4 text-sm sm:text-base">
              Please wait while we confirm your payment...
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-4 pt-20">
        <motion.div
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700/30 text-center">
            {paymentStatus === "completed" ? (
              // Success State
              <>
                <motion.div
                  className="text-6xl sm:text-8xl mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  🎉
                </motion.div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Payment Successful!
                </h1>

                <p className="text-slate-300 mb-6 text-sm sm:text-base">
                  Your tickets have been purchased successfully. You can view
                  and download them from your dashboard.
                </p>

                {paymentDetails && (
                  <div className="bg-slate-700/50 rounded-xl p-4 mb-6 text-left">
                    <h3 className="text-white font-semibold mb-3 text-center">
                      Payment Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Order ID:</span>
                        <span className="text-white font-mono">
                          {merchantOrderId}
                        </span>
                      </div>
                      {transactionId && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            Transaction ID:
                          </span>
                          <span className="text-white font-mono">
                            {transactionId}
                          </span>
                        </div>
                      )}
                      {paymentDetails.quantity && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Tickets:</span>
                          <span className="text-white">
                            {paymentDetails.quantity}
                          </span>
                        </div>
                      )}
                      {paymentDetails.amount && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Amount:</span>
                          <span className="text-white">
                            ₹{paymentDetails.amount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    onClick={handleGoToDashboard}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    View My Tickets
                  </motion.button>

                  <motion.button
                    onClick={handleGoHome}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go Home
                  </motion.button>
                </div>
              </>
            ) : paymentStatus === "failed" || paymentStatus === "cancelled" ? (
              // Failed/Cancelled State
              <>
                <motion.div
                  className="text-6xl sm:text-8xl mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  ❌
                </motion.div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Payment{" "}
                  {paymentStatus === "cancelled" ? "Cancelled" : "Failed"}
                </h1>

                <p className="text-slate-300 mb-6 text-sm sm:text-base">
                  {paymentStatus === "cancelled"
                    ? "Your payment was cancelled. No charges have been made to your account."
                    : "Your payment could not be processed. Please try again or contact support if the issue persists."}
                </p>

                {error && (
                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 mb-6">
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    onClick={() => navigate("/dashboard")}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try Again
                  </motion.button>

                  <motion.button
                    onClick={handleGoHome}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go Home
                  </motion.button>
                </div>
              </>
            ) : (
              // Error State
              <>
                <motion.div
                  className="text-6xl sm:text-8xl mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  ⚠️
                </motion.div>

                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                  Payment Status Unknown
                </h1>

                <p className="text-slate-300 mb-6 text-sm sm:text-base">
                  We couldn't verify your payment status. Please check your
                  dashboard or contact support.
                </p>

                {error && (
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 mb-6">
                    <p className="text-yellow-300 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <motion.button
                    onClick={handleGoToDashboard}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Check Dashboard
                  </motion.button>

                  <motion.button
                    onClick={handleGoHome}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Go Home
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;