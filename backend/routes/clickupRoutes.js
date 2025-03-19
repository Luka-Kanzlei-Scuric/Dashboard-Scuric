// backend/routes/clickupRoutes.js
const express = require('express');
const router = express.Router();
const clickupController = require('../controllers/clickupController');
const { addLog } = require('../routes/makeRoutes');
const Form = require('../models/Form');

// Handle webhook from Make.com with ClickUp task data
router.post('/make-webhook', clickupController.handleMakeWebhook);

// DEBUG-ONLY: Get all forms in database
router.get('/debug-forms', async (req, res) => {
  try {
    const forms = await Form.find().select('taskId leadName phase qualifiziert updatedAt createdAt gesamtSchulden');
    console.log('Debug forms:', forms);
    
    addLog('info', 'DEBUG: Alle Forms abgerufen', {
      count: forms.length,
      forms: forms.map(f => ({id: f.taskId, name: f.leadName}))
    }, 'Debug Route');
    
    // CORS-Header werden bereits durch Middleware gesetzt
    
    res.json({
      success: true,
      count: forms.length,
      forms
    });
  } catch (error) {
    console.error('Error in debug-forms:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all leads from ClickUp
router.get('/leads', async (req, res) => {
  try {
    // Log the request
    addLog('info', 'Request to fetch ClickUp leads', {}, 'ClickUp Routes');
    
    // Call to Make.com or n8n
    res.json({
      success: true,
      message: 'Leads lookup not currently implemented',
      tasks: [] // Empty array for now
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    addLog('error', 'Error getting leads', {
      error: error.message,
      stack: error.stack
    }, 'ClickUp Routes');
    
    res.status(500).json({
      success: false,
      message: 'Error getting leads',
      error: error.message
    });
  }
});

// Import a task from ClickUp
router.post('/import/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Log the request
    addLog('info', 'Request to import ClickUp task', {
      taskId
    }, 'ClickUp Routes');
    
    // Return mock response
    res.json({
      success: true,
      message: 'Task import not currently implemented',
      form: {
        taskId,
        leadName: 'Mock Lead',
        phase: 'erstberatung'
      }
    });
  } catch (error) {
    console.error('Error importing task:', error);
    addLog('error', 'Error importing task', {
      error: error.message,
      stack: error.stack
    }, 'ClickUp Routes');
    
    res.status(500).json({
      success: false,
      message: 'Error importing task',
      error: error.message
    });
  }
});

module.exports = router;