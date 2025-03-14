// backend/routes/clickupRoutes.js
const express = require('express');
const router = express.Router();
const clickupController = require('../controllers/clickupController');
const oauthController = require('../controllers/oauthController');
const fs = require('fs');
const path = require('path');

// Config routes
router.post('/set-api-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        message: 'API key is required'
      });
    }
    
    // Update the environment variable in process
    process.env.CLICKUP_API_KEY = apiKey;
    
    // Try to save to .env file if it exists
    try {
      const envPath = path.join(process.cwd(), '.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Check if CLICKUP_API_KEY already exists in .env
        if (envContent.includes('CLICKUP_API_KEY=')) {
          // Replace existing value
          envContent = envContent.replace(
            /CLICKUP_API_KEY=.*/,
            `CLICKUP_API_KEY=${apiKey}`
          );
        } else {
          // Add new entry
          envContent += `\nCLICKUP_API_KEY=${apiKey}`;
        }
        
        // Write updated content back to .env
        fs.writeFileSync(envPath, envContent);
        console.log('API key saved to .env file');
      } else {
        console.log('.env file does not exist, skipping file update');
      }
    } catch (fileError) {
      console.error('Error saving API key to .env file:', fileError);
      // Continue anyway since we've set the process.env
    }
    
    // Test the connection with the new API key
    try {
      // Get the util function
      const clickupUtils = require('../utils/clickupUtils');
      await clickupUtils.testConnection();
      
      res.json({
        success: true,
        message: 'API key saved and connection verified'
      });
    } catch (testError) {
      // Still return success but with a warning
      res.json({
        success: true,
        message: 'API key saved but connection test failed',
        error: testError.message
      });
    }
    
  } catch (error) {
    console.error('Error saving API key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save API key',
      error: error.message
    });
  }
});

// OAuth routes
router.get('/oauth', oauthController.initiateOAuth);
router.get('/oauth/callback', oauthController.handleOAuthCallback);
router.get('/oauth/status', oauthController.getOAuthStatus);

// Test connection to ClickUp API
router.get('/test', clickupController.testClickUpConnection);

// Get leads from ClickUp
router.get('/leads', clickupController.getLeads);

// Import a ClickUp task
router.post('/import/:taskId', clickupController.importClickUpTask);

// Sync a form with ClickUp
router.post('/sync/:taskId', clickupController.syncFormWithClickUp);

// Sync all forms with ClickUp
router.post('/sync-all', clickupController.syncAllWithClickUp);

// Handle ClickUp webhook
router.post('/webhook', clickupController.handleClickUpWebhook);

// Setup webhooks for ClickUp lists
router.post('/setup-webhooks', clickupController.setupWebhooks);

module.exports = router;