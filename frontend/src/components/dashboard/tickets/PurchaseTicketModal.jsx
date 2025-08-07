import React, { useState } from "react";
import { motion } from "framer-motion";
import { paymentAPI } from "../../../services/api";
import { toast } from "react-toastify";
import {Link} from "react-router-dom"; 

const PurchaseTicketModal = ({ event, onClose, onPurchase, purchasing }) => {
  const [quantity, setQuantity] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // New state variable for internal processing

  // Calculate price based on quantity (tiered pricing)
  const calculatePrice = (qty) => {
    if (!event) return 0;
    if (qty >= 4) {
      return event.groupPrice4 || event.ticketPrice;
    } else {
      return event.ticketPrice;
    }
  };

  const pricePerTicket = calculatePrice(quantity);
  const totalAmount = pricePerTicket * quantity;

  // Get pricing tier info
  const getPricingTier = (qty) => {
    if (qty >= 4) return { name: "Group 4+", discount: true };
    return { name: "Individual", discount: false };
  };

  const currentTier = getPricingTier(quantity);

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
  };

 const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const orderData = {
        quantity: quantity,
        amount: totalAmount,
        eventId: event._id || event.id,
        eventName: event.name,
        pricePerTicket: pricePerTicket,
        pricingTier: currentTier.name,
      };

      const response = await paymentAPI.createOrder(orderData);

      if (response.data.success) {
        const { orderId, amount, currency, key } = response.data;

        const options = {
          key: key,
          amount: amount * 100,
          currency: currency,
          name: "Garba Rass 2025",
          description: `${quantity} ticket(s) for ${event.name}`,
          order_id: orderId,
          handler: function (response) {
            // Show immediate feedback to the user
            toast.success("🎉 Payment successful! Your tickets are being generated.");
            
            // Close the modal
            onClose();

            // Redirect immediately to a success page
            // It's a good practice to have a page that informs the user
            // that their tickets will be sent via email.
            window.location.href = "/payment-success";

            // Verify the payment in the background
            paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              quantity: quantity,
            }).then(verifyResponse => {
              if (verifyResponse.data.success) {
                console.log("Payment verification successful. Tickets sent.");
              } else {
                console.error("Payment verification failed.");
                // You might want to trigger an email to your support team here
                toast.error("Payment verification failed. Please contact support.");
              }
            }).catch(error => {
              console.error("Error verifying payment:", error);
              // Also, a good place to notify support
              toast.error("An error occurred during payment verification. Please contact support.");
            });
          },
          prefill: {
            name: event.user?.name || "",
            email: event.user?.email || "",
          },
          theme: {
            color: "#ff6500",
          },
          modal: {
            ondismiss: function() {
              toast.info("Payment cancelled");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error(response.data.error || "Failed to create order");
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      toast.error("Failed to create payment order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
    setShowConfirm(false);
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {!showConfirm ? (
          // Purchase Form
          <div className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl mb-3">🎫</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Purchase Tickets
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                {event.name}
              </p>
            </div>

            {/* Pricing Tiers Information */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h4 className="text-blue-300 font-medium mb-2 text-sm sm:text-base">
                💰 Pricing Tiers:
              </h4>
              <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                <div
                  className={`flex justify-between ${
                    quantity >= 1 && quantity <= 3
                      ? "text-blue-200 font-medium"
                      : "text-blue-300/70"
                  }`}
                >
                  <span>Individual (1-3 tickets):</span>
                  <span>₹{event.ticketPrice} each</span>
                </div>
                <div
                  className={`flex justify-between ${
                    quantity >= 4
                      ? "text-green-200 font-medium"
                      : "text-blue-300/70"
                  }`}
                >
                  <span>Group 4+</span>
                  <span>₹{event.groupPrice4 || event.ticketPrice} each</span>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-r from-navratri-orange/20 to-navratri-yellow/20 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="space-y-2">
                {currentTier.discount ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium text-sm sm:text-base">
                        Original price per ticket:
                      </span>
                      <span className="text-slate-400 line-through text-sm sm:text-base">
                        ₹{event.ticketPrice}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-green-300 font-medium text-sm sm:text-base">
                        {currentTier.name} price:
                      </span>
                      <span className="text-green-300 font-bold text-sm sm:text-base">
                        ₹{pricePerTicket}
                      </span>
                    </div>
                    <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-2">
                      <p className="text-green-400 text-xs text-center mt-1">
                        Total savings: ₹
                        {(event.ticketPrice - pricePerTicket) * quantity}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium text-sm sm:text-base">
                      Price per ticket:
                    </span>
                    <span className="text-white font-medium text-sm sm:text-base">
                      ₹{pricePerTicket}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium text-sm sm:text-base">
                    Quantity:
                  </span>
                  <span className="text-white font-medium text-sm sm:text-base">
                    {quantity}
                  </span>
                </div>
                <div className="border-t border-slate-600/50 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-medium text-sm sm:text-base">
                      Total Amount:
                    </span>
                    <span className="text-white font-bold text-xl sm:text-2xl">
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4 sm:mb-6">
              <label className="block text-slate-300 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                Number of Tickets
              </label>

              <div className="flex items-center justify-center gap-3 sm:gap-4">
                <motion.button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center font-bold text-base sm:text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  -
                </motion.button>

                <div className="bg-slate-700/50 rounded-lg px-4 sm:px-6 py-2 sm:py-3 min-w-[60px] sm:min-w-[80px] text-center">
                  <span className="text-white font-bold text-lg sm:text-xl">
                    {quantity}
                  </span>
                </div>

                <motion.button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center font-bold text-base sm:text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="mb-4 sm:mb-6">
              <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 rounded border-slate-600 bg-slate-700 text-navratri-orange focus:ring-navratri-orange/30"
                />
                <span className="text-slate-300 text-xs sm:text-sm">
                  I agree to the <Link to="/terms-of-service" className="text-blue-500 underline">Terms and conditions</Link> and understand that
                  tickets are non-transferable.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={() => setShowConfirm(true)}
                disabled={isProcessing || quantity === 0 || !agreedToTerms}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue to Purchase
              </motion.button>

              <motion.button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </div>
          </div>
        ) : (
          // Confirmation Screen
          <div className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl mb-3">✅</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Confirm Purchase
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Please review your order
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-slate-700/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-400">Event:</span>
                <span className="text-white font-medium">{event.name}</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-400">Venue:</span>
                <span className="text-white font-medium">{event.venue}</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-400">Quantity:</span>
                <span className="text-white font-medium">
                  {quantity} ticket(s)
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-400">Price per ticket:</span>
                <span className="text-white font-medium">
                  ₹{pricePerTicket}
                </span>
              </div>

              {currentTier.discount && (
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-slate-400">Pricing tier:</span>
                  <span className="text-green-400 font-medium">
                    {currentTier.name}
                  </span>
                </div>
              )}

              <div className="border-t border-slate-600 pt-2 sm:pt-3">
                <div className="flex justify-between">
                  <span className="text-white font-bold text-sm sm:text-base">
                    Total Amount:
                  </span>
                  <span className="text-navratri-yellow font-bold text-lg sm:text-xl">
                    ₹{totalAmount}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h4 className="text-green-300 font-medium mb-2 text-sm sm:text-base">
                💳 Payment Process:
              </h4>
              <ul className="text-green-200 text-xs sm:text-sm space-y-1">
                <li>• Secure payment processing</li>
                <li>• Instant ticket generation after payment</li>
                <li>• QR codes will be available immediately</li>
                <li>• Email confirmation will be sent</li>
              </ul>
            </div>

            {/* Final Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>🎉 Confirm Purchase</>
                )}
              </motion.button>

              <motion.button
                onClick={() => setShowConfirm(false)}
                disabled={isProcessing}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>
            </div>

            {/* Security Notice */}
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-slate-500 text-xs">
                🔒 Your payment is secured with industry-standard encryption
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PurchaseTicketModal;