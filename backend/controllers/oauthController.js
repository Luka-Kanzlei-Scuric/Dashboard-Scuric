// controllers/oauthController.js
const passport = require('passport');
const clickupUtils = require('../utils/clickupUtils');

// Safe logging function that won't crash if the real addLog isn't available
const safeLog = (type, message, details = {}, source = 'OAuth Controller') => {
  try {
    // Try to use the addLog function from makeRoutes if available
    const makeRoutes = require('../routes/makeRoutes');
    if (typeof makeRoutes.addLog === 'function') {
      makeRoutes.addLog(type, message, details, source);
    } else {
      // Fallback to console logging
      console.log(`[${type.toUpperCase()}] [${source}] ${message}`, details);
    }
  } catch (error) {
    // If anything fails, just log to console
    console.log(`[${type.toUpperCase()}] [${source}] ${message}`, details);
    console.error('Error using log system:', error.message);
  }
};

// Initiate OAuth flow
exports.initiateOAuth = (req, res, next) => {
  try {
    const redirectURL = req.query.redirectUrl || process.env.FRONTEND_URL || 'https://dashboard-scuric.vercel.app';
    
    // Store the redirect URL in session for later use
    req.session.redirectURL = redirectURL;
    
    // Log the initiation of OAuth
    safeLog('info', 'Initiating ClickUp OAuth flow', {
      redirectURL,
      timestamp: new Date().toISOString()
    });
    
    // Generate a custom state parameter to validate the callback
    const state = Math.random().toString(36).substring(2, 15);
    req.session.oauthState = state;
    
    // Authenticate using the clickup strategy
    passport.authenticate('clickup', {
      scope: ['task:read', 'task:write', 'webhook:read', 'webhook:write'],
      state: state
    })(req, res, next);
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    safeLog('error', 'Fehler beim Initiieren des OAuth-Flows', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth flow',
      error: error.message
    });
  }
};

// Handle OAuth callback
exports.handleOAuthCallback = (req, res, next) => {
  console.log('Received OAuth callback with params:', {
    code: req.query.code ? 'present' : 'missing',
    state: req.query.state || 'missing'
  });
  
  // Validate the state parameter to prevent CSRF
  if (req.session.oauthState && req.query.state !== req.session.oauthState) {
    console.warn('OAuth state mismatch: expected', req.session.oauthState, 'got', req.query.state);
    // For ClickUp we'll continue anyway since their handling is inconsistent
  }
  
  passport.authenticate('clickup', { session: false }, async (err, userData) => {
    try {
      if (err) {
        safeLog('error', 'OAuth callback authentication error', {
          error: err.message
        });
        
        return res.status(500).json({
          success: false,
          message: 'OAuth authentication failed',
          error: err.message
        });
      }
      
      if (!userData || !userData.accessToken) {
        safeLog('error', 'OAuth callback received invalid user data', {
          userData: userData || 'undefined'
        });
        
        return res.status(400).json({
          success: false,
          message: 'OAuth callback received invalid user data'
        });
      }
      
      // Save the token to database
      const savedToken = await clickupUtils.saveOAuthToken(
        userData.accessToken,
        userData.refreshToken,
        (userData.expiresAt - Date.now()) / 1000 // Convert expiry to seconds
      );
      
      safeLog('success', 'OAuth authentication successful, token saved', {
        tokenId: savedToken._id,
        expiresAt: savedToken.expiresAt
      });
      
      // Get redirect URL from session or use default
      const redirectURL = req.session.redirectURL || process.env.FRONTEND_URL || 'https://dashboard-scuric.vercel.app';
      
      // Clear the session redirect URL
      req.session.redirectURL = null;
      
      // Redirect to frontend with success indicator
      res.redirect(`${redirectURL}?oauth=success&provider=clickup`);
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      safeLog('error', 'Error in OAuth callback handler', {
        error: error.message,
        stack: error.stack
      });
      
      // Redirect to frontend with error indicator
      const redirectURL = req.session.redirectURL || process.env.FRONTEND_URL || 'https://dashboard-scuric.vercel.app';
      res.redirect(`${redirectURL}?oauth=error&message=${encodeURIComponent(error.message)}`);
    }
  })(req, res, next);
};

// Get current OAuth status
exports.getOAuthStatus = async (req, res) => {
  try {
    // Check for valid OAuth token
    const OAuthToken = require('../models/OAuthToken');
    const token = await OAuthToken.findOne({ provider: 'clickup' }).sort({ updatedAt: -1 });
    
    if (!token) {
      return res.json({
        success: true,
        authenticated: false,
        message: 'No OAuth token found'
      });
    }
    
    // Check if token is expired
    const isExpired = new Date(token.expiresAt) <= new Date();
    
    // Test the token by making an API call
    let isValid = false;
    if (!isExpired) {
      try {
        await clickupUtils.testConnection(token.accessToken);
        isValid = true;
      } catch (error) {
        console.error('Token validation failed:', error);
        isValid = false;
      }
    }
    
    res.json({
      success: true,
      authenticated: isValid,
      expires: token.expiresAt,
      expired: isExpired,
      tokenExists: true,
      provider: 'clickup'
    });
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    safeLog('error', 'Fehler beim Überprüfen des OAuth-Status', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to check OAuth status',
      error: error.message
    });
  }
};