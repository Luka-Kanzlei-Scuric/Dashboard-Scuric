// backend/controllers/clickupController.js
const Form = require('../models/Form');
const { addLog, transformClickUpData } = require('../routes/makeRoutes');
const clickupUtils = require('../utils/clickupUtils');

// ClickUp List IDs from environment variables
const LEADS_LIST_ID = process.env.CLICKUP_LEADS_LIST_ID;
const OFFERS_LIST_ID = process.env.CLICKUP_OFFERS_LIST_ID;

// Map dashboard phases to ClickUp statuses (moved to clickupUtils.js)
const mapPhaseToClickUpStatus = clickupUtils.mapPhaseToClickUpStatus;

// Get ClickUp leads
exports.getLeads = async (req, res) => {
  try {
    if (!LEADS_LIST_ID) {
      return res.status(500).json({
        success: false,
        message: 'ClickUp list ID is not configured'
      });
    }

    // Get tasks from ClickUp
    const clickupTasks = await clickupUtils.getTasksFromList(LEADS_LIST_ID);
    
    if (!clickupTasks || clickupTasks.length === 0) {
      addLog('warning', 'Keine Tasks von ClickUp gefunden', {
        listId: LEADS_LIST_ID
      }, 'ClickUp Controller');
    }
    
    // Log the number of tasks received
    console.log(`Received ${clickupTasks.length} tasks from ClickUp`);
    
    // Transform tasks using the existing transformation function
    const transformedLeads = clickupTasks.map(task => {
      // Basic task properties
      return {
        id: task.id,
        name: task.name,
        status: task.status?.status || 'Unknown',
        dateCreated: new Date(parseInt(task.date_created) || Date.now()),
        dateUpdated: new Date(parseInt(task.date_updated) || Date.now()),
        // Add transformed data from the utility function
        ...transformClickUpData(task)
      };
    });

    // Return the leads to the frontend
    res.json({
      success: true,
      leads: transformedLeads,
      count: transformedLeads.length
    });

  } catch (error) {
    console.error('Error fetching ClickUp leads:', error);
    addLog('error', 'Fehler beim Abruf der Leads von ClickUp', {
      error: error.message,
      stack: error.stack
    }, 'ClickUp Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leads from ClickUp',
      error: error.message
    });
  }
};

// Import a ClickUp task to create a form
exports.importClickUpTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Check if the task is already imported
    const existingForm = await Form.findOne({ taskId });
    if (existingForm) {
      return res.status(409).json({
        success: false,
        message: 'Task already imported',
        form: existingForm
      });
    }

    // Fetch task details from ClickUp
    const task = await clickupUtils.getTaskById(taskId);
    
    if (!task || !task.id) {
      throw new Error('Invalid task data returned from ClickUp');
    }
    
    console.log(`Retrieved task from ClickUp: ${task.name} (${task.id})`);

    // Transform the task data using the existing function
    const formData = transformClickUpData(task);

    // Create a new form record in the database
    const newForm = new Form(formData);
    await newForm.save();

    // Log the successful import
    addLog('success', `Imported task from ClickUp: ${task.name}`, {
      taskId,
      operation: 'import'
    }, 'ClickUp Integration');

    // Return success response with the new form
    res.json({
      success: true,
      message: 'Task imported successfully',
      form: newForm
    });

  } catch (error) {
    console.error('Error importing ClickUp task:', error);
    addLog('error', 'Fehler beim Importieren eines Tasks von ClickUp', {
      taskId: req.params.taskId,
      error: error.message,
      stack: error.stack
    }, 'ClickUp Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to import task from ClickUp',
      error: error.message
    });
  }
};

