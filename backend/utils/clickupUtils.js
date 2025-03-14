// backend/utils/clickupUtils.js
const axios = require('axios');
const OAuthToken = require('../models/OAuthToken');

// Get API variables from environment
const API_KEY = process.env.CLICKUP_API_KEY;
const API_URL = process.env.CLICKUP_API_URL || 'https://api.clickup.com/api/v2';

/**
 * Create ClickUp API client with either API key or OAuth token
 * @param {string} accessToken - Optional OAuth access token
 * @returns {Object} Axios client instance
 */
const createClickUpClient = async (accessToken) => {
  let token = accessToken;
  let authHeader = '';

  // If no access token is provided, check if we should use OAuth or API key
  if (!token) {
    // First try to get the latest OAuth token from the database
    try {
      const latestToken = await OAuthToken.findOne({ provider: 'clickup' }).sort({ updatedAt: -1 });
      
      if (latestToken && latestToken.accessToken) {
        // Check if token is expired
        if (new Date(latestToken.expiresAt) > new Date()) {
          token = latestToken.accessToken;
          authHeader = `Bearer ${token}`;
          console.log('Using OAuth token from database');
        } else {
          console.log('OAuth token expired, need to refresh');
          // TODO: Implement token refresh logic here
          // For now, fallback to API key
          if (!API_KEY) {
            throw new Error('No valid OAuth token and ClickUp API Key is not set');
          }
          authHeader = API_KEY;
        }
      } else {
        // No OAuth token found, use API key
        if (!API_KEY) {
          throw new Error('ClickUp API Key is not set in environment variables');
        }
        authHeader = API_KEY;
      }
    } catch (error) {
      console.error('Error getting OAuth token:', error);
      
      // Fallback to API key
      if (!API_KEY) {
        throw new Error('ClickUp API Key is not set in environment variables');
      }
      authHeader = API_KEY;
    }
  } else {
    // Use the provided access token
    authHeader = `Bearer ${token}`;
  }

  // Create axios client with appropriate authorization
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 seconds timeout
  });

  // Add logging for debugging
  client.interceptors.request.use(request => {
    // Redact the Authorization header for security
    const redactedRequest = { ...request };
    if (redactedRequest.headers.Authorization) {
      redactedRequest.headers.Authorization = 'REDACTED';
    }
    console.log(`ClickUp API Request: ${request.method.toUpperCase()} ${request.baseURL}${request.url}`);
    return request;
  });

  client.interceptors.response.use(
    response => {
      console.log(`ClickUp API Success: ${response.config.url}`);
      return response;
    },
    error => {
      console.error('ClickUp API Error:', error.message);
      if (error.response) {
        console.error('API Response:', error.response.data);
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Map dashboard phases to ClickUp statuses
const mapPhaseToClickUpStatus = (phase, isQualified) => {
  if (isQualified) {
    // Qualified leads mapping
    switch (phase) {
      case 'erstberatung': return 'QUALIFIZIERT';
      case 'checkliste': return 'ANWALT';
      case 'dokumente': return 'ANGEBOT UNTERSCHRIEBEN';
      case 'abgeschlossen': return 'ABGESCHLOSSEN';
      default: return 'QUALIFIZIERT';
    }
  } else {
    // Unqualified leads mapping
    switch (phase) {
      case 'erstberatung': return 'NEUE ANFRAGE';
      case 'checkliste': return 'AUF TERMIN';
      default: return 'NEUE ANFRAGE';
    }
  }
};

// Find custom field ID by name
const findCustomFieldIdByName = (customFields, name) => {
  const field = customFields.find(field => field.name === name);
  return field ? field.id : null;
};

// OAuth token management
const saveOAuthToken = async (accessToken, refreshToken, expiresIn = 2592000) => {
  try {
    // Calculate expiry date (default to 30 days if not specified)
    const expiresAt = new Date(Date.now() + (expiresIn * 1000));
    
    // Create new token record
    const token = new OAuthToken({
      provider: 'clickup',
      accessToken,
      refreshToken,
      expiresAt
    });
    
    // Save to database
    await token.save();
    console.log('OAuth token saved');
    return token;
  } catch (error) {
    console.error('Error saving OAuth token:', error);
    throw error;
  }
};

// Get tasks from a list
const getTasksFromList = async (listId, accessToken) => {
  try {
    const client = await createClickUpClient(accessToken);
    const response = await client.get(`/list/${listId}/task?archived=false&subtasks=false`);
    return response.data.tasks || [];
  } catch (error) {
    console.error(`Error fetching tasks from list ${listId}:`, error);
    throw error;
  }
};

// Get a single task by ID
const getTaskById = async (taskId, accessToken) => {
  try {
    const client = await createClickUpClient(accessToken);
    const response = await client.get(`/task/${taskId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching task ${taskId}:`, error);
    throw error;
  }
};

// Update a task
const updateTask = async (taskId, updateData, accessToken) => {
  try {
    const client = await createClickUpClient(accessToken);
    
    // First, get the task to retrieve custom field IDs
    const task = await getTaskById(taskId, accessToken);
    
    // Extract custom fields data
    const customFieldsData = {};
    
    if (updateData.custom_fields && task.custom_fields) {
      // Map custom fields by name to their respective IDs
      updateData.custom_fields.forEach(field => {
        const fieldId = findCustomFieldIdByName(task.custom_fields, field.name);
        if (fieldId) {
          customFieldsData[fieldId] = field.value;
        }
      });
    }
    
    // Prepare update payload
    const payload = {
      name: updateData.name,
      status: updateData.status,
      custom_fields: customFieldsData
    };
    
    // Send update request
    const response = await client.put(`/task/${taskId}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Error updating task ${taskId}:`, error);
    throw error;
  }
};

// Create webhook for ClickUp events
const createWebhook = async (listId, webhookUrl, events = ['taskCreated', 'taskUpdated', 'taskDeleted'], accessToken) => {
  try {
    const client = await createClickUpClient(accessToken);
    const response = await client.post(`/list/${listId}/webhook`, {
      endpoint: webhookUrl,
      events: events
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating webhook for list ${listId}:`, error);
    throw error;
  }
};

// Get all webhooks for a list
const getWebhooks = async (listId, accessToken) => {
  try {
    const client = await createClickUpClient(accessToken);
    const response = await client.get(`/list/${listId}/webhook`);
    return response.data.webhooks || [];
  } catch (error) {
    console.error(`Error fetching webhooks for list ${listId}:`, error);
    throw error;
  }
};

// Delete a webhook
const deleteWebhook = async (webhookId, accessToken) => {
  try {
    const client = await createClickUpClient(accessToken);
    const response = await client.delete(`/webhook/${webhookId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting webhook ${webhookId}:`, error);
    throw error;
  }
};

// Test ClickUp API connectivity
const testConnection = async (accessToken) => {
  try {
    const client = await createClickUpClient(accessToken);
    const response = await client.get('/user');
    return {
      success: true,
      message: 'ClickUp API connection successful',
      user: response.data.user
    };
  } catch (error) {
    console.error('Error testing ClickUp API connection:', error);
    throw error;
  }
};

// Function to sync a form with ClickUp
const syncFormToClickUp = async (form, accessToken) => {
  try {
    if (!form || !form.taskId) {
      console.error('Invalid form or missing taskId for ClickUp sync');
      throw new Error('Invalid form data for ClickUp sync');
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

    console.log(`Syncing task ${form.taskId} with status: ${status}`);

    // Update the task in ClickUp
    const result = await updateTask(form.taskId, updateData, accessToken);
    
    console.log(`Successfully updated task ${form.taskId}`);
    return result;

  } catch (error) {
    console.error(`Error syncing form ${form.taskId || form._id} to ClickUp:`, error);
    throw error;
  }
};

module.exports = {
  createClickUpClient,
  mapPhaseToClickUpStatus,
  getTasksFromList,
  getTaskById,
  updateTask,
  createWebhook,
  getWebhooks,
  deleteWebhook,
  testConnection,
  syncFormToClickUp,
  saveOAuthToken
};