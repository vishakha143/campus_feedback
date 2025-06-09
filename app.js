require('dotenv').config(); //  environment variables 

const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');
const i18n = require('./config/i18n');
const connectDB = require('./config/db');
const path = require('path');
const csrf = require('csurf');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const ejsMate = require("ejs-mate");
const MongoStore = require('connect-mongo');

const app = express();
const http = require('http');
const socketIo = require('socket.io');
const server = http.createServer(app);
const io = socketIo(server);

// Load Models
const User = require('./models/User');
const Feedback = require('./models/Feedback');

// Load Department model (if it exists, otherwise create it)
let Department;
try {
  Department = mongoose.model('Department');
} catch (err) {
  const departmentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String }
  });
  departmentSchema.index({ name: 1 });
  Department = mongoose.model('Department', departmentSchema);
}

// Connect to MongoDB
//connectDB().catch(err => console.error('MongoDB connection error:', err));
const dbUrl = process.env.ATLASDB_URL || 'mongodb://localhost:27017/campus_feedback';

async function main() {
  try {
    await mongoose.connect(dbUrl);
    console.log('MongoDB connected to:', dbUrl.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

main().then(() => {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: dbUrl }),
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }
  }));

// EJS
app.engine("ejs", ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Static Folder
app.use(express.static(path.join(__dirname, '/public')));
app.use('/vendor', express.static(path.join(__dirname, 'node_modules')));

// Body Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Cookie Parser Middleware
app.use(cookieParser());

// Express Session
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'default-secret',
//   resave: false,
//   saveUninitialized: false,
//   cookie: { 
//     secure: process.env.NODE_ENV === 'production', // Set to true in production with HTTPS
//     maxAge: 24 * 60 * 60 * 1000 // 24 hours
//   }
// }));

// Flash Middleware
app.use(flash());

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(
  { usernameField: 'email' },
  User.authenticate()
));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// CSRF Protection
app.use(csrf({ 
  cookie: { 
    secure: false, 
    sameSite: 'lax' 
  }
}));
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  console.log('CSRF Token generated:', res.locals.csrfToken);
  next();
});

// i18n setup
app.use(i18n.init);
app.use((req, res, next) => {
  console.log('i18n __ function check:', typeof req.__);
  res.locals.__ = req.__ || i18n.__.bind(i18n); // Fallback to i18n.__ if req.__ is undefined
  res.locals.lang = i18n.getLocale(req); // Use i18n.getLocale(req)
  res.locals.theme = req.session.theme || 'light';
  next();
});



// Flash Messages Middleware
app.use((req, res, next) => {
  const successMessages = req.flash('success_msg');
  const errorMessages = req.flash('error_msg');
  const error = req.flash('error');
  console.log('Flash messages retrieved:', {
    success_msg: successMessages,
    error_msg: errorMessages,
    error: error
  });
  res.locals.success_msg = successMessages.length > 0 ? successMessages[0] : null;
  res.locals.error_msg = errorMessages.length > 0 ? errorMessages[0] : null;
  res.locals.error = error.length > 0 ? error[0] : null;
  res.locals.currentPath = req.path;
  res.locals.user = req.user || null;
  res.locals.__ = req.__;
  res.locals.title = 'CampusConnect';
  next();
});

// Logging Middleware for Important Actions
app.use((req, res, next) => {
  const { method, url } = req;
  const user = req.user ? req.user.username : 'Anonymous';
  const timestamp = new Date().toISOString();
  const routesToLog = ['/auth/login', '/auth/register', '/student/feedback/submit', '/admin/delete-user', '/admin/delete-feedback'];
  const methodsToLog = ['POST', 'DELETE'];
  if (routesToLog.some(route => url.startsWith(route)) || methodsToLog.includes(method)) {
    console.log(`[${timestamp}] ${method} ${url} - User: ${user}`);
  }
  next();
});

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/teacher', require('./routes/teacher'));
app.use('/student', require('./routes/student'));
app.use('/admin', require('./routes/admin'));

// Home Route
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Home',
    user: req.user, 
    lang: res.locals.lang, 
    theme: res.locals.theme,
    __: req.__,
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg
  });
});

