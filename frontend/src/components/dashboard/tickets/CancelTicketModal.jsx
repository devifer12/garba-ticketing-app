import React, { useState } from "react";
import { motion } from "framer-motion";
import { formatDate } from "../../../utils/helpers";

const CancelTicketModal = ({
  ticket,
  event,
  onClose,
  onCancel,
  cancelling,
}) => {
  const [reason, setReason] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);

  const handleCancel = () => {
    if (!reason.trim()) {
      return;
    }
    onCancel(ticket.id, reason.trim());
  };

  const calculateDaysUntilEvent = () => {
    if (!event?.date) return 0;
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    return Math.ceil((eventDate - currentDate) / (1000 * 60 * 60 * 24));
  };

  const daysUntilEvent = calculateDaysUntilEvent();
  const canCancel = daysUntilEvent >= 10;

  if (!ticket || !event) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {!showConfirm ? (
          // Cancellation Form
          <div className="p-4 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <div className="text-3xl sm:text-4xl mb-3">❌</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Cancel Ticket
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                Ticket #{ticket.ticketId?.slice(-8) || "Unknown"}
              </p>
            </div>

            {/* Ticket Details */}
            <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Event:</span>
                  <span className="text-white font-medium">{event.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-white font-medium">
                    {formatDate(event.date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price:</span>
                  <span className="text-white font-medium">
                    ₹{ticket.price}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-300 font-medium">
                    {ticket.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Policy Check */}
            {!canCancel ? (
              <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                  <span>⚠️</span>
                  <span className="font-medium">Cancellation Not Allowed</span>
                </div>
                <p className="text-red-300 text-xs sm:text-sm">
                  Tickets can only be cancelled at least 10 days before the
                  event. Only {daysUntilEvent} days remaining until the event.
                </p>
              </div>
            ) : (
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                  <span>✅</span>
                  <span className="font-medium">Cancellation Allowed</span>
                </div>
                <p className="text-green-300 text-xs sm:text-sm">
                  {daysUntilEvent} days remaining until the event. You can
                  cancel this ticket.
                </p>
              </div>
            )}

            {canCancel && (
              <>
                {/* Cancellation Reason */}
                <div className="mb-4 sm:mb-6">
                  <label className="block text-slate-300 font-medium mb-2 sm:mb-3 text-sm sm:text-base">
                    Reason for Cancellation *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a reason for cancelling your ticket..."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none text-sm sm:text-base"
                    rows={4}
                    maxLength={500}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-red-400 text-xs">
                      {!reason.trim() && "Reason is required"}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {reason.length}/500
                    </span>
                  </div>
                </div>

                {/* Refund Information */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <h4 className="text-blue-300 font-medium mb-2 text-sm sm:text-base">
                    💳 Refund Information:
                  </h4>
                  <ul className="text-blue-200 text-xs sm:text-sm space-y-1">
                    <li>• Refund will be initiated automatically via PhonePe</li>
                    <li>• Processing fees of ₹40 will be deducted</li>
                    <li>• Refund will be processed within 5-7 business days</li>
                    <li>
                      • Amount will be credited to your original payment method
                    </li>
                    <li>• You will receive a confirmation email</li>
                    <li>• Refund amount: ₹{Math.max(1, ticket.price - 40)} (after fees)</li>
                  </ul>
                </div>

                {/* Policy Agreement */}
                <div className="mb-4 sm:mb-6">
                  <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToPolicy}
                      onChange={(e) => setAgreedToPolicy(e.target.checked)}
                      className="mt-1 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500/30"
                    />
                    <span className="text-slate-300 text-xs sm:text-sm">
                      I understand that this cancellation is final and I agree
                      to the refund policy. The ticket will be permanently
                      cancelled.
                    </span>
                  </label>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              {canCancel ? (
                <motion.button
                  onClick={() => setShowConfirm(true)}
                  disabled={cancelling || !reason.trim() || !agreedToPolicy}
                  className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-lg shadow-lg hover:shadow-red-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue Cancellation
                </motion.button>
              ) : (
                <div className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-600/50 text-red-200 font-bold rounded-lg border border-red-500/30 text-sm sm:text-base text-center">
                  Cannot Cancel
                </div>
              )}

              <motion.button
                onClick={onClose}
                disabled={cancelling}
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
              <div className="text-3xl sm:text-4xl mb-3">⚠️</div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Confirm Cancellation
              </h2>
              <p className="text-slate-400 text-sm sm:text-base">
                This action cannot be undone
              </p>
            </div>

            {/* Final Summary */}
            <div className="bg-slate-700/50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-400">Ticket ID:</span>
                <span className="text-white font-medium font-mono">
                  #{ticket.ticketId?.slice(-8) || "Unknown"}
                </span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-400">Event:</span>
                <span className="text-white font-medium">{event.name}</span>
              </div>

              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-slate-400">Refund Amount:</span>
                <span className="text-green-400 font-bold">
                  ₹{ticket.price}
                </span>
              </div>

              <div className="border-t border-slate-600/50 pt-2 sm:pt-3">
                <div className="text-sm sm:text-base">
                  <span className="text-slate-400">Reason:</span>
                  <p className="text-white mt-1 bg-slate-600/30 rounded p-2 text-xs sm:text-sm">
                    {reason}
                  </p>
                </div>
              </div>
            </div>

            {/* Final Warning */}
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <h4 className="text-red-300 font-medium mb-2 text-sm sm:text-base">
                ⚠️ Final Warning:
              </h4>
              <ul className="text-red-200 text-xs sm:text-sm space-y-1">
                <li>• This ticket will be permanently cancelled</li>
                <li>
                  • You will not be able to attend the event with this ticket
                </li>
                <li>• Refund processing will begin immediately</li>
                <li>• This action cannot be reversed</li>
              </ul>
            </div>

            {/* Final Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-700 to-red-600 text-white font-bold rounded-lg shadow-lg hover:shadow-red-600/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {cancelling ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-t-2 border-b-2 border-white"></div>
                    Cancelling...
                  </>
                ) : (
                  <>❌ Confirm Cancellation</>
                )}
              </motion.button>

              <motion.button
                onClick={() => setShowConfirm(false)}
                disabled={cancelling}
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
                🔒 Your refund will be processed securely
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CancelTicketModal;