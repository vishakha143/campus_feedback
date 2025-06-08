// routes/student.js
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Material = require('../models/Material');
const Examination = require('../models/Examination');


// Middleware to ensure the user is a student
const ensureStudent = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash('error_msg', 'Please log in to access this page.');
    return res.redirect('/auth/login');
  }
  if (req.user.role !== 'student') {
    req.flash('error_msg', 'Please log in as a student to access this page.');
    return res.redirect('/auth/login');
  }
  next();
};

// Dashboard Routes
router.get('/dashboard', ensureStudent, async (req, res) => {
  try {
    console.log('Student ID:', req.user._id.toString()); // Add this line
    const examinations = await Examination.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5);
    const scoreChartData = {
      labels: examinations.map(exam => exam.examDate.toISOString().split('T')[0]),
      data: examinations.map(exam => exam.score)
    };

    const feedbacks = await Feedback.find({ student: req.user._id })
      .populate('teacher')
      .sort({ submittedAt: -1 })
      .limit(5);

    res.render('student/dashboard', {
      layout: 'layouts/boilerplate',
      title: 'Student Dashboard',
      user: req.user,
      showSidebar: true,
      scoreChartData,
      currentPath: '/student/dashboard',
      examinations,
      feedbacks,
      showSidebar: true,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Dashboard Error:', err);
    req.flash('error_msg', 'An error occurred while loading the dashboard.');
    res.redirect('/');
  }
});

// Examination Routes
router.get('/examination-form', ensureStudent, async (req, res) => {
  try {
    res.render('student/examinationform', {
      layout: 'layouts/boilerplate',
      title: 'Examination Form',
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
    console.error('Examination Form Error:', err);
    req.flash('error_msg', 'An error occurred while loading the examination form.');
    res.redirect('/student/dashboard');
  }
});

router.post('/examination-form', ensureStudent, async (req, res) => {
  try {
    const { examName, examType, examDate, score, difficulty } = req.body;

    // Validate input
    if (!examName || !examType || !examDate || !score || !difficulty) {
      req.flash('error_msg', 'All fields are required.');
      return res.redirect('/student/examination-form');
    }

    // Validate examType
    const validExamTypes = ['midterm', 'final', 'practical'];
    if (!validExamTypes.includes(examType)) {
      req.flash('error_msg', 'Invalid exam type.');
      return res.redirect('/student/examination-form');
    }

    // Validate score
    const scoreNum = Number(score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      req.flash('error_msg', 'Score must be between 0 and 100.');
      return res.redirect('/student/examination-form');
    }

    // Validate difficulty
    const difficultyNum = Number(difficulty);
    if (isNaN(difficultyNum) || difficultyNum < 1 || difficultyNum > 100) {
      req.flash('error_msg', 'Difficulty must be between 1 and 100.');
      return res.redirect('/student/examination-form');
    }

    // Compute difficulty category
    let difficultyCategory;
    if (difficultyNum <= 33) {
      difficultyCategory = 'Easy';
    } else if (difficultyNum <= 66) {
      difficultyCategory = 'Moderate';
    } else {
      difficultyCategory = 'Hard';
    }

    // Create new examination record
    const examination = new Examination({
      student: req.user._id,
      examName,
      examType,
      examDate: new Date(examDate),
      score: scoreNum,
      difficulty: difficultyNum,
      difficultyCategory
    });

    await examination.save();

    req.flash('success_msg', 'Examination form submitted successfully!');
    res.redirect('/student/dashboard');
  } catch (err) {
    console.error('Examination Form Submission Error:', err);
    req.flash('error_msg', 'An error occurred while submitting the examination form.');
    res.redirect('/student/examination-form');
  }
});

router.get('/exam-history', ensureStudent, async (req, res) => {
  try {
    const examinations = await Examination.find({ student: req.user._id }).sort({ createdAt: -1 });
    const scoreChartData = {
      labels: examinations.map(exam => exam.examDate.toISOString().split('T')[0]),
      data: examinations.map(exam => exam.score)
    };
    res.render('student/exam_history', {
      layout: 'layouts/boilerplate',
      title: 'Examination History',
      user: req.user,
      showSidebar: true,
      examination: examinations,
      scoreChartData,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Examination History Error:', err);
    req.flash('error_msg', 'An error occurred while loading examination history.');
    res.redirect('/student/dashboard');
  }
});

// Feedback Routes
router.get('/feedback-history', ensureStudent, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ student: req.user._id })
      .populate('teacher', 'username email')
      .sort({ submittedAt: -1 });

    // Prepare data for bar graphs
    const teacherRatings = {};
    feedbacks.forEach(feedback => {
      if (feedback.type === 'general') {
        const teacherName = feedback.teacher.username;
        if (!teacherRatings[teacherName]) {
          teacherRatings[teacherName] = { total: 0, count: 0 };
        }
        teacherRatings[teacherName].total += feedback.rating;
        teacherRatings[teacherName].count += 1;
      }
    });
    const teacherChartData = {
      labels: Object.keys(teacherRatings),
      data: Object.values(teacherRatings).map(r => (r.total / r.count).toFixed(2))
    };

    const examRatingsByDate = {};
    feedbacks.forEach(feedback => {
      if (feedback.type === 'examination') {
        const date = feedback.submittedAt.toISOString().split('T')[0];
        if (!examRatingsByDate[date]) {
          examRatingsByDate[date] = { total: 0, count: 0 };
        }
        examRatingsByDate[date].total += feedback.rating;
        examRatingsByDate[date].count += 1;
      }
    });
    const examChartData = {
      labels: Object.keys(examRatingsByDate),
      data: Object.values(examRatingsByDate).map(r => (r.total / r.count).toFixed(2))
    };

    res.render('student/feedback_history', {
      layout: 'layouts/boilerplate',
      title: 'Feedback History',
      user: req.user,
      showSidebar: true,
      feedbacks,
      teacherChartData,
      examChartData,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Feedback History Error:', err);
    req.flash('error_msg', 'An error occurred while loading feedback history.');
    res.redirect('/student/dashboard');
  }
});

router.get('/feedback/examination', ensureStudent, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' });
    res.render('student/submit-feedback', {
      layout: 'layouts/boilerplate',
      title: 'Submit Feedback',
      user: req.user,
      showSidebar: true,
      teachers,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Feedback Form Error:', err);
    req.flash('error_msg', 'An error occurred while loading the feedback form.');
    res.redirect('/student/dashboard');
  }
});

router.post('/feedback/examination', ensureStudent, async (req, res) => {
  try {
    const { teacherId, feedbackType, teachingStyle, contentDelivery, engagement, comments } = req.body;

    // Validate input
    if (!teacherId || !teachingStyle || !contentDelivery || !engagement) {
      req.flash('error_msg', 'All required fields must be filled.');
      return res.redirect('/student/feedback/examination');
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      req.flash('error_msg', 'Invalid teacher selected.');
      return res.redirect('/student/feedback/examination');
    }

    // Compute average rating
    const ratings = [Number(teachingStyle), Number(contentDelivery), Number(engagement)];
    const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

    const feedback = new Feedback({
      student: req.user._id,
      teacher: teacherId,
      type: feedbackType || 'general',
      feedbackText: comments || '',
      rating: averageRating,
      teachingStyle: Number(teachingStyle),
      contentDelivery: Number(contentDelivery),
      engagement: Number(engagement),
      submittedAt: new Date()
    });
    // Award badge if this is the student's 5th feedback
    const feedbackCount = await Feedback.countDocuments({ student: req.user._id });
      if (feedbackCount === 5) {
        const badge = new Badge({
          student: req.user._id,
          name: 'Feedback Pro',
          description: 'Awarded for submitting 5 feedbacks',
          icon: 'fas fa-medal'
        });
        await badge.save();
      }
    await feedback.save();

    req.flash('success_msg', 'Feedback submitted successfully!');
    res.redirect('/student/dashboard');
  } catch (err) {
    console.error('Feedback Submission Error:', err);
    req.flash('error_msg', 'An error occurred while submitting feedback.');
    res.redirect('/student/feedback/examination');
  }
});

// Materials Routes
router.get('/materials', ensureStudent, async (req, res) => {
  try {
    const materials = await Material.find().sort({ createdAt: -1 });
    res.render('student/materials', {
      layout: 'layouts/boilerplate',
      title: 'Study Materials',
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
    res.redirect('/student/dashboard');
  }
});

router.get('/schedule', ensureStudent, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' });
    const teacherIds = teachers.map(teacher => teacher._id);
    const schedules = await Schedule.find({ teacher: { $in: teacherIds } }).populate('teacher').sort({ date: 1 });

    res.render('student/schedule', {
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
    res.redirect('/student/dashboard');
  }
});

module.exports = router;