// Sync a form with its corresponding ClickUp task
exports.syncFormWithClickUp = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }

    // Find the form in our database
    const form = await Form.findOne({ taskId });
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Get the appropriate status based on form phase
    const status = mapPhaseToClickUpStatus(form.phase, form.qualifiziert);

    // Prepare data for ClickUp update
    const updateData = {
      name: form.leadName,
      status: status,
      // Pass all custom fields to update
      custom_fields: [
        { name: "Gesamtschulden", value: form.gesamtSchulden || "0" },
        { name: "Gläubiger Anzahl", value: form.glaeubiger || "0" },
        { name: "Straße", value: form.strasse || "" },
        { name: "Hausnummer", value: form.hausnummer || "" },
        { name: "PLZ", value: form.plz || "" },
        { name: "Ort", value: form.wohnort || "" },
        { name: "Telefonnummer", value: form.telefon || "" }
      ]
    };

    console.log(`Syncing task ${taskId} with status: ${status}`);

    // Update the task in ClickUp
    await clickupUtils.updateTask(taskId, updateData);
    
    // Log the successful sync
    addLog('success', `Synced form with ClickUp: ${form.leadName}`, {
      taskId,
      operation: 'sync',
      status: status
    }, 'ClickUp Integration');

    res.json({
      success: true,
      message: 'Form synchronized with ClickUp',
      form: form
    });

  } catch (error) {
    console.error('Error syncing form with ClickUp:', error);
    addLog('error', 'Fehler beim Synchronisieren eines Formulars mit ClickUp', {
      taskId: req.params.taskId,
      error: error.message,
      stack: error.stack
    }, 'ClickUp Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to sync form with ClickUp',
      error: error.message
    });
  }
};

