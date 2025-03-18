// backend/routes/clickupRoutes.js
const express = require('express');
const router = express.Router();
const clickupController = require('../controllers/clickupController');

// Handle webhook from Make.com with ClickUp task data
router.post('/make-webhook', clickupController.handleMakeWebhook);

module.exports = router;