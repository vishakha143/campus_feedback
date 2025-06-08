const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Home Route
router.get('/', (req, res) => {
  res.render('index', {
    user: req.user,
    lang: res.locals.lang,
    theme: res.locals.theme,
    __: req.__,
    path: '/',
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg,
    error: res.locals.error
  });
});

// Search Route
router.get('/search', async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    req.flash('error_msg', 'Access denied. Admins only.');
    return res.redirect('/');
  }

  const query = req.query.q ? req.query.q.trim() : '';
  let results = [];

  if (query) {
    try {
      results = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ],
        role: { $in: ['student', 'teacher'] }
      }).select('username email role');
    } catch (err) {
      console.error('Search Error:', err);
      req.flash('error_msg', 'An error occurred while searching.');
    }
  }

  res.render('search', {
    user: req.user,
    showSidebar: true,
    lang: res.locals.lang,
    theme: res.locals.theme,
    __: req.__,
    path: '/search',
    query,
    results,
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg,
    error: res.locals.error
  });
});

// GET About Page
router.get('/about', (req, res) => {
  res.render('static/about', {
    title: 'About CampusConnect',
    user: req.user || null,
    lang: res.locals.lang,
    theme: res.locals.theme,
    __: req.__,
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg,
    error: res.locals.error
  });
});

// GET Contact Page
router.get('/contact', (req, res) => {
  res.render('static/contact', {
    title: 'Contact Us',
    user: req.user || null,
    lang: res.locals.lang,
    theme: res.locals.theme,
    __: req.__,
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg,
    error: res.locals.error
  });
});

// GET Privacy Page
router.get('/privacy', (req, res) => {
  res.render('static/privacy', {
    title: 'Privacy Policy',
    user: req.user || null,
    lang: res.locals.lang,
    theme: res.locals.theme,
    __: req.__,
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg,
    error: res.locals.error
  });
});

module.exports = router;