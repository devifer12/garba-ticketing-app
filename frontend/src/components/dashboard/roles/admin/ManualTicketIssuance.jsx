import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { adminAPI, eventAPI, apiUtils } from "../../../../services/api";
import { toast } from "react-toastify";
import { formatDate, formatTime } from "../../../../utils/helpers";
import { useNavigate } from "react-router-dom";

const ManualTicketIssuance = ({ userRole }) => {
  const [users, setUsers] = useState([]);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
  });
  const [ticketNames, setTicketNames] = useState([]);
  const [showNameFields, setShowNameFields] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    paymentDone: false,
    notes: "",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [issuedTickets, setIssuedTickets] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch users and event data in parallel
      const [usersResponse, eventResponse] = await Promise.all([
        adminAPI.getAllUsers({ limit: 100, role: "guest" }).catch(() => ({ data: { users: [] } })),
        eventAPI.getCurrentEvent().catch(() => ({ data: { data: null } }))
      ]);

      setUsers(usersResponse.data.users || []);
      setEvent(eventResponse.data.data);
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.role === "guest" && (
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.name);
    setIsNewUser(false);
    setNewUserData({ name: "", email: "" });
  };

  const handleNewUserToggle = () => {
    setIsNewUser(!isNewUser);
    setSelectedUser(null);
    setSearchTerm("");
    setNewUserData({ name: "", email: "" });
  };

  const handleNewUserDataChange = (field, value) => {
    setNewUserData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // When quantity changes, adjust ticket names array
    if (field === 'quantity') {
      const newQuantity = parseInt(value) || 1;
      // Reset individual names when quantity changes
      if (showNameFields) {
        setTicketNames(Array(newQuantity).fill(""));
      }
    }
  };

  const handleTicketNameChange = (index, name) => {
    setTicketNames(prev => {
      const newNames = [...prev];
      newNames[index] = name;
      return newNames;
    });
  };

  const addMoreNames = () => {
    setShowNameFields(true);
    // Initialize ticket names array with empty strings
    setTicketNames(Array(formData.quantity).fill(""));
  };

  const calculateTotalAmount = () => {
    if (!event || !formData.quantity) return 0;
    const pricePerTicket = formData.quantity >= 4 ? 
      (event.groupPrice4 || event.ticketPrice) : 
      event.ticketPrice;
    return pricePerTicket * formData.quantity;
  };

  const handleSubmit = async () => {
    if (!selectedUser && !isNewUser) {
      toast.error("Please select a user or create a new one");
      return;
    }

    if (isNewUser) {
      if (!newUserData.name.trim() || !newUserData.email.trim()) {
        toast.error("Please enter both name and email for new user");
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newUserData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (!selectedUser && !isNewUser) {
      toast.error("Please select a user or create a new one");
      return;
    }

    if (!formData.quantity || formData.quantity < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    try {
      setIssuing(true);

      const ticketData = {
        ...(selectedUser ? { userId: selectedUser._id } : {}),
        ...(isNewUser ? { 
          userName: newUserData.name.trim(), 
          userEmail: newUserData.email.trim() 
        } : {}),
        quantity: parseInt(formData.quantity),
        paymentDone: formData.paymentDone,
        notes: formData.notes.trim(),
        ticketNames: showNameFields ? ticketNames.filter(name => name.trim()) : [],
      };

      const response = await adminAPI.issueManualTickets(ticketData);

      if (response.data.success) {
        setIssuedTickets(response.data);
        setShowSuccessModal(true);
        setShowConfirm(false);
        
        toast.success(`🎉 ${formData.quantity} ticket(s) issued successfully for ${response.data.user.name}!`);
      }
    } catch (error) {
      console.error("Failed to issue tickets:", error);
      const errorMessage = apiUtils.formatErrorMessage(error);
      toast.error(`Failed to issue tickets: ${errorMessage}`);
    } finally {
      setIssuing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!issuedTickets?.tickets) return;

    try {
      setDownloadingPDF(true);
      
      const ticketIds = issuedTickets.tickets.map(ticket => ticket.id);
      const response = await adminAPI.generateTicketPDF(ticketIds);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `garba-tickets-${issuedTickets.user.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("📄 PDF tickets downloaded successfully!");
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast.error("Failed to download PDF tickets");
    } finally {
      setDownloadingPDF(false);
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    setSearchTerm("");
    setIsNewUser(false);
    setNewUserData({ name: "", email: "" });
    setFormData({
      quantity: 1,
      paymentDone: false,
      notes: "",
    });
    setTicketNames([]);
    setShowNameFields(false);
    setIssuedTickets(null);
    setShowSuccessModal(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Manual Ticket Issuance</h2>
            <p className="text-slate-400">Please wait while we fetch user data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎪</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Event Found</h2>
            <p className="text-slate-400">Please create an event first before issuing tickets.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-6xl mb-4">🎫</div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-orange-500 via-yellow-500 to-red-500 bg-clip-text text-transparent mb-4">
            Manual Ticket Issuance
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mx-auto mb-6"></div>
          <p className="text-slate-300 text-lg">
            Issue tickets manually for offline payments (cash/direct UPI)
          </p>
        </motion.div>

        {/* Event Information */}
        <div className="bg-slate-700/30 rounded-xl p-6 mb-8 border border-slate-600/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🎪</span>
            Event Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-slate-400 text-sm">Event</p>
              <p className="text-white font-bold">{event.name}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Date</p>
              <p className="text-white font-bold">{formatDate(event.date)}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-400 text-sm">Available Tickets</p>
              <p className="text-green-400 font-bold">{event.availableTickets || 0}</p>
            </div>
          </div>
        </div>

        {!showConfirm ? (
          // Issuance Form
          <div className="space-y-6">
            {/* User Selection */}
            <div className="space-y-4">
              <label className="block text-slate-300 font-medium text-lg">
                <span className="text-2xl mr-2">👤</span>
                Select or Create Guest User
              </label>
              
              {/* Toggle between existing and new user */}
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => {
                    setIsNewUser(false);
                    setSelectedUser(null);
                    setSearchTerm("");
                  }}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    !isNewUser 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  Existing User
                </button>
                <button
                  onClick={handleNewUserToggle}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isNewUser 
                      ? 'bg-green-600 text-white' 
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  New User
                </button>
              </div>

              {!isNewUser ? (
                // Existing User Selection
                <>
                  {/* Search Input */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setSelectedUser(null);
                      }}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                    
                    {/* User Dropdown */}
                    {searchTerm && !selectedUser && filteredUsers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-10">
                        {filteredUsers.slice(0, 10).map((user) => (
                          <motion.div
                            key={user._id}
                            className="p-4 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/30 last:border-b-0"
                            onClick={() => handleUserSelect(user)}
                            whileHover={{ backgroundColor: "rgba(51, 65, 85, 0.5)" }}
                          >
                            <div className="flex items-center gap-3">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                                  {user.name?.charAt(0) || 'U'}
                                </div>
                              )}
                              <div>
                                <p className="text-white font-medium">{user.name}</p>
                                <p className="text-slate-400 text-sm">{user.email}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected User Display */}
                  {selectedUser && (
                    <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-green-400 text-xl">✅</span>
                        <div>
                          <p className="text-white font-medium">Selected: {selectedUser.name}</p>
                          <p className="text-green-300 text-sm">{selectedUser.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // New User Creation Form
                <div className="space-y-4">
                  <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-300 mb-2">
                      <span className="text-xl">🆕</span>
                      <span className="font-medium">Create New User</span>
                    </div>
                    <p className="text-green-200 text-sm">
                      Enter details for a new user who will receive the tickets
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 font-medium mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter full name..."
                        value={newUserData.name}
                        onChange={(e) => handleNewUserDataChange("name", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-slate-300 font-medium mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="Enter email address..."
                        value={newUserData.email}
                        onChange={(e) => handleNewUserDataChange("email", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                      />
                    </div>
                  </div>

                  {/* New User Preview */}
                  {newUserData.name && newUserData.email && (
                    <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-blue-400 text-xl">👤</span>
                        <div>
                          <p className="text-white font-medium">New User: {newUserData.name}</p>
                          <p className="text-blue-300 text-sm">{newUserData.email}</p>
                          <p className="text-blue-200 text-xs">Will be created as Guest user</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

              {/* Search Input */}
            {/* Quantity Selection */}
            <div className="space-y-4">
              <label className="block text-slate-300 font-medium text-lg">
                <span className="text-2xl mr-2">🔢</span>
                Number of Tickets
              </label>
              
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={() => handleInputChange("quantity", Math.max(1, formData.quantity - 1))}
                  className="w-12 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center font-bold text-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  -
                </motion.button>

                <div className="bg-slate-700/50 rounded-lg px-8 py-4 min-w-[100px] text-center">
                  <span className="text-white font-bold text-2xl">{formData.quantity}</span>
                </div>

                <motion.button
                  onClick={() => handleInputChange("quantity", formData.quantity + 1)}
                  className="w-12 h-12 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center justify-center font-bold text-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  +
                </motion.button>
              </div>
              
              {/* Option to add individual names */}
              {formData.quantity > 1 && !showNameFields && (
                <div className="text-center">
                  <motion.button
                    onClick={addMoreNames}
                    className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600/70 text-blue-300 rounded-lg transition-all text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    + Add different names for each ticket?
                  </motion.button>
                </div>
              )}

              {/* Individual Ticket Names */}
              {showNameFields && formData.quantity > 1 && (
                <div className="space-y-4">
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-blue-300 font-medium">Individual Ticket Names</h4>
                      <button
                        onClick={() => {
                          setShowNameFields(false);
                          setTicketNames([]);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <p className="text-blue-200 text-sm mb-4">
                      Enter individual names for each ticket. Leave blank to use "{selectedUser?.name || newUserData.name}" for that ticket.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Array.from({ length: formData.quantity }, (_, index) => (
                        <div key={index}>
                          <label className="block text-blue-300 text-sm mb-1">
                            Ticket #{index + 1} Name
                          </label>
                          <input
                            type="text"
                            placeholder={`Name for ticket ${index + 1} (default: ${selectedUser?.name || newUserData.name})`}
                            value={ticketNames[index] || ""}
                            onChange={(e) => handleTicketNameChange(index, e.target.value)}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pricing Information */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-6">
              <h4 className="text-blue-300 font-medium mb-4 text-lg">💰 Pricing Calculation</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Pricing Tier:</span>
                  <span className="text-white font-medium">
                    {formData.quantity >= 4 ? "Group 4+" : "Individual"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Price per ticket:</span>
                  <span className="text-white font-medium">
                    ₹{formData.quantity >= 4 ? (event.groupPrice4 || event.ticketPrice) : event.ticketPrice}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Quantity:</span>
                  <span className="text-white font-medium">{formData.quantity}</span>
                </div>
                <div className="border-t border-blue-700/30 pt-3">
                  <div className="flex justify-between">
                    <span className="text-blue-300 font-bold text-lg">Total Amount:</span>
                    <span className="text-yellow-400 font-bold text-xl">₹{calculateTotalAmount()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-4">
              <label className="block text-slate-300 font-medium text-lg">
                <span className="text-2xl mr-2">💳</span>
                Payment Status
              </label>
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.paymentDone}
                    onChange={(e) => handleInputChange("paymentDone", e.target.checked)}
                    className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500/30"
                  />
                  <span className="text-slate-300">Payment received (cash/UPI)</span>
                </label>
              </div>

              {formData.paymentDone && (
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                  <p className="text-green-300 text-sm">
                    ✅ Payment confirmed - tickets will be marked as paid
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-4">
              <label className="block text-slate-300 font-medium text-lg">
                <span className="text-2xl mr-2">📝</span>
                Notes (Optional)
              </label>
              
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add any notes about this manual issuance..."
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="text-right">
                <span className="text-slate-500 text-xs">{formData.notes.length}/500</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <motion.button
                onClick={() => setShowConfirm(true)}
                disabled={
                  (!selectedUser && !isNewUser) || 
                  !formData.quantity || 
                  issuing || 
                  (isNewUser && (!newUserData.name.trim() || !newUserData.email.trim())) ||
                  (!isNewUser && !selectedUser)
                }
                className="flex-1 px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">🎫</span>
                Issue Tickets
              </motion.button>

              <motion.button
                onClick={() => navigate("/dashboard")}
                className="px-8 py-4 bg-slate-600/50 text-slate-300 font-medium rounded-xl border border-slate-500/30 hover:bg-slate-600/70 transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">↩️</span>
                Back
              </motion.button>
            </div>
          </div>
        ) : (
          // Confirmation Screen
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-white mb-2">Confirm Manual Ticket Issuance</h2>
              <p className="text-slate-400">Please review the details before issuing tickets</p>
            </div>

            {/* Summary */}
            <div className="bg-slate-700/50 rounded-xl p-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Issue tickets for:</span>
                <span className="text-white font-medium">
                  {selectedUser?.name || newUserData.name}
                  {isNewUser && <span className="text-green-400 text-sm ml-2">(New User)</span>}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-white font-medium">{selectedUser?.email || newUserData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Event:</span>
                <span className="text-white font-medium">{event.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Quantity:</span>
                <span className="text-white font-medium">{formData.quantity} ticket(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Amount:</span>
                <span className="text-yellow-400 font-bold text-xl">₹{calculateTotalAmount()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className={`font-medium ${formData.paymentDone ? 'text-green-400' : 'text-yellow-400'}`}>
                  {formData.paymentDone ? '✅ Received' : '⏳ Pending'}
                </span>
              </div>
              {showNameFields && ticketNames.some(name => name.trim()) && (
                <div>
                  <span className="text-slate-400">Individual Names:</span>
                  <div className="mt-2 space-y-1">
                    {Array.from({ length: formData.quantity }, (_, index) => {
                      const ticketName = ticketNames[index]?.trim() || (selectedUser?.name || newUserData.name);
                      return (
                        <div key={index} className="text-white bg-slate-600/30 rounded p-2 text-sm">
                          Ticket #{index + 1}: <span className="font-medium">{ticketName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {formData.notes && (
                <div>
                  <span className="text-slate-400">Notes:</span>
                  <p className="text-white bg-slate-600/30 rounded p-3 mt-2">{formData.notes}</p>
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4">
              <h4 className="text-yellow-300 font-medium mb-2">⚠️ Important:</h4>
              <ul className="text-yellow-200 text-sm space-y-1">
                {isNewUser && <li>• A new user account will be created</li>}
                <li>• These tickets will be marked as "Issued by Admin"</li>
                <li>• They cannot be cancelled by the user</li>
                <li>• Email confirmation will be sent to the user</li>
                <li>• This action cannot be undone</li>
              </ul>
            </div>

            {/* Final Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={handleSubmit}
                disabled={issuing}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold rounded-xl shadow-lg hover:shadow-green-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {issuing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    Issuing Tickets...
                  </>
                ) : (
                  <>
                    <span className="text-xl">🚀</span>
                    {isNewUser ? 'Create User & Issue Tickets' : 'Confirm & Issue Tickets'}
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={() => setShowConfirm(false)}
                disabled={issuing}
                className="px-8 py-4 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">↩️</span>
                Back
              </motion.button>
            </div>
          </div>
        )}
      </div>

      {/* Success Modal with PDF Download Option */}
      {showSuccessModal && issuedTickets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Success Header */}
              <div className="text-center mb-6">
                <motion.div
                  className="text-6xl mb-4"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                >
                  🎉
                </motion.div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Tickets Issued Successfully!
                </h2>
                <p className="text-slate-400">
                  {formData.quantity} ticket(s) have been issued to {issuedTickets.user.name}
                </p>
              </div>

              {/* Ticket Summary */}
              <div className="bg-slate-700/50 rounded-xl p-6 mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="text-white font-medium">
                    {issuedTickets.user.name}
                    {issuedTickets.user.isNewUser && (
                      <span className="text-green-400 text-sm ml-2">(New User)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white font-medium">{issuedTickets.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tickets Issued:</span>
                  <span className="text-white font-medium">{issuedTickets.tickets.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Amount:</span>
                  <span className="text-yellow-400 font-bold text-xl">₹{issuedTickets.totalAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Status:</span>
                  <span className={`font-medium ${formData.paymentDone ? 'text-green-400' : 'text-yellow-400'}`}>
                    {formData.paymentDone ? '✅ Received' : '⏳ Pending'}
                  </span>
                </div>
              </div>

              {/* Email Confirmation */}
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-blue-300 mb-2">
                  <span className="text-xl">📧</span>
                  <span className="font-medium">Email Sent</span>
                </div>
                <p className="text-blue-200 text-sm">
                  Ticket confirmation email has been sent to {issuedTickets.user.email}
                </p>
              </div>

              {/* PDF Download Option */}
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-purple-300 mb-3">
                  <span className="text-xl">📄</span>
                  <span className="font-medium">Download PDF Tickets</span>
                </div>
                <p className="text-purple-200 text-sm mb-4">
                  Would you like to download a PDF copy of the tickets for printing or record keeping?
                </p>
                
                <div className="flex gap-3">
                  <motion.button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {downloadingPDF ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <span>📥</span>
                        Download PDF
                      </>
                    )}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setShowSuccessModal(false)}
                    className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Skip
                  </motion.button>
                </div>
              </div>

              {/* Final Actions */}
              <div className="flex flex-col gap-3">
                <motion.button
                  onClick={resetForm}
                  className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🎫</span>
                  Issue More Tickets
                </motion.button>
                
                <motion.button
                  onClick={() => navigate("/dashboard")}
                  className="w-full px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>🏠</span>
                  Back to Dashboard
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default ManualTicketIssuance;