// Sync all forms with ClickUp
exports.syncAllWithClickUp = async (req, res) => {
  try {
    // Get all forms from database
    const forms = await Form.find({});
    
    if (forms.length === 0) {
      addLog('info', 'Keine Formulare zum Synchronisieren gefunden', {}, 'ClickUp Integration');
      return res.json({
        success: true,
        message: 'No forms to synchronize',
        results: { successful: 0, failed: 0, total: 0 }
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      total: forms.length,
      details: []
    };

    console.log(`Starting batch sync of ${forms.length} forms with ClickUp`);

    // Process each form
    for (const form of forms) {
      try {
        // Skip forms without taskId
        if (!form.taskId) {
          console.warn(`Skipping form ${form._id} without taskId`);
          continue;
        }

        // Get the appropriate status based on form phase
        const status = mapPhaseToClickUpStatus(form.phase, form.qualifiziert);

        // Prepare data for ClickUp update
        const updateData = {
          name: form.leadName,
          status: status,
          custom_fields: [
            { name: "Gesamtschulden", value: form.gesamtSchulden || "0" },
            { name: "Gläubiger Anzahl", value: form.glaeubiger || "0" },
            { name: "Straße", value: form.strasse || "" },
            { name: "Hausnummer", value: form.hausnummer || "" },
            { name: "PLZ", value: form.plz || "" },
            { name: "Ort", value: form.wohnort || "" },
            { name: "Telefonnummer", value: form.telefon || "" }
          ]
        };

        // Update the task in ClickUp
        await clickupUtils.updateTask(form.taskId, updateData);
        
        results.successful++;
        results.details.push({
          taskId: form.taskId,
          name: form.leadName,
          status: 'success'
        });

        // Log each successful sync
        addLog('success', `Synced form with ClickUp: ${form.leadName}`, {
          taskId: form.taskId,
          operation: 'batch-sync',
          clickupStatus: status
        }, 'ClickUp Integration');

      } catch (error) {
        console.error(`Error syncing form ${form.taskId || form._id}:`, error);
        results.failed++;
        results.details.push({
          taskId: form.taskId || form._id,
          name: form.leadName || 'Unknown',
          status: 'failed',
          error: error.message
        });

        // Log each failed sync
        addLog('error', `Failed to sync form with ClickUp: ${form.leadName || 'Unknown'}`, {
          taskId: form.taskId || form._id,
          error: error.message,
          operation: 'batch-sync'
        }, 'ClickUp Integration');
      }
    }

    // Log the overall sync result
    addLog('info', `Batch sync completed: ${results.successful}/${results.total} successful`, results, 'ClickUp Integration');

    console.log(`Batch sync completed: ${results.successful}/${results.total} successful`);

    res.json({
      success: true,
      message: 'Synchronization completed',
      results: results
    });

  } catch (error) {
    console.error('Error syncing all forms with ClickUp:', error);
    addLog('error', 'Fehler bei der Batch-Synchronisierung mit ClickUp', {
      error: error.message,
      stack: error.stack
    }, 'ClickUp Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to sync forms with ClickUp',
      error: error.message
    });
  }
};

// Handle ClickUp webhooks
exports.handleClickUpWebhook = async (req, res) => {
  try {
    const eventData = req.body;
    console.log('Received ClickUp webhook:', JSON.stringify(eventData, null, 2));

    // Log the webhook reception
    addLog('info', 'Received ClickUp webhook', eventData, 'ClickUp Integration');

    // Extract task ID based on the event type
    let taskId;
    
    // Handle different event types
    if (eventData.event === 'taskCreated' || eventData.event === 'taskUpdated') {
      taskId = eventData.task_id;
      console.log(`Processing ${eventData.event} for task ${taskId}`);
    } else if (eventData.event === 'taskDeleted') {
      taskId = eventData.task_id;
      console.log(`Processing task deletion for ${taskId}`);
      
      // For task deletion, we just need to mark the task as deleted in our system
      const result = await Form.findOneAndUpdate(
        { taskId: taskId },
        { $set: { deleted: true, deletedAt: new Date() } },
        { new: true }
      );
      
      if (result) {
        addLog('success', `Marked form as deleted due to ClickUp task deletion: ${taskId}`, {
          taskId,
          event: 'taskDeleted'
        }, 'ClickUp Integration');
      }
      
      return res.json({
        success: true,
        message: 'Webhook processed for task deletion',
      });
    } else {
      // Unsupported event type
      addLog('warning', 'Webhook received with unsupported event type', {
        event: eventData.event
      }, 'ClickUp Integration');
      
      return res.json({
        success: true,
        message: 'Webhook received but event type not handled',
        event: eventData.event
      });
    }

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: 'Task ID not found in webhook data'
      });
    }

    // Fetch task details using the direct ClickUp API
    const taskDetails = await clickupUtils.getTaskById(taskId);
    
    if (!taskDetails || !taskDetails.id) {
      throw new Error('Unable to retrieve task details from ClickUp');
    }

    console.log(`Retrieved webhook task details: ${taskDetails.name} (${taskDetails.id})`);

    // Transform task data using our existing transformation function 
    const transformedData = transformClickUpData(taskDetails);

    // Check if form already exists in our database
    let form = await Form.findOne({ taskId });
    let operationType;

    if (form) {
      // Update existing form
      operationType = 'updated';
      form = await Form.findOneAndUpdate(
        { taskId },
        { $set: transformedData },
        { new: true }
      );
      
      addLog('success', `Updated form from ClickUp webhook: ${transformedData.leadName}`, {
        taskId,
        event: eventData.event,
        phase: transformedData.phase,
        qualifiziert: transformedData.qualifiziert
      }, 'ClickUp Integration');
    } else {
      // Create new form
      operationType = 'created';
      const newForm = new Form(transformedData);
      form = await newForm.save();
      
      addLog('success', `Created new form from ClickUp webhook: ${transformedData.leadName}`, {
        taskId,
        event: eventData.event
      }, 'ClickUp Integration');
    }

    // Return success response
    res.json({
      success: true,
      message: `Webhook processed successfully - Form ${operationType}`,
      form: form
    });

  } catch (error) {
    console.error('Error processing ClickUp webhook:', error);
    
    // Log the error
    addLog('error', 'Error processing ClickUp webhook', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    }, 'ClickUp Integration');
    
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook',
      error: error.message
    });
  }
};

