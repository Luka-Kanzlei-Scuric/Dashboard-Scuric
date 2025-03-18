// backend/controllers/clickupController.js
const Form = require('../models/Form');
const { addLog, transformClickUpData } = require('../routes/makeRoutes');
const clickupUtils = require('../utils/clickupUtils');

// Map dashboard phases to ClickUp statuses
const mapPhaseToClickUpStatus = clickupUtils.mapPhaseToClickUpStatus;

// Process Make.com webhook for ClickUp tasks
exports.handleMakeWebhook = async (req, res) => {
  try {
    // Log the incoming webhook data
    console.log('Received data from Make.com:', JSON.stringify(req.body, null, 2));
    
    // Extract the task data from the request
    const taskData = req.body;
    
    if (!taskData || !taskData.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task data received'
      });
    }
    
    // Transform task data using the utility function
    const transformedData = transformClickUpData(taskData);
    
    // Check if the task already exists in our database
    let form = await Form.findOne({ taskId: transformedData.taskId });
    let operationType;
    
    if (form) {
      // Update existing form
      operationType = 'updated';
      form = await Form.findOneAndUpdate(
        { taskId: transformedData.taskId },
        { $set: transformedData },
        { new: true }
      );
      
      addLog('success', `Updated lead from ClickUp: ${transformedData.leadName}`, {
        taskId: transformedData.taskId,
        operation: 'update'
      }, 'Make Integration');
    } else {
      // Create new form
      operationType = 'created';
      const newForm = new Form(transformedData);
      form = await newForm.save();
      
      addLog('success', `Created new lead from ClickUp: ${transformedData.leadName}`, {
        taskId: transformedData.taskId,
        operation: 'create'
      }, 'Make Integration');
    }
    
    // Return success response
    res.json({
      success: true,
      message: `Task ${operationType} successfully`,
      form: form
    });
    
  } catch (error) {
    console.error('Error processing Make.com webhook:', error);
    
    // Log the error
    addLog('error', 'Error processing Make.com webhook', {
      error: error.message,
      stack: error.stack,
      body: req.body
    }, 'Make Integration');
    
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook data',
      error: error.message
    });
  }
};