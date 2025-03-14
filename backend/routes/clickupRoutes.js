// backend/routes/clickupRoutes.js
const express = require('express');
const router = express.Router();
const clickupController = require('../controllers/clickupController');
const oauthController = require('../controllers/oauthController');

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