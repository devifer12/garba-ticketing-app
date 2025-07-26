import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { paymentAPI } from "../services/api";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Navbar from "../components/common/navbar/Navbar";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState("checking");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState(null);

  // Get payment parameters from URL
  const merchantOrderId = searchParams.get("merchantOrderId");
  const transactionId = searchParams.get("transactionId");
  const urlStatus = searchParams.get("status");

  useEffect(() => {
    const checkPaymentStatus = async () => {
      console.log("🔍 Frontend: Starting payment status check");
      console.log("🔍 Frontend: merchantOrderId:", merchantOrderId);
      console.log("🔍 Frontend: urlStatus:", urlStatus);

      if (!merchantOrderId) {
        console.log("⚠️ Frontend: No merchantOrderId found");
        // If no merchantOrderId but we have URL status, use that
        if (urlStatus) {
          console.log("🔄 Frontend: Using URL status:", urlStatus);
          setPaymentStatus(urlStatus.toLowerCase());
          return;
        }
        console.log("❌ Frontend: No payment reference found");
        setError("Invalid payment reference");
        setPaymentStatus("error");
        return;
      }

      try {
        console.log(
          "📞 Frontend: Calling API for merchantOrderId:",
          merchantOrderId,
        );
        const response = await paymentAPI.checkPaymentStatus(merchantOrderId);

        console.log("📥 Frontend: Raw API response:", response);
        console.log(
          "📥 Frontend: Response data:",
          JSON.stringify(response.data, null, 2),
        );
        console.log("📥 Frontend: Response success:", response.data.success);
        console.log(
          "📥 Frontend: Response paymentState:",
          response.data.paymentState,
        );
        console.log("📥 Frontend: Response tickets:", response.data.tickets);

        if (response.data.success) {
          // Backend returns paymentState and tickets, not payment object
          const paymentState = response.data.paymentState;
          const tickets = response.data.tickets || [];

          console.log("✅ Frontend: Processing successful response");
          console.log("🔍 Frontend: paymentState from backend:", paymentState);
          console.log("🔍 Frontend: tickets from backend:", tickets);

          // Map PhonePe payment states to our status
          let mappedStatus = "error";
          if (
            paymentState === "COMPLETED" ||
            paymentState === "checkout.order.completed"
          ) {
            mappedStatus = "completed";
          } else if (
            paymentState === "FAILED" ||
            paymentState === "checkout.order.failed"
          ) {
            mappedStatus = "failed";
          } else if (
            paymentState === "CANCELLED" ||
            paymentState === "checkout.order.cancelled"
          ) {
            mappedStatus = "cancelled";
          } else if (
            paymentState === "PENDING" ||
            paymentState === "checkout.order.pending" ||
            paymentState === "initiated"
          ) {
            mappedStatus = "checking";
          }

          console.log("🔄 Frontend: Mapped status:", mappedStatus);

          const paymentDetailsObj = {
            merchantOrderId: response.data.merchantOrderId,
            paymentState: paymentState,
            tickets: tickets,
            quantity: tickets.length,
            amount: tickets.reduce(
              (sum, ticket) => sum + (ticket.price || 0),
              0,
            ),
          };

          console.log(
            "📋 Frontend: Setting payment details:",
            paymentDetailsObj,
          );
          setPaymentDetails(paymentDetailsObj);
          setPaymentStatus(mappedStatus);
          console.log("✅ Frontend: Payment status set to:", mappedStatus);
        } else {
          console.log("❌ Frontend: API returned success: false");
          console.log("❌ Frontend: Error from API:", response.data.error);
          setError(response.data.error || "Payment verification failed");
          setPaymentStatus("error");
        }
      } catch (err) {
        console.error("❌ Frontend: Payment status check failed:", err);
        console.error("❌ Frontend: Error details:", {
          message: err.message,
          response: err.response,
          responseData: err.response?.data,
          status: err.response?.status,
        });
        setError(
          err.response?.data?.error || "Failed to verify payment status",
        );
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
                        <span className="text-white font-mono text-xs">
                          {paymentDetails.merchantOrderId || merchantOrderId}
                        </span>
                      </div>
                      {transactionId && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">
                            Transaction ID:
                          </span>
                          <span className="text-white font-mono text-xs">
                            {transactionId}
                          </span>
                        </div>
                      )}
                      {paymentDetails.tickets &&
                        paymentDetails.tickets.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Tickets:</span>
                            <span className="text-white">
                              {paymentDetails.tickets.length}
                            </span>
                          </div>
                        )}
                      {paymentDetails.amount && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">Amount:</span>
                          <span className="text-white">
                            ₹{paymentDetails.amount.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400">Status:</span>
                        <span className="text-white capitalize">
                          {paymentDetails.paymentState || "Unknown"}
                        </span>
                      </div>
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