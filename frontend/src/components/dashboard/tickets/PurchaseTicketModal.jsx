import React, { useState } from 'react';
import { motion } from 'framer-motion';

const PurchaseTicketModal = ({ event, onClose, onPurchase, purchasing }) => {
  const [quantity, setQuantity] = useState(1);
  const [showConfirm, setShowConfirm] = useState(false);

  const maxQuantity = Math.min(10, event?.availableTickets || 0);
  const totalAmount = (event?.ticketPrice || 0) * quantity;

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handlePurchase = () => {
    if (quantity > 0 && quantity <= maxQuantity) {
      onPurchase(quantity);
      setShowConfirm(false);
    }
  };

  if (!event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl max-w-md w-full"
      >
        {!showConfirm ? (
          // Purchase Form
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🎫</div>
              <h2 className="text-2xl font-bold text-white mb-2">Purchase Tickets</h2>
              <p className="text-slate-400">{event.name}</p>
            </div>

            {/* Event Details */}
            <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Price per ticket:</span>
                  <p className="text-white font-bold">₹{event.ticketPrice}</p>
                </div>
                <div>
                  <span className="text-slate-400">Available:</span>
                  <p className="text-white font-bold">{event.availableTickets}</p>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-slate-300 font-medium mb-3">
                Number of Tickets
              </label>
              
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center font-bold text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  -
                </motion.button>
                
                <div className="bg-slate-700/50 rounded-lg px-6 py-3 min-w-[80px] text-center">
                  <span className="text-white font-bold text-xl">{quantity}</span>
                </div>
                
                <motion.button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={quantity >= maxQuantity}
                  className="w-10 h-10 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center font-bold text-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  +
                </motion.button>
              </div>
              
              <p className="text-slate-400 text-sm text-center mt-2">
                Maximum {maxQuantity} tickets per purchase
              </p>
            </div>

            {/* Total Amount */}
            <div className="bg-gradient-to-r from-navratri-orange/20 to-navratri-yellow/20 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-medium">Total Amount:</span>
                <span className="text-white font-bold text-2xl">₹{totalAmount}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={() => setShowConfirm(true)}
                disabled={purchasing || quantity === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-navratri-orange to-navratri-yellow text-slate-900 font-bold rounded-lg shadow-lg hover:shadow-navratri-orange/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue to Purchase
              </motion.button>
              
              <motion.button
                onClick={onClose}
                disabled={purchasing}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        ) : (
          // Confirmation Screen
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-2xl font-bold text-white mb-2">Confirm Purchase</h2>
              <p className="text-slate-400">Please review your order</p>
            </div>

            {/* Order Summary */}
            <div className="bg-slate-700/50 rounded-xl p-6 mb-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Event:</span>
                <span className="text-white font-medium">{event.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <span className="text-white font-medium">{quantity} ticket(s)</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-400">Price per ticket:</span>
                <span className="text-white font-medium">₹{event.ticketPrice}</span>
              </div>
              
              <div className="border-t border-slate-600 pt-3">
                <div className="flex justify-between">
                  <span className="text-white font-bold">Total Amount:</span>
                  <span className="text-navratri-yellow font-bold text-xl">₹{totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
              <h4 className="text-blue-300 font-medium mb-2">📋 Important Notes:</h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>• Each ticket will have a unique QR code</li>
                <li>• QR codes will be generated instantly</li>
                <li>• You can download and print your tickets</li>
                <li>• Tickets can be cancelled before the event</li>
              </ul>
            </div>

            {/* Final Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                onClick={handlePurchase}
                disabled={purchasing}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {purchasing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    🎉 Confirm Purchase
                  </>
                )}
              </motion.button>
              
              <motion.button
                onClick={() => setShowConfirm(false)}
                disabled={purchasing}
                className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Back
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PurchaseTicketModal;