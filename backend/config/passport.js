// config/passport.js
const passport = require('passport');
require('dotenv').config();

// Simplified passport configuration for Make.com integration
const configurePassport = () => {
  // Basic session serialization for potential future use
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user, done) => {
    done(null, user);
  });
  
  console.log('Passport configured for Make.com integration (OAuth disabled)');
};

module.exports = configurePassport;