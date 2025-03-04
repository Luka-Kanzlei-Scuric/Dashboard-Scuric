const axios = require('axios');

// ClickUp API Configuration
const CLICKUP_API_KEY = process.env.CLICKUP_API_KEY || 'pk_84132000_89QTDVSH9ZPGW3WFSS5K8604I2KGOHMO';
const CLICKUP_API_URL = 'https://api.clickup.com/api/v2';

// ClickUp List IDs (to be replaced with actual list IDs)
const CLICKUP_LEADS_LIST_ID = process.env.CLICKUP_LEADS_LIST_ID;
const CLICKUP_ANGEBOTE_LIST_ID = process.env.CLICKUP_ANGEBOTE_LIST_ID;

// ClickUp API client with authentication
const clickupClient = axios.create({
    baseURL: CLICKUP_API_URL,
    headers: {
        'Authorization': CLICKUP_API_KEY, // ClickUp expects just the API key
        'Content-Type': 'application/json'
    },
    timeout: 10000 // 10 seconds timeout
});

// Add interceptor for logging requests and responses during debugging
clickupClient.interceptors.request.use(request => {
    console.log('ClickUp API Request:', request.method, request.url);
    return request;
}, error => {
    console.error('ClickUp API Request Error:', error);
    return Promise.reject(error);
});

