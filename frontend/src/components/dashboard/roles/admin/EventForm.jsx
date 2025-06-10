import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import EventFormFields from './EventFormFields';
import ConfirmModal from './ConfirmModal';

const EventForm = ({ mode, eventData }) => {
  const [formData, setFormData] = useState(eventData || {});
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Add your validation logic here
    if (!formData.title?.trim()) {
      newErrors.title = 'Event title is required';
    }
    if (!formData.date) {
      newErrors.date = 'Event date is required';
    }
    if (!formData.venue?.trim()) {
      newErrors.venue = 'Event venue is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = '/api/event';
      if (mode === 'create') {
        await axios.post(endpoint, formData);
        toast.success('Event created successfully! 🎉');
      } else {
        await axios.put(endpoint, formData);
        toast.success('Event updated successfully! ✨');
      }
      
      // Small delay for better UX
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || 
        `Failed to ${mode === 'create' ? 'create' : 'update'} event`
      );
    } finally {
      setIsSubmitting(false);
      setShowModal(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      {/* Header Section */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.div
          className="text-5xl mb-4"
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        >
          {mode === 'edit' ? '✏️' : '🎯'}
        </motion.div>
        
        <h2 className="text-3xl md:text-4xl font-bold font-serif bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
          {mode === 'edit' ? 'Edit Your Event' : 'Create Amazing Event'}
        </h2>
        
        <motion.div 
          className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6"
          animate={{
            scaleX: [1, 1.3, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        
        <p className="text-slate-300 max-w-2xl mx-auto text-lg">
          {mode === 'edit' 
            ? 'Update your event details and make it even more spectacular!'
            : 'Fill in the details below to create an unforgettable experience for your attendees.'
          }
        </p>
      </motion.div>

      {/* Form Container */}
      <motion.div
        className="bg-slate-700/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/30 shadow-2xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {/* Form Fields */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <EventFormFields 
            formData={formData} 
            onChange={handleChange}
            errors={errors}
          />
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center pt-8 mt-8 border-t border-slate-600/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
            onClick={() => setShowModal(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <span className="text-xl">
                  {mode === 'edit' ? '💫' : '🚀'}
                </span>
                {mode === 'edit' ? 'Update Event' : 'Create Event'}
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 bg-slate-600/50 backdrop-blur-xl text-slate-300 font-medium rounded-xl border border-slate-500/30 hover:bg-slate-600/70 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            <span className="text-xl">↩️</span>
            Cancel
          </motion.button>
        </motion.div>

        {/* Helper Text */}
        <motion.div
          className="text-center mt-6 text-slate-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="flex items-center justify-center gap-2">
            <span>💡</span>
            Make sure all required fields are filled before submitting
          </p>
        </motion.div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute -top-4 -right-4 text-4xl opacity-20"
        animate={{ 
          rotate: [0, 360],
          y: [0, -10, 0]
        }}
        transition={{ 
          duration: 8,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        ✨
      </motion.div>

      <motion.div
        className="absolute -bottom-4 -left-4 text-3xl opacity-15"
        animate={{ 
          rotate: [0, -360],
          x: [0, 10, 0]
        }}
        transition={{ 
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        🎪
      </motion.div>

      {/* Confirmation Modal */}
      {showModal && (
        <ConfirmModal 
          mode={mode}
          formData={formData}
          onConfirm={handleSubmit} 
          onCancel={() => setShowModal(false)}
          isSubmitting={isSubmitting}
        />
      )}
    </motion.div>
  );
};

export default EventForm;