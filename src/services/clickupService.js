// src/services/clickupService.js
import axios from 'axios';

// Default backend URL from environment variable with fallback
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://privatinsolvenz-backend.onrender.com';

/**
 * Get client list from the database
 */
const getClientsList = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/forms`);
    return response.data;
  } catch (error) {
    console.error('Error fetching clients list:', error);
    throw error;
  }
};

/**
 * Get all leads from ClickUp
 * @returns {Promise} - Promise with lead tasks
 */
const getClickUpLeads = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/clickup/leads`);
    
    // Transform response to match expected format in component
    return {
      success: true,
      leads: response.data.tasks || []
    };
  } catch (error) {
    console.error('Error fetching ClickUp leads:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

/**
 * Import a task from ClickUp to our system
 * @param {string} taskId - ClickUp task ID
 * @returns {Promise} - Promise with imported form data
 */
const importClickUpTask = async (taskId) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/clickup/import/${taskId}`);
    return {
      success: true,
      form: response.data.form
    };
  } catch (error) {
    console.error('Error importing ClickUp task:', error);
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

/**
 * Sync all forms with ClickUp
 * @returns {Promise} - Promise with sync results
 */
const syncAllWithClickUp = async () => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/integrations/sync-all`);
    return response.data;
  } catch (error) {
    console.error('Error syncing all forms with ClickUp:', error);
    throw error;
  }
};

export {
  getClientsList,
  getClickUpLeads,
  importClickUpTask,
  syncAllWithClickUp
};