clickupClient.interceptors.response.use(response => {
    console.log('ClickUp API Response Status:', response.status);
    return response;
}, error => {
    console.error('ClickUp API Response Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
});

// Log the configuration for debugging
console.log(`ClickUp configuration - API URL: ${CLICKUP_API_URL}`);
console.log(`ClickUp configuration - Using API Key: ${CLICKUP_API_KEY.substring(0, 5)}...`);
console.log(`ClickUp configuration - Leads List ID: ${CLICKUP_LEADS_LIST_ID}`);
console.log(`ClickUp configuration - Angebote List ID: ${CLICKUP_ANGEBOTE_LIST_ID}`);

/**
 * Get all tasks from a ClickUp list
 * @param {string} listId - ClickUp list ID
 * @returns {Promise} - Promise with task data
 */
async function getTasksFromList(listId) {
    try {
        const response = await clickupClient.get(`/list/${listId}/task`);
        return response.data;
    } catch (error) {
        console.error('⚠️ Error fetching tasks from ClickUp:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get a single task from ClickUp by task ID
 * @param {string} taskId - ClickUp task ID
 * @returns {Promise} - Promise with task data
 */
async function getTask(taskId) {
    try {
        const response = await clickupClient.get(`/task/${taskId}`);
        return response.data;
    } catch (error) {
        console.error(`⚠️ Error fetching task ${taskId} from ClickUp:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Create a new task in ClickUp
 * @param {string} listId - ClickUp list ID
 * @param {object} taskData - Task data to create
 * @returns {Promise} - Promise with created task data
 */
async function createTask(listId, taskData) {
    try {
        const response = await clickupClient.post(`/list/${listId}/task`, taskData);
        return response.data;
    } catch (error) {
        console.error('⚠️ Error creating task in ClickUp:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Update an existing task in ClickUp
 * @param {string} taskId - ClickUp task ID
 * @param {object} taskData - Task data to update
 * @returns {Promise} - Promise with updated task data
 */
async function updateTask(taskId, taskData) {
    try {
        const response = await clickupClient.put(`/task/${taskId}`, taskData);
        return response.data;
    } catch (error) {
        console.error(`⚠️ Error updating task ${taskId} in ClickUp:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Get all statuses for a list
 * @param {string} listId - ClickUp list ID
 * @returns {Promise} - Promise with list statuses
 */
async function getListStatuses(listId) {
    try {
        const response = await clickupClient.get(`/list/${listId}`);
        return response.data.statuses;
    } catch (error) {
        console.error(`⚠️ Error fetching statuses for list ${listId}:`, error.response?.data || error.message);
        throw error;
    }
}

/**
 * Maps the dashboard phase to the appropriate ClickUp status
 * @param {string} phase - Dashboard phase (erstberatung, checkliste, dokumente, abgeschlossen)
 * @param {string} listType - Type of list ("leads" or "angebote")
 * @returns {string} - Corresponding ClickUp status
 */
function mapPhaseToClickUpStatus(phase, listType = "leads") {
    if (listType === "leads") {
        // This mapping should align with your CRM - Leads statuses
        switch (phase) {
            case 'erstberatung':
                return 'NEUE ANFRAGE';
            case 'checkliste':
                return 'AUF TERMIN';
            case 'dokumente':
                return 'QUALIFIZIERT';
            case 'abgeschlossen':
                return 'ANWALT';
            default:
                return 'NEUE ANFRAGE';
        }
    } else if (listType === "angebote") {
        // This mapping should align with your CRM - Angebote statuses
        switch (phase) {
            case 'erstberatung':
                return 'QUALIFIZIERT';
            case 'checkliste':
                return 'ANGEBOTSZUSTELLUNG';
            case 'dokumente':
            case 'abgeschlossen':
                return 'ANGEBOT UNTERSCHRIEBEN';
            default:
                return 'QUALIFIZIERT';
        }
    }
    
    return 'NEUE ANFRAGE'; // Default fallback
}

/**
 * Sync a form from the dashboard to ClickUp
 * @param {object} form - The form data from the dashboard
 * @returns {Promise} - Promise with sync result
 */
async function syncFormToClickUp(form) {
    try {
        // First, try to get the task if it exists
        let task;
        try {
            task = await getTask(form.taskId);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                console.log(`Task ${form.taskId} not found in ClickUp, will create a new one`);
                task = null;
            } else {
                throw error;
            }
        }
        
        // Determine which list to use based on qualification status
        const listId = form.qualifiziert ? CLICKUP_ANGEBOTE_LIST_ID : CLICKUP_LEADS_LIST_ID;
        const listType = form.qualifiziert ? "angebote" : "leads";
        
        // Map phase to appropriate ClickUp status
        const status = mapPhaseToClickUpStatus(form.phase, listType);
        
        // Prepare task data
        const taskData = {
            name: `${form.leadName} - Privatinsolvenz`,
            status: status,
            description: createTaskDescription(form),
            custom_fields: mapFormToCustomFields(form)
        };
        
        let result;
        if (task) {
            // Update existing task
            result = await updateTask(form.taskId, taskData);
            console.log(`✅ Updated task ${form.taskId} in ClickUp`);
        } else {
            // Create new task
            result = await createTask(listId, taskData);
            console.log(`✅ Created new task in ClickUp: ${result.id}`);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error syncing form to ClickUp:', error);
        throw error;
    }
}

/**
 * Create a task description from form data
 * @param {object} form - The form data
 * @returns {string} - Formatted task description
 */
function createTaskDescription(form) {
    return `
# Mandanten Information

**Name:** ${form.leadName}
**ID:** ${form.taskId}
**Phase:** ${form.phase}
**Qualifiziert:** ${form.qualifiziert ? 'Ja' : 'Nein'}

## Kontaktdaten
**Adresse:** ${form.strasse || ''} ${form.hausnummer || ''}, ${form.plz || ''} ${form.wohnort || ''}

## Finanzielle Situation
**Gesamtschulden:** ${form.gesamtSchulden || 'Nicht angegeben'}
**Anzahl Gläubiger:** ${form.glaeubiger || 'Nicht angegeben'}
**Netto-Einkommen:** ${form.nettoEinkommen || 'Nicht angegeben'}

## Notizen
${form.notizen || 'Keine Notizen'}

---
Automatisch synchronisiert vom Dashboard-System
`;
}

/**
 * Map form fields to ClickUp custom fields
 * @param {object} form - The form data
 * @returns {array} - Array of custom field values for ClickUp
 */
function mapFormToCustomFields(form) {
    // This is a placeholder - you would need to replace the IDs with your actual ClickUp custom field IDs
    // Ideally, these would come from environment variables
    const customFields = [];
    
    // Example of mapping some fields (you'd need to get the actual field IDs from ClickUp)
    // customFields.push({
    //     id: "0a1b2c3d4e5f", // Custom field ID for Gesamtschulden
    //     value: form.gesamtSchulden
    // });
    
    return customFields;
}

module.exports = {
    getTasksFromList,
    getTask,
    createTask,
    updateTask,
    getListStatuses,
    syncFormToClickUp
};