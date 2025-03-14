// config/passport.js
const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2');
require('dotenv').config();

// OAuth 2.0 configuration for ClickUp
const configurePassport = () => {
  passport.use('clickup', new OAuth2Strategy({
    authorizationURL: 'https://app.clickup.com/api/v2/oauth/authorize',
    tokenURL: 'https://api.clickup.com/api/v2/oauth/token',
    clientID: process.env.CLICKUP_CLIENT_ID,
    clientSecret: process.env.CLICKUP_CLIENT_SECRET,
    callbackURL: process.env.CLICKUP_CALLBACK_URL || 'https://dashboard-scuric.onrender.com/api/clickup/oauth/callback',
    state: true
  },
  (accessToken, refreshToken, profile, done) => {
    // Store tokens in a secure way
    const userData = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days (ClickUp tokens have a long expiry)
    };
    
    return done(null, userData);
  }));

  // Serialize user data for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

module.exports = configurePassport;