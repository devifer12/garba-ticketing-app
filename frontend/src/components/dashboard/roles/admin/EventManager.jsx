import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { eventAPI, apiUtils } from "../../../../services/api";

// Move InputField component outside to prevent recreation on every render
const InputField = React.memo(
  ({
    type = "text",
    name,
    placeholder,
    icon,
    required = false,
    rows,
    min,
    step,
    value,
    onChange,
    error,
    accept,
  }) => (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-slate-300 font-medium text-sm">
        <span className="text-lg">{icon}</span>
        {placeholder}
        {required && <span className="text-red-400">*</span>}
      </label>

      <div className="relative">
        {type === "textarea" ? (
          <textarea
            name={name}
            placeholder={`Enter ${placeholder.toLowerCase()}...`}
            value={value || ""}
            onChange={onChange}
            rows={rows || 4}
            className={`w-full px-4 py-3 bg-slate-700/50 backdrop-blur-xl border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
              error
                ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500"
                : "border-slate-600/30 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-500/50"
            }`}
          />
        ) : type === "file" ? (
          <input
            type="file"
            name={name}
            accept={accept}
            onChange={onChange}
            className={`w-full px-4 py-3 bg-slate-700/50 backdrop-blur-xl border rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 focus:outline-none focus:ring-2 transition-all duration-300 ${
              error
                ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500"
                : "border-slate-600/30 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-500/50"
            }`}
          />
        ) : (
          <input
            type={type}
            name={name}
            placeholder={`Enter ${placeholder.toLowerCase()}...`}
            value={value || ""}
            onChange={onChange}
            min={min}
            step={step}
            className={`w-full px-4 py-3 bg-slate-700/50 backdrop-blur-xl border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
              error
                ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500"
                : "border-slate-600/30 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-500/50"
            }`}
          />
        )}

        {error && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <span className="text-red-400 text-lg">⚠️</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <span className="text-xs">⚠️</span>
          {error}
        </p>
      )}
    </div>
  )
);

