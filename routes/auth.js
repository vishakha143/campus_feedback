const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const csrfProtection = require('csurf')({ cookie: true });
const { saveAndSendOTP } = require('../utils/sendOTP');
const { ensureAuthenticated, forwardAuthenticated } = require('../middleware/auth');

// Register Page
router.get('/register', forwardAuthenticated, async (req, res) => {
  try {
    console.log('Rendering register page');
    res.render('auth/register', {
      layout: 'layouts/boilerplate',
      title: 'Register',
      formData: {},
      errors: [], // Always pass an empty errors array
      lang: res.locals.lang,
      theme: res.locals.theme,
    
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Error rendering register page:', err);
    req.flash('error_msg', 'An error occurred while loading the register page.');
    res.redirect('/');
  }
});

// Register Handle
router.post('/register', csrfProtection, async (req, res) => {
  try {
    console.log('Processing registration request:', req.body);
    const { username, email, password, password2, role } = req.body;
    let errors = [];

    // Basic field validation
    if (!username || !email || !password || !password2 || !role) {
      errors.push({ msg: req.__('Please enter all fields') });
      console.log('Validation error: Missing fields', errors);
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ msg: req.__('Please enter a valid email address') });
      console.log('Validation error: Invalid email format', errors);
    }

    // Password validation
    if (password !== password2) {
      errors.push({ msg: req.__('Passwords do not match') });
      console.log('Validation error: Passwords do not match', errors);
    }
    if (password.length < 6) {
      errors.push({ msg: req.__('Password must be at least 6 characters') });
      console.log('Validation error: Password too short', errors);
    }

    if (errors.length > 0) {
      console.log('Validation errors, re-rendering register page:', { errors });
      return res.render('auth/register', {
        layout: 'layouts/boilerplate',
        title: 'Register',
        errors,
        formData: { username, email, role },
        lang: res.locals.lang,
        theme: res.locals.theme,
        success_msg: res.locals.success_msg,
        error_msg: res.locals.error_msg,
        error: res.locals.error,
        csrfToken: req.csrfToken()
      });
    }

    console.log('Checking for existing user with email:', email);
    const userByEmail = await User.findOne({ email });
    if (userByEmail) {
      console.log('Email exists, setting flash message');
      req.flash('error_msg', req.__('Email already exists'));
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.render('auth/register', {
            layout: 'layouts/boilerplate',
            title: 'Register',
            errors: [{ msg: req.__('Session error. Please try again.') }],
            formData: { username, email, role },
            lang: res.locals.lang,
            theme: res.locals.theme,
            success_msg: res.locals.success_msg,
            error_msg: res.locals.error_msg,
            error: res.locals.error,
            csrfToken: req.csrfToken()
          });
        }
        console.log('Redirecting to /auth/register');
        res.redirect('/auth/register');
      });
      return;
    }

    console.log('Creating new user');
    const newUser = new User({
      username,
      email,
      role
    });

    console.log('Setting password with passport-local-mongoose');
    await new Promise((resolve, reject) => {
      newUser.setPassword(password, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    console.log('Saving user to database');
    await newUser.save();
    console.log('User saved successfully:', { username, email, role });

    console.log('Sending OTP to email:', email);
    const otpSent = await saveAndSendOTP(email);
    if (!otpSent) {
      console.error('Failed to send OTP for email:', email);
      errors.push({ msg: req.__('Failed to send OTP. Please try again.') });
      return res.render('auth/register', {
        layout: 'layouts/boilerplate',
        title: 'Register',
        errors,
        formData: { username, email, role },
        lang: res.locals.lang,
        theme: res.locals.theme,
        success_msg: res.locals.success_msg,
        error_msg: res.locals.error_msg,
        error: res.locals.error,
        csrfToken: req.csrfToken()
      });
    }
    console.log('OTP sent successfully to:', email);

    console.log('Setting session with pendingUserEmail:', email);
    req.session.pendingUserEmail = email;
    req.flash('success_msg', req.__('OTP sent to your email. Please verify to complete registration.'));
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('auth/register', {
          layout: 'layouts/boilerplate',
          title: 'Register',
          errors: [{ msg: req.__('Session error. Please try again.') }],
          formData: { username, email, role },
          lang: res.locals.lang,
          theme: res.locals.theme,
          success_msg: res.locals.success_msg,
          error_msg: res.locals.error_msg,
          error: res.locals.error,
          csrfToken: req.csrfToken()
        });
      }
      console.log('Redirecting to /auth/verify-otp');
      res.redirect('/auth/verify-otp');
    });
  } catch (err) {
    console.error('Registration Error:', {
      message: err.message,
      stack: err.stack,
      requestBody: req.body
    });
    req.flash('error_msg', req.__('An error occurred during registration.'));
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.render('auth/register', {
          layout: 'layouts/boilerplate',
          title: 'Register',
          errors: [{ msg: req.__('Session error. Please try again.') }],
          formData: req.body,
          lang: res.locals.lang,
          theme: res.locals.theme,
          success_msg: res.locals.success_msg,
          error_msg: res.locals.error_msg,
          error: res.locals.error,
          csrfToken: req.csrfToken()
        });
      }
      res.redirect('/auth/register');
    });
  }
});

