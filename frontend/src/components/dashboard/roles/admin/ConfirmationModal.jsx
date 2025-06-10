// File: ConfirmModal.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ConfirmModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 p-8 rounded-2xl shadow-lg text-center max-w-sm w-full"
      >
        <h3 className="text-xl font-semibold text-white mb-6">
          Are you sure you want to submit?
        </h3>
        <div className="flex justify-center gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-green-500/20 transition-all text-sm"
          >
            Yes
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-red-500/20 transition-all text-sm"
          >
            No
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfirmModal;
