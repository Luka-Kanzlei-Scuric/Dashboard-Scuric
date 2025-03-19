// backend/controllers/clickupController.js
const Form = require('../models/Form');
const clickupUtils = require('../utils/clickupUtils');

// Map dashboard phases to ClickUp statuses
const mapPhaseToClickUpStatus = clickupUtils.mapPhaseToClickUpStatus;

// Implementiere die transformClickUpData Funktion direkt im Controller
function transformClickUpData(clickupTask) {
  console.log('Transforming ClickUp task data:', JSON.stringify(clickupTask, null, 2));
  
  // Extrahiere benutzerdefinierte Felder (für einfacheren Zugriff)
  const customFields = {};
  
  if (Array.isArray(clickupTask.custom_fields)) {
    clickupTask.custom_fields.forEach(field => {
      // Handle verschiedene Strukturen der benutzerdefinierten Felder
      if (field.name && field.value !== undefined) {
        customFields[field.name] = field.value;
      } else if (field.name && field.value === undefined && field.type === 'dropdown' && field.type_config && field.type_config.options) {
        // Für Dropdown-Felder
        if (field.type_config.default && Array.isArray(field.type_config.options)) {
          const selectedOption = field.type_config.options.find(opt => opt.id === field.type_config.default);
          if (selectedOption) {
            customFields[field.name] = selectedOption.name;
          }
        }
      }
    });
  }
  
  // Versuche Status aus verschiedenen möglichen Strukturen zu extrahieren
  let status = 'NEUE ANFRAGE'; // Default-Status
  
  if (clickupTask.status && typeof clickupTask.status === 'string') {
    // Status ist direkt ein String
    status = clickupTask.status;
  } else if (clickupTask.status && clickupTask.status.status) {
    // Status ist in einem status-Objekt
    status = clickupTask.status.status;
  } else if (typeof clickupTask.status_name === 'string') {
    // Manchmal verwendet als status_name
    status = clickupTask.status_name;
  } else {
    // Suche nach Status in benutzerdefinierten Feldern
    for (const fieldName in customFields) {
      if (fieldName.toLowerCase().includes('status')) {
        status = customFields[fieldName];
        break;
      }
    }
  }
  
  // Ermittle Phase basierend auf Status
  const phase = mapStatusToPhase(status);
  
  // Behandle die Daten
  let createdAtDate = new Date();
  let updatedAtDate = new Date();
  
  try {
    if (clickupTask.date_created) {
      // ClickUp API gibt Timestamps als ms seit Epoch
      const timestamp = typeof clickupTask.date_created === 'string' 
        ? parseInt(clickupTask.date_created, 10) 
        : clickupTask.date_created;
      
      if (!isNaN(timestamp)) {
        createdAtDate = new Date(timestamp);
      }
    }
  } catch (e) {
    console.log('Fehler beim Parsen des Erstellungsdatums:', e);
  }
  
  try {
    if (clickupTask.date_updated) {
      const timestamp = typeof clickupTask.date_updated === 'string' 
        ? parseInt(clickupTask.date_updated, 10) 
        : clickupTask.date_updated;
      
      if (!isNaN(timestamp)) {
        updatedAtDate = new Date(timestamp);
      }
    }
  } catch (e) {
    console.log('Fehler beim Parsen des Aktualisierungsdatums:', e);
  }
  
  // Stelle sicher, dass taskId und leadName gültige Werte haben
  const taskId = clickupTask.id || `fallback-${Date.now()}`;
  
  // Extract lead name from various possible sources
  let leadName = 'Unbekannter Mandant';
  if (clickupTask.name) {
    leadName = clickupTask.name;
  } else if (clickupTask.title) {
    leadName = clickupTask.title;
  } else if (customFields['Name']) {
    leadName = customFields['Name'];
  } else if (customFields['Kunde']) {
    leadName = customFields['Kunde'];
  }
  
  // Extrahiere Email aus verschiedenen möglichen Quellen
  let email = '';
  if (customFields['Email']) {
    email = customFields['Email'];
  } else if (customFields['E-Mail']) {
    email = customFields['E-Mail'];
  } else if (clickupTask.email) {
    email = clickupTask.email;
  } else {
    // Suche nach Email in Beschreibungen oder Kommentaren
    const textToSearch = [
      clickupTask.description,
      clickupTask.text_content,
      clickupTask.content
    ].filter(Boolean).join(' ');
    
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = textToSearch.match(emailRegex);
    if (match) {
      email = match[0];
    }
  }
  
  // Erstelle das transformierte Objekt
  const transformedData = {
    taskId: taskId,
    leadName: leadName,
    phase: phase,
    qualifiziert: isQualified(status),
    
    // Kontaktinformationen (aus benutzerdefinierten Feldern)
    strasse: customFields['Straße'] || customFields['Strasse'] || '',
    hausnummer: customFields['Hausnummer'] || customFields['Hausnr'] || customFields['Nr'] || '',
    plz: customFields['PLZ'] || customFields['Postleitzahl'] || '',
    wohnort: customFields['Ort'] || customFields['Stadt'] || customFields['Wohnort'] || '',
    email: email,
    telefon: customFields['Telefonnummer'] || customFields['Telefon'] || customFields['Tel'] || '',
    
    // Finanzielle Daten (optional)
    gesamtSchulden: customFields['Gesamtschulden'] || customFields['Schulden'] || '0',
    glaeubiger: customFields['Gläubiger Anzahl'] || customFields['Anzahl Gläubiger'] || '0',
    
    // Metadaten
    createdAt: createdAtDate,
    updatedAt: updatedAtDate,
    
    // ClickUp-spezifische Daten (für die Referenz)
    clickupData: {
      status: status,
      statusColor: clickupTask.status_color || clickupTask.color || '#cccccc',
      priority: clickupTask.priority || 'normal'
    }
  };
  
  console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
  return transformedData;
}

