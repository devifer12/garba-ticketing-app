const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

module.exports = {
  isAdmin: checkRole(['admin']),
  isManager: checkRole(['manager', 'admin']),
  isQRChecker: checkRole(['qrchecker', 'admin']),
  isGuest: checkRole(['guest'])
};