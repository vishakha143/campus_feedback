const passport = require('passport');

module.exports = {
  ensureAuthenticated: (req, res, next) => {
    if (req.isAuthenticated()) {
      console.log('Authenticated user:', req.user); // Debug log
      return next();
    }
    req.flash('error_msg', 'Please log in to continue.');
    res.redirect('/auth/login');
  },

  forwardAuthenticated: (req, res, next) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.redirect('/dashboard');
  },

  ensureRole: (requiredRole) => (req, res, next) => {
    if (req.isAuthenticated() && req.user && req.user.role === requiredRole) {
      return next();
    }
    req.flash('error_msg', `Access denied. You must be a ${requiredRole} to view this page.`);
    res.redirect('/auth/login');
  }
};