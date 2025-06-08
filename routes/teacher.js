const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Feedback = require('../models/Feedback');
const Schedule = require('../models/Schedule');
const Examination = require('../models/Examination');
const Material = require('../models/Material');

// Middleware to ensure the user is authenticated and a teacher
const ensureAuthenticated = (req, res, next) => {
  if (req.user && req.user.role === 'teacher') {
    return next();
  }
  req.flash('error_msg', 'Please log in as a teacher to access this page.');
  res.redirect('/auth/login');
};

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacher: req.user._id }).sort({ date: 1 }).limit(5);
    console.log('Schedules:', schedules.length);

    const materials = await Material.find({ createdBy: req.user._id }).sort({ createdAt: -1 }).limit(5);
    console.log('Materials:', materials.length);

    res.render('teacher/dashboard', {
      layout: 'layouts/boilerplate',
      title: 'Teacher Dashboard',
      user: req.user,
      showSidebar: true,
      schedules,
      materials,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Teacher Dashboard Error:', err);
    req.flash('error_msg', 'An error occurred while loading the dashboard.');
    res.redirect('/auth/login');
  }
});

router.get('/student-progress', ensureAuthenticated, async (req, res) => {
  try {
    // Fetch examination data for students under this teacher
    const examinations = await Examination.find({ teacher: req.user._id })
      .populate('student', 'username')
      .lean();

    // Prepare chart data
    const chartData = {
      labels: examinations.map(exam => exam.student.username),
      internalMarks: examinations.map(exam => exam.internalMarks || 0),
      externalMarks: examinations.map(exam => exam.externalMarks || 0),
      practicalMarks: examinations.map(exam => exam.practicalMarks || 0)
    };

    res.render('teacher/student-progress', {
      layout: 'layouts/boilerplate',
      title: 'Student Progress',
      chartData,
      user: req.user,
      showSidebar: true,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Error rendering student progress:', err);
    req.flash('error_msg', 'Failed to load student progress.');
    res.redirect('/teacher/dashboard');
  }
});

router.get('/materials', ensureAuthenticated, async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.render('teacher/materials', {
      layout: 'layouts/boilerplate',
      title: 'Manage Materials',
      user: req.user,
      showSidebar: true,
      materials,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Materials Error:', err);
    req.flash('error_msg', 'An error occurred while loading materials.');
    res.redirect('/teacher/dashboard');
  }
});

router.post('/materials/add',ensureAuthenticated, async (req, res) => {
  try {
    const { title, description, url } = req.body;
    if (!title || !url) {
      req.flash('error_msg', 'Title and URL are required.');
      return res.redirect('/teacher/materials');
    }

    const material = new Material({
      title,
      description: description || '',
      url,
      createdBy: req.user._id,
      createdAt: new Date()
    });
    await material.save();

    req.flash('success_msg', 'Material added successfully!');
    res.redirect('/teacher/materials');
  } catch (err) {
    console.error('Add Material Error:', err);
    req.flash('error_msg', 'An error occurred while adding the material.');
    res.redirect('/teacher/materials');
  }
});

router.delete('/materials/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id);
    if (!material) {
      req.flash('error_msg', 'Material not found.');
      return res.redirect('/teacher/dashboard');
    }
    if (material.createdBy.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Not authorized to delete this material.');
      return res.redirect('/teacher/dashboard');
    }
    await Material.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Material deleted successfully.');
    res.redirect('/teacher/dashboard');
  } catch (err) {
    console.error('Delete Material Error:', err);
    req.flash('error_msg', 'An error occurred while deleting the material.');
    res.redirect('/teacher/dashboard');
  }
});

router.get('/schedule', ensureAuthenticated, async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacher: req.user._id }).sort({ date: 1 }).limit(5);
    res.render('teacher/schedule', {
      layout: 'layouts/boilerplate',
      title: 'Class Schedule',
      user: req.user,
      showSidebar: true,
      schedules,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Schedule Error:', err);
    req.flash('error_msg', 'An error occurred while loading the schedule.');
    res.redirect('/teacher/dashboard');
  }
});

router.post('/schedule/add', ensureAuthenticated, async (req, res) => {
  try {
    const { subject, date, time, room } = req.body;
    if (!subject || !date || !time || !room) {
      req.flash('error_msg', 'All fields are required.');
      return res.redirect('/teacher/schedule');
    }

    const schedule = new Schedule({
      teacher: req.user._id,
      subject,
      date: new Date(date),
      time,
      room
    });
    await schedule.save();

    req.flash('success_msg', 'Schedule added successfully!');
    res.redirect('/teacher/schedule');
  } catch (err) {
    console.error('Add Schedule Error:', err);
    req.flash('error_msg', 'An error occurred while adding the schedule.');
    res.redirect('/teacher/schedule');
  }
});

router.post('/schedule/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule || schedule.teacher.toString() !== req.user._id.toString()) {
      req.flash('error_msg', 'Schedule not found or unauthorized.');
      return res.redirect('/teacher/schedule');
    }
    await schedule.remove();
    req.flash('success_msg', 'Schedule deleted successfully!');
    res.redirect('/teacher/schedule');
  } catch (err) {
    console.error('Delete Schedule Error:', err);
    req.flash('error_msg', 'An error occurred while deleting the schedule.');
    res.redirect('/teacher/schedule');
  }
});

router.post('/feedback/examination', ensureAuthenticated , async (req, res) => {
  // Existing code for feedback submission
  await feedback.save();

  // Emit real-time notification to the teacher
  const io = req.app.get('io');
  io.to(feedback.teacher.toString()).emit('newFeedback', {
    message: `New feedback received from ${req.user.username}`,
    time: new Date().toLocaleString()
  });

  req.flash('success_msg', 'Feedback submitted successfully!');
  res.redirect('/student/dashboard');
});

module.exports = router;