// Function to set up webhooks for ClickUp lists
exports.setupWebhooks = async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    
    if (!webhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Webhook URL is required'
      });
    }
    
    if (!LEADS_LIST_ID) {
      return res.status(400).json({
        success: false,
        message: 'ClickUp leads list ID is not configured'
      });
    }
    
    // Check for existing webhooks
    const existingWebhooks = await clickupUtils.getWebhooks(LEADS_LIST_ID);
    
    // Filter webhooks with the same endpoint
    const matchingWebhooks = existingWebhooks.filter(webhook => 
      webhook.endpoint === webhookUrl
    );
    
    // Delete existing webhooks with the same endpoint
    for (const webhook of matchingWebhooks) {
      await clickupUtils.deleteWebhook(webhook.id);
      console.log(`Deleted existing webhook ${webhook.id}`);
    }
    
    // Create new webhook
    const events = ['taskCreated', 'taskUpdated', 'taskDeleted'];
    const newWebhook = await clickupUtils.createWebhook(LEADS_LIST_ID, webhookUrl, events);
    
    addLog('success', 'Set up ClickUp webhook', {
      listId: LEADS_LIST_ID,
      webhookUrl,
      events
    }, 'ClickUp Integration');
    
    res.json({
      success: true,
      message: 'ClickUp webhook set up successfully',
      webhook: newWebhook
    });
    
  } catch (error) {
    console.error('Error setting up ClickUp webhooks:', error);
    
    addLog('error', 'Fehler beim Einrichten der ClickUp-Webhooks', {
      error: error.message,
      stack: error.stack
    }, 'ClickUp Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to set up ClickUp webhooks',
      error: error.message
    });
  }
};

// Simple test endpoint for checking ClickUp API connectivity
exports.testClickUpConnection = async (req, res) => {
  try {
    // Get the access token from query parameter if it exists
    const accessToken = req.query.token || null;
    
    const connectionResult = await clickupUtils.testConnection(accessToken);
    
    // Determine authentication method used
    let authMethod = 'API Key';
    if (accessToken) {
      authMethod = 'Provided OAuth Token';
    } else {
      // Check if we have a valid OAuth token in the database
      try {
        const OAuthToken = require('../models/OAuthToken');
        const token = await OAuthToken.findOne({ provider: 'clickup' }).sort({ updatedAt: -1 });
        if (token && new Date(token.expiresAt) > new Date()) {
          authMethod = 'Stored OAuth Token';
        }
      } catch (e) {
        console.log('Error checking for OAuth token:', e.message);
      }
    }
    
    // Add more debug information to the response
    const responseDetails = {
      success: true,
      message: 'ClickUp API connection successful',
      timestamp: new Date().toISOString(),
      clickupData: connectionResult,
      authMethod,
      environment: {
        apiKey: process.env.CLICKUP_API_KEY ? 'Set' : 'Not set',
        clientId: process.env.CLICKUP_CLIENT_ID ? 'Set' : 'Not set',
        leadsListId: process.env.CLICKUP_LEADS_LIST_ID ? 'Set' : 'Not set',
        offersListId: process.env.CLICKUP_OFFERS_LIST_ID ? 'Set' : 'Not set',
        nodeEnv: process.env.NODE_ENV || 'Not set'
      }
    };
    
    // Log the successful connection
    addLog('info', 'ClickUp API connection test successful', {
      timestamp: new Date().toISOString(),
      authMethod
    }, 'ClickUp Controller');
    
    res.json(responseDetails);

  } catch (error) {
    console.error('Error testing ClickUp API connection:', error);
    
    addLog('error', 'Fehler beim Testen der ClickUp-API-Verbindung', {
      error: error.message,
      stack: error.stack
    }, 'ClickUp Controller');
    
    res.status(500).json({
      success: false,
      message: 'Failed to connect to ClickUp API',
      error: error.message,
      details: {
        timestamp: new Date().toISOString(),
        errorType: error.name,
        errorMessage: error.message
      }
    });
  }
};