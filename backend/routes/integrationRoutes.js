// backend/routes/integrationRoutes.js
const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const Form = require('../models/Form');
const { addLog } = require('./makeRoutes');
// Configuration endpoint
router.post('/configure', integrationController.configureIntegration);

// Make.com webhook endpoint
router.post('/make/webhook', integrationController.handleMakeWebhook);

// n8n webhook endpoint
router.post('/n8n/webhook', integrationController.handleN8nWebhook);

// Sync all forms with ClickUp
router.post('/sync-all', integrationController.syncAllWithClickUp);

// Sync a specific form with ClickUp
router.post('/sync/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Log the request
    addLog('info', 'Request to sync specific form with ClickUp', {
      taskId
    }, 'Integration Routes');
    
    try {
      // Find the form
      const form = await Form.findOne({ taskId });
      
      if (!form) {
        return res.status(404).json({
          success: false,
          message: 'Form not found'
        });
      }
      
      // Pass to controller function for actual sync
      await integrationController.processFormSync({ taskId }, res);
    } catch (error) {
      console.error('Error syncing form:', error);
      addLog('error', 'Error syncing form', {
        taskId,
        error: error.message
      }, 'Integration Routes');
      
      res.status(500).json({
        success: false,
        message: 'Error syncing form',
        error: error.message
      });
    }
  } catch (error) {
    console.error('Error in sync form route:', error);
    res.status(500).json({
      success: false,
      message: 'Error in sync form route',
      error: error.message
    });
  }
});

// Integration status endpoint
router.get('/status', (req, res) => {
  const integrationType = process.env.INTEGRATION_TYPE || 'direct';
  const makeWebhookUrl = process.env.MAKE_WEBHOOK_URL;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  
  res.json({
    success: true,
    integration: {
      type: integrationType,
      make: {
        configured: !!makeWebhookUrl
      },
      n8n: {
        configured: !!n8nWebhookUrl
      }
    }
  });
});

// External form integration endpoint (for Erstberatungsformular)
router.post('/external-form', async (req, res) => {
  try {
    // Create the appropriate format for processExternalFormSync
    const webhookData = {
      operation: 'syncExternalForm',
      formData: req.body,
      clickupTaskId: req.body.taskId || req.body.clickupTaskId
    };
    
    // Call the function as a normal controller method
    await integrationController.processExternalFormSync(webhookData, res);
  } catch (error) {
    console.error('Error handling external form integration:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing external form',
      error: error.message
    });
  }
});

module.exports = router;