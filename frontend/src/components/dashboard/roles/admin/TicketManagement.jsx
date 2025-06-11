import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { adminAPI, apiUtils } from '../../../../services/api';
import { toast } from 'react-toastify';

const TicketManagement = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalTickets: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkStatus, setBulkStatus] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getTicketManagement(filters);
      setTickets(response.data.tickets);
      setPagination(response.data.pagination);
      
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`Failed to load tickets: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await adminAPI.updateTicketStatus(ticketId, newStatus);
      toast.success('Ticket status updated successfully');
      fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket status:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      toast.error(`Failed to update status: ${errorMessage}`);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedTickets.length === 0 || !bulkStatus) {
      toast.error('Please select tickets and status');
      return;
    }

    try {
      await adminAPI.bulkUpdateTickets(selectedTickets, bulkStatus);
      toast.success(`Updated ${selectedTickets.length} tickets successfully`);
      setSelectedTickets([]);
      setShowBulkModal(false);
      setBulkStatus('');
      fetchTickets();
    } catch (err) {
      console.error('Failed to bulk update tickets:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      toast.error(`Failed to update tickets: ${errorMessage}`);
    }
  };

  const handleExport = async (format = 'json') => {
    try {
      const response = await adminAPI.exportTickets(format);
      
      if (format === 'csv') {
        // Handle CSV download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tickets.csv';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        // Handle JSON download
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'tickets.json';
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
      toast.success('Tickets exported successfully');
    } catch (err) {
      console.error('Failed to export tickets:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      toast.error(`Failed to export: ${errorMessage}`);
    }
  };

  const handleSelectTicket = (ticketId) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTickets.length === tickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(tickets.map(ticket => ticket._id));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-900/30 text-green-300 border-green-700/30',
      used: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
      cancelled: 'bg-red-900/30 text-red-300 border-red-700/30'
    };
    return colors[status] || colors.active;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Tickets</h2>
            <p className="text-slate-400">Please wait while we fetch ticket data...</p>
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
      className="max-w-7xl mx-auto"
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
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 bg-clip-text text-transparent mb-4">
            Ticket Management
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mx-auto mb-6"></div>
        </motion.div>

        {/* Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by user name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              />
            </div>

            {/* Filters and Actions */}
            <div className="flex items-center gap-4 flex-wrap">
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="used">Used</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {selectedTickets.length > 0 && (
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="px-4 py-2 bg-orange-600/50 hover:bg-orange-600/70 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  ⚡ Bulk Update ({selectedTickets.length})
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport('json')}
                  className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  📄 Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 bg-purple-600/50 hover:bg-purple-600/70 text-white rounded-lg transition-all flex items-center gap-2"
                >
                  📊 Export CSV
                </button>
              </div>

              <button
                onClick={fetchTickets}
                className="px-4 py-2 bg-green-600/50 hover:bg-green-600/70 text-white rounded-lg transition-all flex items-center gap-2"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Showing {pagination.count} of {pagination.totalTickets} tickets
            </span>
            {selectedTickets.length > 0 && (
              <span className="text-green-400">
                {selectedTickets.length} ticket(s) selected
              </span>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <span>⚠️</span>
              <span className="font-medium">Error Loading Tickets</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchTickets}
              className="mt-3 px-4 py-2 bg-red-600/50 hover:bg-red-600/70 text-white text-sm rounded-lg transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tickets Table */}
        {tickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedTickets.length === tickets.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500/30"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Ticket ID</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Event</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Price</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Created</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <motion.tr
                    key={ticket._id}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket._id)}
                        onChange={() => handleSelectTicket(ticket._id)}
                        className="rounded border-slate-600 bg-slate-700 text-green-500 focus:ring-green-500/30"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 font-mono text-sm">
                        {ticket._id.slice(-8)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                          {ticket.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-white font-medium">{ticket.user?.name || 'Unknown'}</p>
                          <p className="text-slate-400 text-sm">{ticket.user?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {ticket.eventName}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      ₹{ticket.price}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusUpdate(ticket._id, e.target.value)}
                          className="px-2 py-1 bg-slate-700/50 border border-slate-600/30 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-green-500/30"
                        >
                          <option value="active">Active</option>
                          <option value="used">Used</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-xl font-bold text-white mb-2">No Tickets Found</h3>
            <p className="text-slate-400">No tickets match your current filters.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Page {pagination.current} of {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange('page', pagination.current - 1)}
                disabled={pagination.current === 1}
                className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700/70 text-white text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', pagination.current + 1)}
                disabled={pagination.current === pagination.total}
                className="px-3 py-1 bg-slate-700/50 hover:bg-slate-700/70 text-white text-sm rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Update Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Bulk Update Tickets
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-slate-300 text-sm mb-2">
                  Update {selectedTickets.length} selected tickets to:
                </p>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500/30"
                >
                  <option value="">Select Status</option>
                  <option value="active">Active</option>
                  <option value="used">Used</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBulkUpdate}
                  disabled={!bulkStatus}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Update All
                </button>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkStatus('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-medium rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default TicketManagement;