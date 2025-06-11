const User = require('../models/User');

const checkRole = (roles) => async (req, res, next) => {
  try {
    // Get user from database to ensure we have the latest role
    const user = await User.findOne({ firebaseUID: req.user.uid });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add user role to request object
    req.user.role = user.role;
    req.user.dbUser = user;

    console.log(`Role check: User ${user.email} has role '${user.role}', required: [${roles.join(', ')}]`);

    if (!roles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'Access denied',
        userRole: user.role,
        requiredRoles: roles
      });
    }
    
    next();
  } catch (error) {
    console.error('Role check error:', error);
    res.status(500).json({ error: 'Role verification failed' });
  }
};

module.exports = {
  isAdmin: checkRole(['admin']),
  isManager: checkRole(['manager', 'admin']),
  isQRChecker: checkRole(['qrchecker', 'admin']),
  isGuest: checkRole(['guest'])
};