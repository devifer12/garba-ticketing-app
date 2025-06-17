const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Ticket = require('../models/Tickets');
const Event = require('../models/Event');
const verifyToken = require('../middlewares/authMiddleware');
const { isAdmin, isManager } = require('../middlewares/roleMiddleware');

// Get user count for dashboard stats
router.get('/users/count', verifyToken, isManager, async (req, res) => {
  try {
    const count = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get user count error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user count'
    });
  }
});

// Get all users with pagination and filtering
router.get('/users', verifyToken, isManager, async (req, res) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    
    let query = {};
    
    // Filter by role if specified
    if (role && role !== 'all') {
      query.role = role;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-firebaseUID') // Don't expose Firebase UID
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: users.length,
        totalUsers: total
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// Update user role (admin only - managers cannot change roles)
router.patch('/users/:userId/role', verifyToken, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    const validRoles = ['guest', 'admin', 'manager', 'qrchecker'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role specified'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-firebaseUID');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

// Get ticket statistics for dashboard - ENHANCED with better revenue calculation
router.get('/tickets/stats', verifyToken, isManager, async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const activeTickets = await Ticket.countDocuments({ status: 'active' });
    const usedTickets = await Ticket.countDocuments({ status: 'used' });
    
    // FIXED: Calculate total revenue from ALL tickets (active + used)
    const revenueResult = await Ticket.aggregate([
      { $match: { status: { $in: ['active', 'used'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Get recent bookings (last 10)
    const recentBookings = await Ticket.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.status(200).json({
      success: true,
      total: totalTickets,
      active: activeTickets,
      used: usedTickets,
      revenue: totalRevenue,
      recentBookings
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket statistics'
    });
  }
});

// ENHANCED: Get comprehensive dashboard analytics with sales trends
router.get('/analytics/dashboard', verifyToken, isManager, async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    // Get ticket statistics
    const totalTickets = await Ticket.countDocuments();
    const ticketsToday = await Ticket.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    });
    
    // ENHANCED: Calculate comprehensive revenue data
    const revenueResult = await Ticket.aggregate([
      { $match: { status: { $in: ['active', 'used'] } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
    
    // Revenue today
    const revenueTodayResult = await Ticket.aggregate([
      { 
        $match: { 
          status: { $in: ['active', 'used'] },
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        } 
      },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const revenueToday = revenueTodayResult.length > 0 ? revenueTodayResult[0].total : 0;
    
    // ENHANCED: Get sales chart data (last 30 days with trend analysis)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const salesChart = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: "%Y-%m-%d", 
              date: "$createdAt" 
            } 
          },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // ENHANCED: Calculate sales trends
    const salesTrend = calculateSalesTrend(salesChart);
    
    // ENHANCED: Get hourly sales data for today
    const todayHourlySales = await Ticket.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }
      },
      {
        $group: {
          _id: { 
            $hour: "$createdAt"
          },
          count: { $sum: 1 },
          revenue: { $sum: '$price' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Get event statistics
    const event = await Event.findOne();
    const eventStats = event ? {
      name: event.name,
      totalTickets: event.totalTickets,
      soldTickets: event.soldTickets,
      availableTickets: event.totalTickets - event.soldTickets,
      ticketPrice: event.ticketPrice,
      soldPercentage: Math.round((event.soldTickets / event.totalTickets) * 100)
    } : null;
    
    // ENHANCED: Peak sales analysis
    const peakSalesHour = todayHourlySales.reduce((peak, current) => 
      current.count > (peak?.count || 0) ? current : peak, null
    );
    
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          newToday: newUsersToday
        },
        tickets: {
          total: totalTickets,
          soldToday: ticketsToday
        },
        revenue: {
          total: totalRevenue,
          today: revenueToday,
          trend: salesTrend
        },
        event: eventStats,
        salesChart,
        hourlySales: todayHourlySales,
        peakSalesHour,
        analytics: {
          averageTicketValue: totalTickets > 0 ? Math.round(totalRevenue / totalTickets) : 0,
          conversionRate: totalUsers > 0 ? Math.round((totalTickets / totalUsers) * 100) : 0,
          salesVelocity: calculateSalesVelocity(salesChart)
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard analytics'
    });
  }
});

// Helper function to calculate sales trend
function calculateSalesTrend(salesData) {
  if (salesData.length < 2) return { direction: 'stable', percentage: 0 };
  
  const recent = salesData.slice(-7); // Last 7 days
  const previous = salesData.slice(-14, -7); // Previous 7 days
  
  const recentTotal = recent.reduce((sum, day) => sum + day.revenue, 0);
  const previousTotal = previous.reduce((sum, day) => sum + day.revenue, 0);
  
  if (previousTotal === 0) return { direction: 'stable', percentage: 0 };
  
  const percentage = Math.round(((recentTotal - previousTotal) / previousTotal) * 100);
  const direction = percentage > 5 ? 'rising' : percentage < -5 ? 'falling' : 'stable';
  
  return { direction, percentage: Math.abs(percentage) };
}

// Helper function to calculate sales velocity
function calculateSalesVelocity(salesData) {
  if (salesData.length < 2) return 0;
  
  const totalDays = salesData.length;
  const totalSales = salesData.reduce((sum, day) => sum + day.count, 0);
  
  return Math.round(totalSales / totalDays * 10) / 10; // Average sales per day
}

// Get detailed ticket management data
router.get('/tickets/management', verifyToken, isManager, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Search by user name or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      query.user = { $in: users.map(u => u._id) };
    }
    
    const tickets = await Ticket.find(query)
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Ticket.countDocuments(query);
    
    res.status(200).json({
      success: true,
      tickets,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: tickets.length,
        totalTickets: total
      }
    });
  } catch (error) {
    console.error('Get ticket management data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket management data'
    });
  }
});

// Bulk update ticket status (admin only)
router.patch('/tickets/bulk-update', verifyToken, isAdmin, async (req, res) => {
  try {
    const { ticketIds, status } = req.body;
    
    if (!Array.isArray(ticketIds) || ticketIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Ticket IDs array is required'
      });
    }
    
    const validStatuses = ['active', 'used'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }
    
    const result = await Ticket.updateMany(
      { _id: { $in: ticketIds } },
      { status }
    );
    
    res.status(200).json({
      success: true,
      message: `Updated ${result.modifiedCount} tickets`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update tickets'
    });
  }
});

// Export ticket data (CSV format)
router.get('/tickets/export', verifyToken, isManager, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const tickets = await Ticket.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Ticket ID,User Name,User Email,Event Name,Price,Status,Created At\n';
      const csvData = tickets.map(ticket => 
        `${ticket._id},${ticket.user.name},${ticket.user.email},${ticket.eventName},${ticket.price},${ticket.status},${ticket.createdAt}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
      res.send(csvHeader + csvData);
    } else {
      // Return JSON
      res.status(200).json({
        success: true,
        tickets,
        count: tickets.length,
        exportedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Export tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export tickets'
    });
  }
});

// System health check (admin only)
router.get('/system/health', verifyToken, isAdmin, async (req, res) => {
  try {
    const dbStatus = await User.findOne().then(() => 'connected').catch(() => 'disconnected');
    
    const stats = {
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    res.status(200).json({
      success: true,
      health: 'ok',
      stats
    });
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed'
    });
  }
});

module.exports = router;