// OTP Verification Page
router.get('/verify-otp', forwardAuthenticated, async (req, res) => {
  try {
    console.log('Accessing verify-otp route, session pendingUserEmail:', req.session.pendingUserEmail);
    if (!req.session.pendingUserEmail) {
      console.log('No pending verification found, redirecting to register');
      req.flash('error_msg', req.__('No pending verification found. Please register again.'));
      return res.redirect('/auth/register');
    }

    res.render('auth/verify-otp', {
      layout: 'layouts/boilerplate',
      title: 'Verify OTP',
      email: req.session.pendingUserEmail,
      lang: res.locals.lang,
      theme: res.locals.theme,
    
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Error rendering verify-otp page:', err);
    req.flash('error_msg', req.__('An error occurred while loading the OTP verification page.'));
    res.redirect('/auth/register');
  }
});

// OTP Verification Handle
router.post('/verify-otp', async (req, res) => {
  try {
    console.log('Processing OTP verification:', req.body);
    const { otp } = req.body;
    const email = req.session.pendingUserEmail;

    if (!email) {
      console.log('No pending verification found, redirecting to register');
      req.flash('error_msg', req.__('No pending verification found. Please register again.'));
      return res.redirect('/auth/register');
    }

    const otpRecord = await OTP.findOne({ email, otp, used: false });
    if (!otpRecord) {
      console.log('Invalid or expired OTP, re-rendering verify-otp page');
      req.flash('error_msg', req.__('Invalid or expired OTP.'));
      return res.render('auth/verify-otp', {
        layout: 'layouts/boilerplate',
        title: 'Verify OTP',
        email,
        lang: res.locals.lang,
        theme: res.locals.theme,
      
        success_msg: res.locals.success_msg,
        error_msg: res.locals.error_msg,
        error: res.locals.error
      });
    }

    otpRecord.used = true;
    await otpRecord.save();

    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found, redirecting to register');
      req.flash('error_msg', req.__('User not found. Please register again.'));
      return res.redirect('/auth/register');
    }

    user.verified = true;
    await user.save();

    req.session.pendingUserEmail = null;
    console.log('OTP verified, session cleared, redirecting to login');
    req.flash('success_msg', req.__('Email verified successfully. Please login.'));
    res.redirect('/auth/login');
  } catch (err) {
    console.error('OTP Verification Error:', err);
    req.flash('error_msg', req.__('An error occurred during OTP verification.'));
    res.redirect('/auth/verify-otp');
  }
});

// Resend OTP
router.get('/resend-otp', forwardAuthenticated, async (req, res) => {
  try {
    console.log('Accessing resend-otp route, session pendingUserEmail:', req.session.pendingUserEmail);
    const email = req.session.pendingUserEmail;

    if (!email) {
      console.log('No pending verification found, redirecting to register');
      req.flash('error_msg', req.__('No pending verification found. Please register again.'));
      return res.redirect('/auth/register');
    }

    const otpSent = await saveAndSendOTP(email);
    if (!otpSent) {
      console.error('Failed to resend OTP for email:', email);
      req.flash('error_msg', req.__('Failed to send OTP. Please try again.'));
    } else {
      console.log('OTP resent successfully to:', email);
      req.flash('success_msg', req.__('OTP resent to your email.'));
    }
    res.redirect('/auth/verify-otp');
  } catch (err) {
    console.error('Resend OTP Error:', err);
    req.flash('error_msg', req.__('An error occurred while resending OTP.'));
    res.redirect('/auth/verify-otp');
  }
});

// Login Page
router.get('/login', forwardAuthenticated, async (req, res) => {
  try {
    console.log('Rendering login page');
    const formDataFlash = req.flash('formData'); // Access once
    console.log('Flash formData retrieved:', formDataFlash);
    const formData = formDataFlash[0] && formDataFlash[0] !== 'undefined' ? JSON.parse(formDataFlash[0]) : {};
    console.log('Parsed formData:', formData); // Debug log
    req.flash('error_msg' , req.__('login to continue'));
    res.render('auth/login', {
      layout: 'layouts/boilerplate',
      title: 'Login',
      formData,
      lang: res.locals.lang,
      theme: res.locals.theme,
      success_msg: res.locals.success_msg,
      error_msg: res.locals.error_msg,
      error: res.locals.error
    });
  } catch (err) {
    console.error('Error rendering login page:', err);
    req.flash('error_msg', req.__('An error occurred while loading the login page.'));
    res.redirect('/');
  }
});
// Login Handle
router.post('/login', csrfProtection, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error_msg', info.message || req.__('Invalid email or password'));
      req.flash('formData', JSON.stringify({ email: req.body.email }));
      req.session.save(() => res.redirect('/auth/login'));
      return;
    }
    req.logIn(user, (err) => {
      if (err) return next(err);
      req.flash('success_msg', req.__('Logged in successfully')); 
     
      req.session.save((err) => {
        if (err) console.error('Session save error:', err);
        res.redirect('/dashboard');
      });
    });
  })(req, res, next);
});

// Logout Handle
router.get('/logout', ensureAuthenticated, (req, res) => {
  console.log('Processing logout request for user:', req.user.email);
  req.flash('success_msg', req.__('You are logged out')); 
  req.logout((err) => {
    if (err) {
      console.error('Logout Error:', err);
      req.flash('error_msg', req.__('Logout failed'));
      req.session.save(() => res.redirect('/dashboard'));
      return;
    }
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        res.redirect('/dashboard');
        return;
      }
      req.session.destroy((err) => {
        if (err) {
          console.error('Session Destroy Error:', err);
          res.redirect('/dashboard');
          return;
        }
        res.redirect('/auth/login');
      });
    });
  });
});

module.exports = router;