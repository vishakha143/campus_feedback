
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Search Route
router.get('/', async (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';

  try {
    let results = [];
    if (query) {
      results = await User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      }).lean();
    }

    res.render('search', {
      user: req.session.user,
      showSidebar: true,
      lang: res.locals.lang || 'en',
      theme: res.locals.theme || 'light',
      __: req.__ || ((key) => key),
      success_msg: req.flash('success_msg'),
      error_msg: req.flash('error_msg'),
      query,
      results,
      currentPath: '/search'
    });
  } catch (err) {
    console.error('Search Error:', err);
    req.flash('error_msg', 'An error occurred while searching.');
    res.redirect('/');
  }
});

module.exports = router;