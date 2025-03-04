/**
 * Service for interacting with ClickUp API through our backend
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/**
 * Get all leads from ClickUp
 * @returns {Promise} - Promise with lead tasks
 */
export const getClickUpLeads = async () => {
  try {
    const response = await axios.get(`${API_URL}/clickup/leads`);
    return response.data.tasks;
  } catch (error) {
    console.error('Error fetching ClickUp leads:', error);
    throw error;
  }
};

/**
 * Get all offers from ClickUp
 * @returns {Promise} - Promise with offer tasks
 */
export const getClickUpOffers = async () => {
  try {
    const response = await axios.get(`${API_URL}/clickup/offers`);
    return response.data.tasks;
  } catch (error) {
    console.error('Error fetching ClickUp offers:', error);
    throw error;
  }
};

/**
 * Import a task from ClickUp to our system
 * @param {string} taskId - ClickUp task ID
 * @returns {Promise} - Promise with imported form data
 */
export const importClickUpTask = async (taskId) => {
  try {
    const response = await axios.post(`${API_URL}/clickup/import/${taskId}`);
    return response.data.form;
  } catch (error) {
    console.error('Error importing ClickUp task:', error);
    throw error;
  }
};

/**
 * Sync a form with ClickUp
 * @param {string} taskId - Task ID to sync
 * @returns {Promise} - Promise with sync result
 */
export const syncFormWithClickUp = async (taskId) => {
  try {
    const response = await axios.post(`${API_URL}/clickup/sync/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error syncing form with ClickUp:', error);
    throw error;
  }
};

/**
 * Sync all forms with ClickUp
 * @returns {Promise} - Promise with sync results
 */
export const syncAllWithClickUp = async () => {
  try {
    const response = await axios.post(`${API_URL}/clickup/sync-all`);
    return response.data;
  } catch (error) {
    console.error('Error syncing all forms with ClickUp:', error);
    throw error;
  }
};

export default {
  getClickUpLeads,
  getClickUpOffers,
  importClickUpTask,
  syncFormWithClickUp,
  syncAllWithClickUp
};