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

export {
  getClientsList
};