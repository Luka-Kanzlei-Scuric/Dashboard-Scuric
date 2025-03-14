// controllers/oauthController.js
const passport = require('passport');
const clickupUtils = require('../utils/clickupUtils');
const { addLog } = require('../routes/makeRoutes');

// Initiate OAuth flow
exports.initiateOAuth = (req, res, next) => {
  try {
    const redirectURL = req.query.redirectUrl || process.env.FRONTEND_URL || 'https://dashboard-scuric.vercel.app';
    
    // Store the redirect URL in session for later use
    req.session.redirectURL = redirectURL;
    
    // Log the initiation of OAuth
    addLog('info', 'Initiating ClickUp OAuth flow', {
      redirectURL,
      timestamp: new Date().toISOString()
    }, 'OAuth Controller');
    
    // Authenticate using the clickup strategy
    passport.authenticate('clickup', {
      scope: ['task:read', 'task:write', 'webhook:read', 'webhook:write'],
      state: true
    })(req, res, next);
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    addLog('error', 'Fehler beim Initiieren des OAuth-Flows', {
      error: error.message,
      stack: error.stack
    }, 'OAuth Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to initiate OAuth flow',
      error: error.message
    });
  }
};

// Handle OAuth callback
exports.handleOAuthCallback = (req, res, next) => {
  passport.authenticate('clickup', { session: false }, async (err, userData) => {
    try {
      if (err) {
        addLog('error', 'OAuth callback authentication error', {
          error: err.message
        }, 'OAuth Controller');
        
        return res.status(500).json({
          success: false,
          message: 'OAuth authentication failed',
          error: err.message
        });
      }
      
      if (!userData || !userData.accessToken) {
        addLog('error', 'OAuth callback received invalid user data', {
          userData: userData || 'undefined'
        }, 'OAuth Controller');
        
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
      
      addLog('success', 'OAuth authentication successful, token saved', {
        tokenId: savedToken._id,
        expiresAt: savedToken.expiresAt
      }, 'OAuth Controller');
      
      // Get redirect URL from session or use default
      const redirectURL = req.session.redirectURL || process.env.FRONTEND_URL || 'https://dashboard-scuric.vercel.app';
      
      // Clear the session redirect URL
      req.session.redirectURL = null;
      
      // Redirect to frontend with success indicator
      res.redirect(`${redirectURL}?oauth=success&provider=clickup`);
    } catch (error) {
      console.error('Error in OAuth callback:', error);
      addLog('error', 'Error in OAuth callback handler', {
        error: error.message,
        stack: error.stack
      }, 'OAuth Controller');
      
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
    addLog('error', 'Fehler beim Überprüfen des OAuth-Status', {
      error: error.message,
      stack: error.stack
    }, 'OAuth Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to check OAuth status',
      error: error.message
    });
  }
};