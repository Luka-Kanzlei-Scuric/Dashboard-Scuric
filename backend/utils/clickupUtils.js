// backend/utils/clickupUtils.js
const axios = require('axios');

// Get API variables from environment
const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;

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

// Send data to Make.com webhook
const sendToMakeWebhook = async (form, formattedData) => {
  try {
    const makeClient = axios.create({
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Prepare payload for Make.com
    const payload = {
      operation: 'updateTask',
      taskId: form.taskId,
      formData: form,
      clickupData: formattedData
    };

    // Send to Make.com webhook
    console.log(`Sending to Make.com webhook: ${MAKE_WEBHOOK_URL}`);
    const response = await makeClient.post(MAKE_WEBHOOK_URL, payload);
    
    console.log('Make.com webhook response:', response.status);
    return response.data;
  } catch (error) {
    console.error('Error sending to Make.com webhook:', error);
    throw error;
  }
};

module.exports = {
  mapPhaseToClickUpStatus,
  sendToMakeWebhook
};