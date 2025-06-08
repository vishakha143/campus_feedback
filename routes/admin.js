const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Feedback = require('../models/Feedback');

// Middleware to ensure the user is an admin
const ensureAdmin = (req, res, next) => {
  console.log('Checking authentication for admin dashboard:', {
    isAuthenticated: req.isAuthenticated(),
    user: req.user,
    role: req.user ? req.user.role : null
  });
  if (!req.isAuthenticated()) {
    req.flash('error_msg', 'Please log in to access this page.');
    return res.redirect('/auth/login');
  }
  if (req.user.role !== 'admin') {
    req.flash('error_msg', 'Please log in as an admin to access this page.');
    return res.redirect('/auth/login');
  }
  next();
};

// GET Admin Dashboard
router.get('/dashboard', ensureAdmin, async (req, res) => {
  try {
    // Fetch all students
    const students = await User.find({ role: 'student' });

    // Fetch all feedback submitted by students
    const feedbacks = await Feedback.find({ student: { $in: students.map(s => s._id) } })
      .populate('student', 'username email')
      .populate('teacher', 'username email')
      .sort({ submittedAt: -1 });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      showSidebar: true,
      user: req.user,
      students: students,
      feedbackList: feedbacks,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error,
      showSidebar: true, // Add this to show the sidebar
      currentPath: '/admin/dashboard' // Also add this for sidebar active link highlighting
    });
  } catch (err) {
    console.error('Admin Dashboard Error:', err);
    req.flash('error_msg', 'An error occurred while loading the dashboard.');
    res.redirect('/auth/login');
  }
});

router.get('/users', ensureAdmin, async (req, res) => {
  try {
    const users = await User.find().sort({ role: 1, username: 1 });
    res.render('admin/users', {
      layout: 'layouts/boilerplate',
      title: 'User Management',
      user: req.user,
      showSidebar: true,
      users,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('User Management Error:', err);
    req.flash('error_msg', 'An error occurred while loading users.');
    res.redirect('/admin/dashboard');
  }
});

router.post('/users/delete/:id', ensureAdmin, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      req.flash('error_msg', 'User not found.');
      return res.redirect('/admin/users');
    }
    if (userToDelete._id.toString() === req.user._id.toString()) {
      req.flash('error_msg', 'You cannot delete your own account.');
      return res.redirect('/admin/users');
    }
    await userToDelete.remove();
    req.flash('success_msg', 'User deleted successfully!');
    res.redirect('/admin/users');
  } catch (err) {
    console.error('Delete User Error:', err);
    req.flash('error_msg', 'An error occurred while deleting the user.');
    res.redirect('/admin/users');
  }
});

module.exports = router;