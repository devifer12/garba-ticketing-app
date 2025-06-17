import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../../../context/AuthContext';
import { adminAPI, apiUtils } from '../../../../services/api';
import { toast } from 'react-toastify';

const UserManagement = ({ userRole }) => {
  const { backendUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalUsers: 0
  });
  const [filters, setFilters] = useState({
    role: 'all',
    search: '',
    page: 1,
    limit: 20
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleUpdateData, setRoleUpdateData] = useState({ userId: null, newRole: '' });

  // Check if current user can change roles (only admins can)
  const canChangeRoles = userRole === 'admin';

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await adminAPI.getAllUsers(filters);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
      
    } catch (err) {
      console.error('Failed to fetch users:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      setError(errorMessage);
      toast.error(`Failed to load users: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset to page 1 when changing filters
    }));
  };

  const handleRoleUpdate = async (userId, newRole) => {
    if (!canChangeRoles) {
      toast.error('Only administrators can change user roles');
      return;
    }

    try {
      await adminAPI.updateUserRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchUsers(); // Refresh the list
      setShowRoleModal(false);
      setRoleUpdateData({ userId: null, newRole: '' });
    } catch (err) {
      console.error('Failed to update user role:', err);
      const errorMessage = apiUtils.formatErrorMessage(err);
      toast.error(`Failed to update role: ${errorMessage}`);
    }
  };

  const openRoleModal = (userId, currentRole) => {
    if (!canChangeRoles) {
      toast.error('Only administrators can change user roles');
      return;
    }
    setRoleUpdateData({ userId, newRole: currentRole });
    setShowRoleModal(true);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-red-900/30 text-red-300 border-red-700/30',
      manager: 'bg-blue-900/30 text-blue-300 border-blue-700/30',
      qrchecker: 'bg-green-900/30 text-green-300 border-green-700/30',
      guest: 'bg-gray-900/30 text-gray-300 border-gray-700/30'
    };
    return colors[role] || colors.guest;
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

  if (loading && users.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-slate-800/30 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/30">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Loading Users</h2>
            <p className="text-slate-400">Please wait while we fetch user data...</p>
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
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-4xl md:text-5xl font-bold font-serif bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            User Management
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full mx-auto mb-6"></div>
          
          {/* Role Permission Notice */}
          {!canChangeRoles && (
            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-4 mb-6">
              <p className="text-yellow-300 text-sm">
                <span className="font-medium">Manager Access:</span> You can view all users but cannot change user roles. 
                Only administrators can modify user permissions.
              </p>
            </div>
          )}
        </motion.div>

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-4">
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="qrchecker">QR Checker</option>
                <option value="guest">Guest</option>
              </select>

              <button
                onClick={fetchUsers}
                className="px-4 py-2 bg-blue-600/50 hover:bg-blue-600/70 text-white rounded-lg transition-all flex items-center gap-2"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>
              Showing {pagination.count} of {pagination.totalUsers} users
            </span>
            {selectedUsers.length > 0 && (
              <span className="text-blue-400">
                {selectedUsers.length} user(s) selected
              </span>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
              <span>⚠️</span>
              <span className="font-medium">Error Loading Users</span>
            </div>
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-3 px-4 py-2 bg-red-600/50 hover:bg-red-600/70 text-white text-sm rounded-lg transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* Users Table */}
        {users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/30">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Joined</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Last Login</th>
                  {canChangeRoles && (
                    <th className="text-left py-3 px-4 text-slate-300 font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <motion.tr
                    key={user._id}
                    className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user._id)}
                        onChange={() => handleSelectUser(user._id)}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/30"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {user.name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-slate-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    {canChangeRoles && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openRoleModal(user._id, user.role)}
                            className="px-3 py-1 text-xs rounded transition-all bg-blue-600/50 hover:bg-blue-600/70 text-white cursor-pointer"
                            disabled={user._id === backendUser?._id}
                          >
                            Change Role
                          </button>
                        </div>
                      </td>
                    )}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <h3 className="text-xl font-bold text-white mb-2">No Users Found</h3>
            <p className="text-slate-400">No users match your current filters.</p>
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

      {/* Role Update Modal - Only show for admins */}
      {showRoleModal && canChangeRoles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/90 backdrop-blur-xl border border-slate-600/30 p-8 rounded-2xl shadow-lg max-w-sm w-full mx-4"
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">
              Update User Role
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Select New Role
                </label>
                <select
                  value={roleUpdateData.newRole}
                  onChange={(e) => setRoleUpdateData(prev => ({ ...prev, newRole: e.target.value }))}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="guest">Guest</option>
                  <option value="qrchecker">QR Checker</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleRoleUpdate(roleUpdateData.userId, roleUpdateData.newRole)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
                >
                  Update Role
                </button>
                <button
                  onClick={() => setShowRoleModal(false)}
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

export default UserManagement;