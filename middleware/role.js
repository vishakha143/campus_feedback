const checkRole = (roles) => (req, res, next) => {
  if (req.user && roles.includes(req.user.role)) {
    return next();
  }
  req.flash('error_msg', 'Access denied. You do not have the required role.');
  res.redirect('/auth/login');
};

module.exports = checkRole;