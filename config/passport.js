const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
  passport.use(
    new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
      try {
        // Treat username as email
        const user = await User.findOne({ email: username.toLowerCase() });
        if (!user) {
          return done(null, false, { message: 'That email is not registered' });
        }

        if (!user.verified) {
          return done(null, false, { message: 'Please verify your email before logging in' });
        }

        // Use passport-local-mongoose's authenticate method
        user.authenticate(password, (err, authenticated) => {
          if (err) return done(err);
          if (!authenticated) {
            return done(null, false, { message: 'Password incorrect' });
          }
          return done(null, user);
        });
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};