// Hilfsfunktionen
function mapStatusToPhase(status) {
  const statusMap = {
    'NEUE ANFRAGE': 'erstberatung',
    'neue anfrage': 'erstberatung',
    'VERSUCHT ZU ERREICHEN 1': 'erstberatung',
    'VERSUCHT ZU ERREICHEN 2': 'erstberatung',
    'VERSUCHT ZU ERREICHEN 3': 'erstberatung',
    'VERSUCHT ZU ERREICHEN 4': 'erstberatung',
    'VERSUCHT ZU ERREICHEN 5': 'erstberatung',
    'AUF TERMIN': 'erstberatung',
    'ANWALT': 'checkliste',
    'ANFRAGE MELDET SICH SELBST': 'erstberatung',
    'ANFRAGE NIE ERREICHT': 'erstberatung',
    'FALSCHE NUMMER': 'erstberatung',
    'UNQUALIFIZIERT - ARCHIV': 'erstberatung',
    'QUALIFIZIERT': 'checkliste',
    'ANGEBOTSZUSTELLUNG': 'checkliste',
    'ANGEBOT UNTERSCHRIEBEN': 'dokumente'
  };
  
  return statusMap[status] || 'erstberatung';
}

function isQualified(status) {
  const qualifiedStatuses = [
    'QUALIFIZIERT',
    'ANGEBOTSZUSTELLUNG',
    'ANGEBOT UNTERSCHRIEBEN',
    'ANWALT'
  ];
  
  return qualifiedStatuses.includes(status);
}

// Process Make.com webhook for ClickUp tasks
exports.handleMakeWebhook = async (req, res) => {
  try {
    // Log the incoming webhook data
    console.log('Received data from Make.com:', JSON.stringify(req.body, null, 2));
    
    // Load logging system if available
    let addLog;
    try {
      const makeRoutes = require('../routes/makeRoutes');
      addLog = makeRoutes.addLog;
    } catch (e) {
      console.log('Logging system not available:', e.message);
      addLog = (...args) => console.log(...args);
    }
    
    addLog('info', 'Make.com webhook received', {
      data: req.body,
      timestamp: new Date().toISOString()
    }, 'ClickUp Controller');
    
    // Extract the task data from the request - handle different possible structures
    let taskData;
    
    // Determine the structure of the incoming data and extract accordingly
    if (req.body && req.body.id) {
      // Direct task object
      taskData = req.body;
      addLog('info', 'Received direct task object', { id: taskData.id }, 'ClickUp Controller');
    } else if (req.body && req.body.task && req.body.task.id) {
      // Task wrapped in task property
      taskData = req.body.task;
      addLog('info', 'Received task in task property', { id: taskData.id }, 'ClickUp Controller');
    } else if (req.body && Array.isArray(req.body) && req.body.length > 0) {
      // Array of tasks, use the first one
      taskData = req.body[0];
      addLog('info', 'Received array of tasks, using first one', { id: taskData.id }, 'ClickUp Controller');
    } else if (req.body && typeof req.body === 'object') {
      // Try to find a task-like object in the properties
      const possibleTaskKeys = Object.keys(req.body).filter(key => 
        typeof req.body[key] === 'object' && req.body[key] !== null);
      
      for (const key of possibleTaskKeys) {
        if (req.body[key].id && (req.body[key].name || req.body[key].title)) {
          taskData = req.body[key];
          addLog('info', `Found task-like object in property: ${key}`, { id: taskData.id }, 'ClickUp Controller');
          break;
        }
      }
    }
    
    // If we still couldn't identify task data, reject the request
    if (!taskData || !taskData.id) {
      addLog('error', 'No valid task data found in webhook payload', { body: req.body }, 'ClickUp Controller');
      return res.status(400).json({
        success: false,
        message: 'Invalid task data received. No task with ID found.'
      });
    }
    
    // Transform task data using the utility function
    const transformedData = transformClickUpData(taskData);
    
    addLog('info', 'Transformed task data', { 
      taskId: transformedData.taskId,
      leadName: transformedData.leadName,
      phase: transformedData.phase
    }, 'ClickUp Controller');
    
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
        form: form._id
      }, 'ClickUp Controller');
    } else {
      // Create new form
      operationType = 'created';
      const newForm = new Form(transformedData);
      form = await newForm.save();
      
      addLog('success', `Created new lead from ClickUp: ${transformedData.leadName}`, {
        taskId: transformedData.taskId,
        form: form._id
      }, 'ClickUp Controller');
    }
    
    // Return success response
    res.json({
      success: true,
      message: `Task ${operationType} successfully`,
      form: form
    });
    
  } catch (error) {
    console.error('Error processing Make.com webhook:', error);
    
    // Try to use the logging system if available
    try {
      const makeRoutes = require('../routes/makeRoutes');
      if (makeRoutes.addLog) {
        makeRoutes.addLog('error', 'Error processing Make.com webhook', {
          error: error.message,
          stack: error.stack
        }, 'ClickUp Controller');
      }
    } catch (e) {
      console.error('Could not log error with logging system:', e.message);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook data',
      error: error.message
    });
  }
};