// Dashboard Route
app.get('/dashboard', (req, res, next) => {
  if (!req.user) {
    req.flash('error_msg', 'Please log in to access the dashboard');
    return res.redirect('/auth/login');
  }
  const role = req.user.role;
  if (role === 'teacher') {
    res.redirect('/teacher/dashboard');
  } else if (role === 'student') {
    res.redirect('/student/dashboard');
  } else if (role === 'admin') {
    res.redirect('/admin/dashboard');
  } else {
    const err = new Error('Unauthorized access');
    err.status = 403;
    next(err);
  }
});

// Language Switch
app.get('/set-lang', (req, res) => {
  try {
    const { lang } = req.query;
    const supportedLangs = ['en', 'es', 'hi', 'ta'];
    if (!lang || !supportedLangs.includes(lang)) {
      throw new Error('Invalid language');
    }
    req.session.lang = lang;
    req.setLocale(lang);
    res.cookie('lang', lang, { maxAge: 900000, httpOnly: true });
    const redirectUrl = req.get('Referer') || '/';
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Language Switch Error:', err.message);
    req.flash('error_msg', 'Error switching language');
    res.redirect('/');
  }
});

// Theme Switch
app.get('/set-theme', (req, res) => {
  try {
    const { theme } = req.query;
    const supportedThemes = ['light', 'dark'];
    if (!theme || !supportedThemes.includes(theme)) {
      throw new Error('Invalid theme mode');
    }
    req.session.theme = theme;
    const redirectUrl = req.get('Referer') || '/';
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('Theme Switch Error:', err.message);
    req.flash('error_msg', 'Error switching theme');
    res.redirect('/');
  }
});

// Search Route
app.get('/search', async (req, res) => {
  const query = req.query.q ? req.query.q.trim() : '';
  let results = [];
  try {
    if (query) {
      const teachers = await User.find({ 
        role: 'teacher', 
        username: { $regex: query, $options: 'i' } 
      }).select('username email').lean();
      const students = await User.find({ 
        role: 'student', 
        username: { $regex: query, $options: 'i' } 
      }).select('username email').lean();
      const departments = await Department.find({ 
        name: { $regex: query, $options: 'i' } 
      }).select('name description').lean();
      results = [
        ...teachers.map(teacher => ({
          type: 'Teacher',
          username: teacher.username,
          email: teacher.email,
          description: ''
        })),
        ...students.map(student => ({
          type: 'Student',
          username: student.username,
          email: student.email,
          description: ''
        })),
        ...departments.map(department => ({
          type: 'Department',
          username: department.name,
          email: '',
          description: department.description || ''
        }))
      ];
    }
    res.render('search', {
      title: 'Search Results',
      user: req.user,
      lang: res.locals.lang,
      theme: res.locals.theme,
      __: req.__,
      query,
      results,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg
    });
  } catch (err) {
    console.error('Search Error:', err);
    req.flash('error_msg', 'An error occurred while searching.');
    res.redirect('/');
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] Application Error:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    user: req.user ? req.user.username : 'Anonymous'
  });
  if (err.code === 'EBADCSRFTOKEN') {
    console.log('CSRF error detected, redirecting to:', req.originalUrl);
    if (typeof req.flash === 'function') {
      req.flash('error_msg', 'Invalid CSRF token. Please try again.');
      req.flash('formData', '{}');
    } else {
      console.warn('req.flash is not available in error handler');
      res.locals.error_msg = 'Invalid CSRF token. Please try again.';
    }
    return res.redirect(req.originalUrl);
  }
  res.status(err.status || 500).render('error', {
    layout: 'layouts/boilerplate',
    title: 'Error - CampusConnect',
    message: err.message || 'Something went wrong',
    error: err,
    user: req.user,
    lang: res.locals.lang || 'en',
    theme: res.locals.theme || 'light',
    __: req.__,
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg
  });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).render('error', {
    layout: 'layouts/boilerplate',
    message: 'Page Not Found',
    error: null, // Explicitly set error to null for 404s
    title: '404 - Page Not Found',
    user: req.user,
    lang: res.locals.lang || 'en',
    theme: res.locals.theme || 'light',
    __: req.__,
    success_msg: res.locals.success_msg,
    error_msg: res.locals.error_msg
  });
});

io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// app.set('io', io); // Make io available in routes
// server.listen(3000, () => {
//   console.log('Server running on port 3000');
// });
const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server running on port ${port}`));
}).catch(err => {
  console.error('Startup error:', err.message);
});