const EventManager = () => {
  // Main state
  const [view, setView] = useState("loading"); // 'loading', 'create', 'preview', 'edit'
  const [event, setEvent] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form data state - Initialize with empty strings to prevent controlled/uncontrolled issues
  const [formData, setFormData] = useState({
    name: "",
    venue: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    ticketPrice: "",
    groupPrice4: "",
    totalTickets: "",
    eventImage: "",
    features: [],
    aboutText: "",
  });

  // Check if event exists on component mount
  useEffect(() => {
    const checkEventExists = async () => {
      try {
        setView("loading");
        console.log("🔍 Checking if event exists...");

        const existsRes = await eventAPI.checkEventExists();
        console.log("📋 Event exists response:", existsRes.data);

        if (existsRes.data.exists) {
          console.log("✅ Event exists, fetching details...");
          // Fetch event data
          const eventRes = await eventAPI.getCurrentEvent();
          console.log("📊 Event data:", eventRes.data);
          const eventData = eventRes.data.data;
          setEvent(eventData);
          setView("preview");
        } else {
          console.log("📝 No event exists, showing create form");
          setView("create");
        }
      } catch (error) {
        console.error("❌ Error checking event:", error);
        const errorMessage = apiUtils.formatErrorMessage(error);
        toast.error(`Failed to load event information: ${errorMessage}`);
        setView("create");
      }
    };

    checkEventExists();
  }, []);

  // Handle file input change - FIXED: Properly handle file upload
  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      console.log("📁 File selected:", {
        name: file.name,
        type: file.type,
        size: file.size,
      });

      // Validate file type immediately
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
        );
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("Image file size must be less than 5MB");
        return;
      }

      setImageFile(file);

      // Create preview and upload simultaneously
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target.result;
        console.log("Image data processed:", {
          dataType: typeof base64Data,
          startsWithData: base64Data.startsWith("data:"),
          length: base64Data.length,
          preview: base64Data.substring(0, 50),
        });

        setImagePreview(base64Data);

        // Store the base64 data
        setFormData((prevData) => ({
          ...prevData,
          eventImage: base64Data,
        }));

        // Clear any previous validation errors for eventImage
        if (errors.eventImage) {
          setErrors((prevErrors) => ({
            ...prevErrors,
            eventImage: null,
          }));
        }

        console.log("✅ Image processed successfully");
      };

      reader.onerror = () => {
        toast.error("Failed to process image");
      };

      reader.readAsDataURL(file);
    },
    [errors]
  );

  // Memoized form handlers to prevent recreation on every render
  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;

      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [name]: null,
        }));
      }
    },
    [errors]
  );

  // Handle features array separately
  const handleFeaturesChange = useCallback((e) => {
    const value = e.target.value;
    const featuresArray = value
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f);

    setFormData((prevData) => ({
      ...prevData,
      features: featuresArray,
    }));
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required field validations
    if (!formData.name?.trim()) newErrors.name = "Event name is required";
    if (!formData.date) newErrors.date = "Event date is required";
    if (!formData.venue?.trim()) newErrors.venue = "Event venue is required";
    if (!formData.description?.trim())
      newErrors.description = "Event description is required";
    if (!formData.startTime?.trim())
      newErrors.startTime = "Start time is required";
    if (!formData.endTime?.trim()) newErrors.endTime = "End time is required";

    // Numeric validations
    const ticketPrice = parseFloat(formData.ticketPrice);
    const groupPrice4 = parseFloat(formData.groupPrice4);
    const totalTickets = parseInt(formData.totalTickets);

    if (!formData.ticketPrice || isNaN(ticketPrice) || ticketPrice <= 0) {
      newErrors.ticketPrice =
        "Valid ticket price is required (must be greater than 0)";
    }
    if (!formData.groupPrice4 || isNaN(groupPrice4) || groupPrice4 <= 0) {
      newErrors.groupPrice4 =
        "Valid group price for 4+ tickets is required (must be greater than 0)";
    }
    if (!formData.totalTickets || isNaN(totalTickets) || totalTickets <= 0) {
      newErrors.totalTickets =
        "Valid total tickets count is required (must be greater than 0)";
    }

    // Date validation
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.date = "Event date cannot be in the past";
      }
    }

    // Time format validation (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (formData.startTime && !timeRegex.test(formData.startTime.trim())) {
      newErrors.startTime = "Start time must be in HH:MM format (e.g., 18:00)";
    }

    if (formData.endTime && !timeRegex.test(formData.endTime.trim())) {
      newErrors.endTime = "End time must be in HH:MM format (e.g., 22:00)";
    }

    // Time logic validation
    if (
      formData.startTime &&
      formData.endTime &&
      timeRegex.test(formData.startTime.trim()) &&
      timeRegex.test(formData.endTime.trim())
    ) {
      const [startHour, startMin] = formData.startTime
        .trim()
        .split(":")
        .map(Number);
      const [endHour, endMin] = formData.endTime.trim().split(":").map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        newErrors.endTime = "End time must be after start time";
      }
    }

    // Base64 image validation - check if it's a valid data URL
    if (formData.eventImage && formData.eventImage.trim()) {
      const base64ImageRegex = /^data:image\/(jpeg|jpg|png|gif|webp);base64,/i;
      const trimmedImage = formData.eventImage.trim();
      console.log("Frontend validation:", {
        hasImage: !!trimmedImage,
        startsWithData: trimmedImage.startsWith("data:image/"),
        regexTest: base64ImageRegex.test(trimmedImage),
        imageStart: trimmedImage.substring(0, 50),
      });

      if (!base64ImageRegex.test(trimmedImage)) {
        newErrors.eventImage =
          "Invalid image format. Please upload a valid image file.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare data for submission
      const submitData = {
        name: formData.name.trim(),
        venue: formData.venue.trim(),
        description: formData.description.trim(),
        date: formData.date,
        startTime: formData.startTime.trim(),
        endTime: formData.endTime.trim(),
        ticketPrice: parseFloat(formData.ticketPrice),
        groupPrice4: parseFloat(formData.groupPrice4),
        totalTickets: parseInt(formData.totalTickets),
        eventImage: formData.eventImage?.trim() || "", // This will be base64 data or empty
        features: Array.isArray(formData.features) ? formData.features : [],
        aboutText: formData.aboutText?.trim() || "",
      };

      console.log("📤 Submitting event data:", {
        ...submitData,
        eventImage: submitData.eventImage
          ? `[Base64 data: ${submitData.eventImage.length} chars]`
          : "No image",
      });

      let response;
      if (view === "create") {
        console.log("🆕 Creating new event...");
        response = await eventAPI.createEvent(submitData);
        toast.success("Event created successfully! 🎉");
      } else if (view === "edit") {
        console.log("✏️ Updating existing event...");
        response = await eventAPI.updateEvent(submitData);
        toast.success("Event updated successfully! ✨");
      }

      console.log("✅ Event operation successful:", response.data);

      // Reload to refresh data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("❌ Event operation failed:", err);
      console.error("Error details:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
        },
      });

      const errorMessage = apiUtils.formatErrorMessage(err);

      // Handle validation errors specifically
      if (
        err.response?.data?.details &&
        Array.isArray(err.response.data.details)
      ) {
        const validationErrors = {};
        err.response.data.details.forEach((detail) => {
          if (detail.field) {
            validationErrors[detail.field] = detail.message;
          }
        });
        setErrors(validationErrors);
        toast.error("Please fix the validation errors");
      } else {
        toast.error(
          `Failed to ${
            view === "create" ? "create" : "update"
          } event: ${errorMessage}`
        );
      }
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  const handleEdit = () => {
    // Populate form with existing event data
    setFormData({
      name: event.name || "",
      venue: event.venue || "",
      description: event.description || "",
      date: event.date ? event.date.split("T")[0] : "",
      startTime: event.startTime || "",
      endTime: event.endTime || "",
      ticketPrice: event.ticketPrice?.toString() || "",
      groupPrice4: event.groupPrice4?.toString() || "",
      totalTickets: event.totalTickets?.toString() || "",
      eventImage: event.eventImage || "",
      features: event.features || [],
      aboutText: event.aboutText || "",
    });

    // Set image preview if exists
    if (event.eventImage) {
      setImagePreview(event.eventImage);
    }

    setView("edit");
  };

  // Utility functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    try {
      const [hours, minutes] = timeString.split(":");
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return timeString;
    }
  };

  // Confirmation Modal Component
  const ConfirmModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 p-8 rounded-2xl shadow-lg text-center max-w-sm w-full">
        <h3 className="text-xl font-semibold text-white mb-6">
          Are you sure you want to {view === "create" ? "create" : "update"}{" "}
          this event?
        </h3>
        <div className="flex justify-center gap-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-green-500/20 transition-all text-sm disabled:opacity-50">
            {isSubmitting ? "Processing..." : "Yes"}
          </button>
          <button
            onClick={() => setShowConfirmModal(false)}
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-red-500/20 transition-all text-sm disabled:opacity-50">
            No
          </button>
        </div>
      </motion.div>
    </div>
  );

  // Loading view
  if (view === "loading") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-6">🎪</div>
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Loading Event Manager
            </h2>
            <p className="text-slate-400">
              Please wait while we fetch event information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Event Preview view
  if (view === "preview" && event) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold font-serif bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent mb-4">
              Event Preview
            </h1>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full mx-auto mb-6"></div>
          </div>

          {/* Event Card */}
          <div className="bg-slate-700/30 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/30">
            {/* Event Title */}
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-4">
                {event.name}
              </h2>
            </div>

            {/* Event Image */}
            {event.eventImage && (
              <div className="mb-8 text-center">
                <img
                  src={event.eventImage}
                  alt={event.name}
                  className="max-w-md mx-auto rounded-xl shadow-lg"
                />
              </div>
            )}

            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Description */}
              <div className="bg-slate-600/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📋</span>
                  <h3 className="text-xl font-bold text-white">Description</h3>
                </div>
                <p className="text-slate-300">
                  {event.description || "No description provided"}
                </p>
              </div>

              {/* Date & Time */}
              <div className="bg-slate-600/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/30">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📅</span>
                  <h3 className="text-xl font-bold text-white">Date & Time</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-300 text-lg font-medium">
                    {formatDate(event.date)}
                  </p>
                  {event.startTime && (
                    <p className="text-slate-400">
                      🕐 {formatTime(event.startTime)}
                      {event.endTime && ` - ${formatTime(event.endTime)}`}
                    </p>
                  )}
                </div>
              </div>

              {/* Venue */}
              <div className="bg-slate-600/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-500/30 md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📍</span>
                  <h3 className="text-xl font-bold text-white">Venue</h3>
                </div>
                <p className="text-slate-300 text-lg">{event.venue}</p>
              </div>
            </div>

            {/* Ticket Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-green-900/30 backdrop-blur-xl rounded-xl p-4 border border-green-700/30 text-center">
                <span className="text-2xl block mb-2">💰</span>
                <p className="text-green-300 font-medium">Individual Price</p>
                <p className="text-white text-xl font-bold">
                  ₹{event.ticketPrice}
                </p>
                <p className="text-green-200 text-xs mt-1">1-3 tickets</p>
              </div>

              <div className="bg-orange-900/30 backdrop-blur-xl rounded-xl p-4 border border-orange-700/30 text-center">
                <span className="text-2xl block mb-2">👥</span>
                <p className="text-orange-300 font-medium">Group Price (4+)</p>
                <p className="text-white text-xl font-bold">
                  ₹{event.groupPrice4}
                </p>
              </div>
            </div>

            {/* Features */}
            {event.features && event.features.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">✨</span>
                  <h3 className="text-xl font-bold text-white">Features</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {event.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm border border-purple-700/30">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About Text */}
            {event.aboutText && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">📖</span>
                  <h3 className="text-xl font-bold text-white">About</h3>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {event.aboutText}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-slate-600/30">
              <button
                onClick={handleEdit}
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-yellow-500/25 transition-all duration-300 flex items-center justify-center gap-3 text-lg">
                <span className="text-xl">✏️</span>
                Edit Event Details
              </button>

              <button
                onClick={() => window.history.back()}
                className="px-8 py-4 bg-slate-600/50 backdrop-blur-xl text-slate-300 font-medium rounded-xl border border-slate-500/30 hover:bg-slate-600/70 transition-all duration-300 flex items-center justify-center gap-3 text-lg">
                <span className="text-xl">🏠</span>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Form view (create or edit)
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{view === "edit" ? "✏️" : "🎯"}</div>
          <h1 className="text-4xl font-bold font-serif bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-4">
            {view === "edit" ? "Edit Your Event" : "Create Amazing Event"}
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mx-auto mb-6"></div>
          <p className="text-slate-300 max-w-2xl mx-auto text-lg">
            {view === "edit"
              ? "Update your event details and make it even more spectacular!"
              : "Fill in the details below to create an unforgettable experience for your attendees."}
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-slate-700/40 backdrop-blur-xl rounded-2xl p-8 border border-slate-600/30">
          <div className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📝</span>
                <h3 className="text-xl font-bold text-white">
                  Basic Information
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InputField
                  name="name"
                  placeholder="Event Name"
                  icon="🎪"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  error={errors.name}
                />

                <InputField
                  name="venue"
                  placeholder="Venue Location"
                  icon="📍"
                  required
                  value={formData.venue}
                  onChange={handleInputChange}
                  error={errors.venue}
                />
              </div>

              <InputField
                type="textarea"
                name="description"
                placeholder="Event Description"
                icon="📋"
                rows={4}
                required
                value={formData.description}
                onChange={handleInputChange}
                error={errors.description}
              />
            </div>

            {/* Date & Time */}
            <div className="space-y-6">
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
                  required
                  value={formData.date}
                  onChange={handleInputChange}
                  error={errors.date}
                />

                <InputField
                  type="time"
                  name="startTime"
                  placeholder="Start Time"
                  icon="🕐"
                  required
                  value={formData.startTime}
                  onChange={handleInputChange}
                  error={errors.startTime}
                />

                <InputField
                  type="time"
                  name="endTime"
                  placeholder="End Time"
                  icon="🕕"
                  required
                  value={formData.endTime}
                  onChange={handleInputChange}
                  error={errors.endTime}
                />
              </div>
            </div>

            {/* Ticketing */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🎫</span>
                <h3 className="text-xl font-bold text-white">
                  Ticketing Information
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <InputField
                  type="number"
                  name="ticketPrice"
                  placeholder="Individual Price (₹)"
                  icon="💰"
                  min="0"
                  step="1"
                  required
                  value={formData.ticketPrice}
                  onChange={handleInputChange}
                  error={errors.ticketPrice}
                />

                <InputField
                  type="number"
                  name="groupPrice4"
                  placeholder="Group Price (4+) (₹)"
                  icon="👥"
                  min="0"
                  step="1"
                  required
                  value={formData.groupPrice4}
                  onChange={handleInputChange}
                  error={errors.groupPrice4}
                />

                <InputField
                  type="number"
                  name="totalTickets"
                  placeholder="Total Tickets Available"
                  icon="🎟️"
                  min="1"
                  required
                  value={formData.totalTickets}
                  onChange={handleInputChange}
                  error={errors.totalTickets}
                />
              </div>

              {/* Pricing Information */}
              <div className="bg-slate-600/30 rounded-xl p-4 border border-slate-500/30">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  Pricing Tiers Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-slate-300 font-medium">
                      Individual (1-3 tickets)
                    </p>
                    <p className="text-slate-400 text-xs">
                      Standard price per ticket
                    </p>
                  </div>
                  <div className="bg-slate-700/40 rounded-lg p-3">
                    <p className="text-slate-300 font-medium">Group 4+</p>
                    <p className="text-slate-400 text-xs">
                      Discounted price for groups
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚙️</span>
                <h3 className="text-xl font-bold text-white">
                  Additional Details
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-orange-500/50 to-transparent"></div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {/* Event Image Upload */}
                <div className="space-y-4">
                  <InputField
                    type="file"
                    name="eventImage"
                    placeholder="Event Image"
                    icon="🖼️"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    error={errors.eventImage}
                  />

                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-slate-300 text-sm mb-2">
                        Image Preview:
                      </p>
                      <img
                        src={imagePreview}
                        alt="Event preview"
                        className="max-w-xs rounded-lg shadow-lg"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-slate-300 font-medium text-sm">
                    <span className="text-lg">✨</span>
                    Event Features (comma separated)
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      name="features"
                      placeholder="Enter features separated by commas..."
                      value={
                        Array.isArray(formData.features)
                          ? formData.features.join(", ")
                          : ""
                      }
                      onChange={handleFeaturesChange}
                      className="w-full px-4 py-3 bg-slate-700/50 backdrop-blur-xl border border-slate-600/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 hover:border-slate-500/50 transition-all duration-300"
                    />
                  </div>
                </div>

                <InputField
                  type="textarea"
                  name="aboutText"
                  placeholder="About the Event (optional)"
                  icon="📖"
                  rows={3}
                  value={formData.aboutText}
                  onChange={handleInputChange}
                  error={errors.aboutText}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 mt-8 border-t border-slate-600/30">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={isSubmitting}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <span className="text-xl">
                    {view === "edit" ? "💫" : "🚀"}
                  </span>
                  {view === "edit" ? "Update Event" : "Create Event"}
                </>
              )}
            </button>

            <button
              onClick={() =>
                view === "edit" ? setView("preview") : window.history.back()
              }
              disabled={isSubmitting}
              className="px-8 py-4 bg-slate-600/50 backdrop-blur-xl text-slate-300 font-medium rounded-xl border border-slate-500/30 hover:bg-slate-600/70 transition-all duration-300 flex items-center justify-center gap-3 text-lg">
              <span className="text-xl">↩️</span>
              {view === "edit" ? "Cancel" : "Back"}
            </button>
          </div>

          {/* Helper Text */}
          <div className="text-center mt-6 text-slate-400 text-sm">
            <p className="flex items-center justify-center gap-2">
              <span>💡</span>
              Make sure all required fields are filled before submitting
            </p>
            <p className="mt-2 text-xs">
              Supported image formats: JPEG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && <ConfirmModal />}
    </div>
  );
};

export default EventManager;
