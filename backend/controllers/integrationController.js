// backend/controllers/integrationController.js
const Form = require('../models/Form');
const clickupUtils = require('../utils/clickupUtils');
const { addLog } = require('../routes/makeRoutes');
const { transformClickUpData } = require('./clickupController');

// Handle incoming webhooks from Make.com
exports.handleMakeWebhook = async (req, res) => {
  try {
    console.log('Received webhook from Make.com', JSON.stringify(req.body, null, 2));
    
    // Log the incoming webhook
    addLog('info', 'Webhook from Make.com received', {
      source: 'Make.com',
      body: req.body
    }, 'Integration Controller');
    
    const webhookData = req.body;
    
    // Check what operation is requested
    switch (webhookData.operation) {
      case 'createTask': 
        await processTaskCreation(webhookData, res);
        break;
        
      case 'updateTask':
        await processTaskUpdate(webhookData, res);
        break;
        
      case 'syncForm':
        await processFormSync(webhookData, res);
        break;
        
      case 'syncExternalForm':
        await processExternalFormSync(webhookData, res);
        break;
        
      default:
        // Unknown operation
        addLog('warning', 'Unknown operation in Make.com webhook', {
          operation: webhookData.operation
        }, 'Integration Controller');
        
        res.status(400).json({
          success: false,
          message: 'Unknown operation'
        });
    }
  } catch (error) {
    console.error('Error processing Make.com webhook:', error);
    
    addLog('error', 'Error processing Make.com webhook', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

// Handle incoming webhooks from n8n
exports.handleN8nWebhook = async (req, res) => {
  try {
    console.log('Received webhook from n8n', JSON.stringify(req.body, null, 2));
    
    // Log the incoming webhook
    addLog('info', 'Webhook from n8n received', {
      source: 'n8n',
      body: req.body
    }, 'Integration Controller');
    
    const webhookData = req.body;
    
    // Check what operation is requested
    switch (webhookData.operation) {
      case 'createTask': 
        await processTaskCreation(webhookData, res);
        break;
        
      case 'updateTask':
        await processTaskUpdate(webhookData, res);
        break;
        
      case 'syncForm':
        await processFormSync(webhookData, res);
        break;
        
      case 'syncExternalForm':
        await processExternalFormSync(webhookData, res);
        break;
        
      default:
        // Unknown operation
        addLog('warning', 'Unknown operation in n8n webhook', {
          operation: webhookData.operation
        }, 'Integration Controller');
        
        res.status(400).json({
          success: false,
          message: 'Unknown operation'
        });
    }
  } catch (error) {
    console.error('Error processing n8n webhook:', error);
    
    addLog('error', 'Error processing n8n webhook', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

// Process ClickUp task creation from webhook
async function processTaskCreation(webhookData, res) {
  try {
    // Extract ClickUp task data
    const clickupTask = webhookData.task;
    
    if (!clickupTask || !clickupTask.id) {
      throw new Error('Invalid ClickUp task data');
    }
    
    // Transform ClickUp data to our form format
    const formData = transformClickUpData(clickupTask);
    
    // Check if the task already exists in our database
    const existingForm = await Form.findOne({ taskId: formData.taskId });
    
    if (existingForm) {
      // Task already exists, update it
      const updatedForm = await Form.findOneAndUpdate(
        { taskId: formData.taskId },
        { $set: formData },
        { new: true }
      );
      
      addLog('success', `Updated existing task: ${formData.leadName}`, {
        taskId: formData.taskId,
        operation: 'create_existing'
      }, 'Integration Controller');
      
      return res.json({
        success: true,
        message: 'Task updated',
        form: updatedForm
      });
    }
    
    // Create new form in database
    const newForm = new Form(formData);
    await newForm.save();
    
    addLog('success', `Created new task: ${formData.leadName}`, {
      taskId: formData.taskId,
      operation: 'create'
    }, 'Integration Controller');
    
    res.json({
      success: true,
      message: 'Task created',
      form: newForm
    });
  } catch (error) {
    console.error('Error processing task creation:', error);
    addLog('error', 'Error processing task creation', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
}

// Process ClickUp task update from webhook
async function processTaskUpdate(webhookData, res) {
  try {
    // Extract ClickUp task data
    const clickupTask = webhookData.task;
    const taskId = webhookData.taskId || (clickupTask ? clickupTask.id : null);
    
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    // Get task from database
    const form = await Form.findOne({ taskId });
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Task not found in the dashboard'
      });
    }
    
    // If there's updated task data, transform and update
    if (clickupTask) {
      const formData = transformClickUpData(clickupTask);
      
      // Update the form
      const updatedForm = await Form.findOneAndUpdate(
        { taskId },
        { $set: formData },
        { new: true }
      );
      
      addLog('success', `Updated task via webhook: ${formData.leadName}`, {
        taskId,
        operation: 'update'
      }, 'Integration Controller');
      
      return res.json({
        success: true,
        message: 'Task updated',
        form: updatedForm
      });
    }
    
    // If no task data but updateData is provided
    if (webhookData.updateData) {
      const updatedForm = await Form.findOneAndUpdate(
        { taskId },
        { $set: webhookData.updateData },
        { new: true }
      );
      
      // Sync updated form back to ClickUp if needed
      if (webhookData.syncBack === true) {
        try {
          await clickupUtils.syncFormToClickUp(updatedForm);
          addLog('info', 'Form synced back to ClickUp', {
            taskId,
            operation: 'sync-back'
          }, 'Integration Controller');
        } catch (syncError) {
          addLog('warning', 'Failed to sync form back to ClickUp', {
            taskId,
            error: syncError.message
          }, 'Integration Controller');
        }
      }
      
      addLog('success', `Updated task with direct data: ${updatedForm.leadName}`, {
        taskId,
        fields: Object.keys(webhookData.updateData),
        operation: 'update-fields'
      }, 'Integration Controller');
      
      return res.json({
        success: true,
        message: 'Task fields updated',
        form: updatedForm
      });
    }
    
    // If we got here, return the existing form
    res.json({
      success: true,
      message: 'No updates performed',
      form
    });
  } catch (error) {
    console.error('Error processing task update:', error);
    addLog('error', 'Error processing task update', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
}

// Process form sync to ClickUp
async function processFormSync(webhookData, res) {
  try {
    const { taskId } = webhookData;
    
    if (!taskId) {
      throw new Error('Task ID is required');
    }
    
    // Find form in database
    const form = await Form.findOne({ taskId });
    
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }
    
    // Sync form to ClickUp
    await clickupUtils.syncFormToClickUp(form);
    
    addLog('success', `Synced form to ClickUp: ${form.leadName}`, {
      taskId,
      operation: 'sync'
    }, 'Integration Controller');
    
    res.json({
      success: true,
      message: 'Form synced with ClickUp',
      form
    });
  } catch (error) {
    console.error('Error processing form sync:', error);
    addLog('error', 'Error processing form sync', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error syncing form',
      error: error.message
    });
  }
}

// Process external form sync (from Erstberatungsformular)
// Also export this for direct access
exports.processExternalFormSync = async function processExternalFormSync(webhookData, res) {
  try {
    // Get form data from external source
    const { formData, clickupTaskId } = webhookData;
    
    if (!formData) {
      throw new Error('Form data is required');
    }
    
    // Find or create form in database
    let form;
    let isNew = false;
    
    if (clickupTaskId) {
      // If there's a ClickUp task ID, try to find existing form
      form = await Form.findOne({ taskId: clickupTaskId });
    }
    
    if (!form && formData.taskId) {
      // If there's a taskId in the form data, try to find by that
      form = await Form.findOne({ taskId: formData.taskId });
    }
    
    if (!form) {
      // Create new form if none exists
      isNew = true;
      
      // If we have a ClickUp task ID, use it, otherwise generate a temporary one
      const taskId = clickupTaskId || `temp-${Date.now()}`;
      
      form = new Form({
        taskId,
        leadName: formData.leadName || 'Neuer Mandant',
        phase: 'erstberatung',
        qualifiziert: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    // Update form with external data
    // Map external form fields to our form fields
    // Adjust this mapping according to your actual form fields
    if (formData.name) form.leadName = formData.name;
    if (formData.email) form.email = formData.email;
    if (formData.telefon) form.telefon = formData.telefon;
    if (formData.strasse) form.strasse = formData.strasse;
    if (formData.hausnummer) form.hausnummer = formData.hausnummer;
    if (formData.plz) form.plz = formData.plz;
    if (formData.wohnort) form.wohnort = formData.wohnort;
    if (formData.glaeubiger) form.glaeubiger = formData.glaeubiger;
    if (formData.gesamtSchulden) form.gesamtSchulden = formData.gesamtSchulden;
    
    // Save form
    form.updatedAt = new Date();
    await form.save();
    
    // Sync form to ClickUp if needed
    if (webhookData.syncToClickUp !== false) {
      try {
        await clickupUtils.syncFormToClickUp(form);
        addLog('info', 'External form synced to ClickUp', {
          taskId: form.taskId,
          operation: 'external-sync'
        }, 'Integration Controller');
      } catch (syncError) {
        addLog('warning', 'Failed to sync external form to ClickUp', {
          taskId: form.taskId,
          error: syncError.message
        }, 'Integration Controller');
      }
    }
    
    addLog('success', `${isNew ? 'Created' : 'Updated'} form from external source: ${form.leadName}`, {
      taskId: form.taskId,
      operation: isNew ? 'external-create' : 'external-update'
    }, 'Integration Controller');
    
    res.json({
      success: true,
      message: `Form ${isNew ? 'created' : 'updated'} from external source`,
      form
    });
  } catch (error) {
    console.error('Error processing external form sync:', error);
    addLog('error', 'Error processing external form sync', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error syncing external form',
      error: error.message
    });
  }
}

// Sync all forms with ClickUp (admin function)
exports.syncAllWithClickUp = async (req, res) => {
  try {
    const forms = await Form.find();
    
    const results = {
      total: forms.length,
      successful: 0,
      failed: 0,
      errors: []
    };
    
    addLog('info', 'Starting sync of all forms with ClickUp', {
      totalForms: forms.length
    }, 'Integration Controller');
    
    // Process forms sequentially to avoid rate limits
    for (const form of forms) {
      try {
        await clickupUtils.syncFormToClickUp(form);
        results.successful++;
        
        addLog('success', `Successfully synced form: ${form.leadName}`, {
          taskId: form.taskId
        }, 'Integration Controller');
      } catch (error) {
        results.failed++;
        results.errors.push({
          taskId: form.taskId,
          error: error.message
        });
        
        addLog('error', `Failed to sync form: ${form.leadName}`, {
          taskId: form.taskId,
          error: error.message
        }, 'Integration Controller');
      }
    }
    
    addLog('success', 'Completed sync of all forms with ClickUp', {
      results
    }, 'Integration Controller');
    
    res.json({
      success: true,
      message: 'Synchronization complete',
      results
    });
  } catch (error) {
    console.error('Error syncing all forms with ClickUp:', error);
    addLog('error', 'Error syncing all forms with ClickUp', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error syncing all forms with ClickUp',
      error: error.message
    });
  }
};

// Configure integration based on environment variables
exports.configureIntegration = async (req, res) => {
  try {
    const { 
      integrationType,
      makeWebhookUrl,
      n8nWebhookUrl,
      clickupApiKey
    } = req.body;
    
    // Validate required fields based on integration type
    if (integrationType === 'make' && !makeWebhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Make.com webhook URL is required'
      });
    }
    
    if (integrationType === 'n8n' && !n8nWebhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'n8n webhook URL is required'
      });
    }
    
    // Update .env file with new configuration
    const fs = require('fs');
    const dotenv = require('dotenv');
    const envConfig = dotenv.parse(fs.readFileSync('.env'));
    
    // Update config values
    if (integrationType) envConfig.INTEGRATION_TYPE = integrationType;
    if (makeWebhookUrl) envConfig.MAKE_WEBHOOK_URL = makeWebhookUrl;
    if (n8nWebhookUrl) envConfig.N8N_WEBHOOK_URL = n8nWebhookUrl;
    if (clickupApiKey) envConfig.CLICKUP_API_KEY = clickupApiKey;
    
    // Save updated .env file
    const envContent = Object.keys(envConfig)
      .map(key => `${key}=${envConfig[key]}`)
      .join('\n');
    
    fs.writeFileSync('.env', envContent);
    
    // Also update process.env for current session
    if (integrationType) process.env.INTEGRATION_TYPE = integrationType;
    if (makeWebhookUrl) process.env.MAKE_WEBHOOK_URL = makeWebhookUrl;
    if (n8nWebhookUrl) process.env.N8N_WEBHOOK_URL = n8nWebhookUrl;
    if (clickupApiKey) process.env.CLICKUP_API_KEY = clickupApiKey;
    
    addLog('success', 'Integration configuration updated', {
      integrationType,
      makeConfigured: !!makeWebhookUrl,
      n8nConfigured: !!n8nWebhookUrl,
      clickupApiKeyUpdated: !!clickupApiKey
    }, 'Integration Controller');
    
    res.json({
      success: true,
      message: 'Integration configuration updated',
      config: {
        integrationType: process.env.INTEGRATION_TYPE,
        makeWebhookConfigured: !!process.env.MAKE_WEBHOOK_URL,
        n8nWebhookConfigured: !!process.env.N8N_WEBHOOK_URL,
        clickupApiKeyConfigured: !!process.env.CLICKUP_API_KEY
      }
    });
  } catch (error) {
    console.error('Error configuring integration:', error);
    addLog('error', 'Error configuring integration', {
      error: error.message,
      stack: error.stack
    }, 'Integration Controller');
    
    res.status(500).json({
      success: false,
      message: 'Error configuring integration',
      error: error.message
    });
  }
};