import React from 'react';
import { motion } from 'framer-motion';

const EventFormFields = ({ formData, onChange, errors = {} }) => {
  const fieldVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const InputField = ({ 
    type = "text", 
    name, 
    placeholder, 
    icon, 
    value, 
    required = false,
    min,
    step,
    rows 
  }) => (
    <motion.div
      variants={fieldVariants}
      className="space-y-2"
    >
      <label className="flex items-center gap-2 text-slate-300 font-medium text-sm">
        <span className="text-lg">{icon}</span>
        {placeholder}
        {required && <span className="text-red-400">*</span>}
      </label>
      
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            name={name}
            placeholder={`Enter ${placeholder.toLowerCase()}...`}
            value={value}
            onChange={onChange}
            rows={rows || 4}
            className={`w-full px-4 py-3 bg-slate-700/50 backdrop-blur-xl border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
              errors[name] 
                ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                : 'border-slate-600/30 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-500/50'
            }`}
          />
        ) : (
          <input
            type={type}
            name={name}
            placeholder={`Enter ${placeholder.toLowerCase()}...`}
            value={value}
            onChange={onChange}
            min={min}
            step={step}
            className={`w-full px-4 py-3 bg-slate-700/50 backdrop-blur-xl border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
              errors[name] 
                ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' 
                : 'border-slate-600/30 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-500/50'
            }`}
          />
        )}
        
        {/* Error indicator */}
        {errors[name] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <span className="text-red-400 text-lg">⚠️</span>
          </motion.div>
        )}
      </div>
      
      {/* Error message */}
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm flex items-center gap-1"
        >
          <span className="text-xs">⚠️</span>
          {errors[name]}
        </motion.p>
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="space-y-6"
    >
      {/* Section: Basic Information */}
      <motion.div
        variants={fieldVariants}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📝</span>
          <h3 className="text-xl font-bold text-white">Basic Information</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InputField
            name="name"
            placeholder="Event Name"
            icon="🎪"
            value={formData.name || ''}
            required
          />
          
          <InputField
            name="venue"
            placeholder="Venue Location"
            icon="📍"
            value={formData.venue || ''}
            required
          />
        </div>
        
        <InputField
          type="textarea"
          name="description"
          placeholder="Event Description"
          icon="📋"
          value={formData.description || ''}
          rows={4}
        />
      </motion.div>

      {/* Section: Date & Time */}
      <motion.div
        variants={fieldVariants}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🗓️</span>
          <h3 className="text-xl font-bold text-white">Date & Time</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InputField
            type="date"
            name="date"
            placeholder="Event Date"
            icon="📅"
            value={formData.date || ''}
            required
          />
          
          <InputField
            type="time"
            name="startTime"
            placeholder="Start Time"
            icon="🕐"
            value={formData.startTime || ''}
          />
          
          <InputField
            type="time"
            name="endTime"
            placeholder="End Time"
            icon="🕕"
            value={formData.endTime || ''}
          />
        </div>
      </motion.div>

      {/* Section: Ticketing */}
      <motion.div
        variants={fieldVariants}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🎫</span>
          <h3 className="text-xl font-bold text-white">Ticketing Information</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            type="number"
            name="ticketPrice"
            placeholder="Ticket Price"
            icon="💰"
            value={formData.ticketPrice || ''}
            min="0"
            step="0.01"
          />
          
          <InputField
            type="number"
            name="totalTickets"
            placeholder="Total Tickets Available"
            icon="🎟️"
            value={formData.totalTickets || ''}
            min="1"
          />
        </div>
      </motion.div>

      {/* Additional Fields Section */}
      <motion.div
        variants={fieldVariants}
        className="space-y-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">⚙️</span>
          <h3 className="text-xl font-bold text-white">Additional Details</h3>
          <div className="flex-1 h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            name="category"
            placeholder="Event Category"
            icon="🏷️"
            value={formData.category || ''}
          />
          
          <InputField
            type="number"
            name="capacity"
            placeholder="Maximum Capacity"
            icon="👥"
            value={formData.capacity || ''}
            min="1"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            name="organizer"
            placeholder="Event Organizer"
            icon="🎭"
            value={formData.organizer || ''}
          />
          
          <InputField
            name="contactEmail"
            placeholder="Contact Email"
            icon="📧"
            value={formData.contactEmail || ''}
            type="email"
          />
        </div>
      </motion.div>

      {/* Help Text */}
      <motion.div
        variants={fieldVariants}
        className="bg-slate-600/30 backdrop-blur-xl rounded-xl p-4 border border-slate-500/30 mt-8"
      >
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <div className="space-y-2">
            <h4 className="text-white font-medium">Quick Tips:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>• Fields marked with <span className="text-red-400">*</span> are required</li>
              <li>• Use clear, descriptive names for better discoverability</li>
              <li>• Add detailed descriptions to help attendees understand your event</li>
              <li>• Double-check date and time information before submitting</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EventFormFields;