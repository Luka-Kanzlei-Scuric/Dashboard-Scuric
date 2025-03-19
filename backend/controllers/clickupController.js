// backend/controllers/clickupController.js
const Form = require('../models/Form');
const clickupUtils = require('../utils/clickupUtils');

// Map dashboard phases to ClickUp statuses
const mapPhaseToClickUpStatus = clickupUtils.mapPhaseToClickUpStatus;

// Implementiere die transformClickUpData Funktion direkt im Controller
function transformClickUpData(clickupTask) {
  console.log('Transforming ClickUp task data:', JSON.stringify(clickupTask, null, 2));
  
  try {
    // Gültigkeitsprüfung - ein Objekt ist notwendig
    if (!clickupTask || typeof clickupTask !== 'object') {
      console.error('Ungültige Daten für transformClickUpData:', clickupTask);
      throw new Error('Ungültige Daten von ClickUp/Make erhalten');
    }
    
    // Make.com-Webhook kann Daten in verschiedenen Formaten senden
    // Wenn die Daten in einem Unterfeld task sind, verwende dieses
    if (clickupTask.task && typeof clickupTask.task === 'object' && clickupTask.task.id) {
      console.log('Daten in task-Unterfeld gefunden, verwende diese stattdessen');
      clickupTask = clickupTask.task;
    }
    
    // Extrahiere benutzerdefinierte Felder (für einfacheren Zugriff)
    const customFields = {};
    
    // Prüfen auf verschiedene Formate von benutzerdefinierten Feldern
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
    } else if (clickupTask.custom_fields && typeof clickupTask.custom_fields === 'object') {
      // Alternativer Fall: custom_fields ist ein Objekt
      Object.keys(clickupTask.custom_fields).forEach(key => {
        const value = clickupTask.custom_fields[key];
        if (value !== null && value !== undefined) {
          customFields[key] = String(value);
        }
      });
    }
    
    // Auch nach benutzerdefinierten Feldern im Daten-Basispfad suchen
    ['name', 'title', 'description', 'email', 'phone', 'address'].forEach(field => {
      if (clickupTask[field] !== undefined) {
        customFields[field] = clickupTask[field];
      }
    });
    
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
      } else if (clickupTask.created || clickupTask.createdAt) {
        // Alternative Datumsfelder
        const timestamp = clickupTask.created || clickupTask.createdAt;
        
        if (timestamp) {
          if (typeof timestamp === 'string') {
            try {
              createdAtDate = new Date(timestamp);
            } catch (e) {
              console.warn('Konnte Datumsstring nicht parsen:', timestamp);
            }
          } else if (typeof timestamp === 'number') {
            createdAtDate = new Date(timestamp);
          }
        }
      }
    } catch (e) {
      console.warn('Fehler beim Parsen des Erstellungsdatums:', e);
    }
    
    try {
      if (clickupTask.date_updated) {
        const timestamp = typeof clickupTask.date_updated === 'string' 
          ? parseInt(clickupTask.date_updated, 10) 
          : clickupTask.date_updated;
        
        if (!isNaN(timestamp)) {
          updatedAtDate = new Date(timestamp);
        }
      } else if (clickupTask.updated || clickupTask.updatedAt) {
        // Alternative Datumsfelder
        const timestamp = clickupTask.updated || clickupTask.updatedAt;
        
        if (timestamp) {
          if (typeof timestamp === 'string') {
            try {
              updatedAtDate = new Date(timestamp);
            } catch (e) {
              console.warn('Konnte Datumsstring nicht parsen:', timestamp);
            }
          } else if (typeof timestamp === 'number') {
            updatedAtDate = new Date(timestamp);
          }
        }
      }
    } catch (e) {
      console.warn('Fehler beim Parsen des Aktualisierungsdatums:', e);
    }
    
    // Stelle sicher, dass taskId gültig ist
    // Wichtig: Die taskId muss eindeutig sein und ist der Primärschlüssel
    let taskId = null;
    
    // Verschiedene mögliche Feldnamen für die ID
    const idFields = ['id', 'taskId', 'task_id', 'clickup_id', 'clickupId'];
    
    // Suche nach der ersten gültigen ID
    for (const field of idFields) {
      if (clickupTask[field] && typeof clickupTask[field] === 'string') {
        taskId = clickupTask[field];
        break;
      }
    }
    
    // Wenn immer noch keine ID gefunden wurde, generiere eine
    if (!taskId) {
      console.warn('Keine gültige ID in den Daten gefunden, generiere Fallback-ID');
      taskId = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Finde den Mandantennamen aus verschiedenen möglichen Quellen
    let leadName = null;
    
    // Mögliche Feldnamen für den Namen
    const nameFields = ['name', 'title', 'leadName', 'client_name', 'clientName', 'kunde', 'mandant'];
    
    // Suche zunächst in den Hauptdaten
    for (const field of nameFields) {
      if (clickupTask[field] && typeof clickupTask[field] === 'string') {
        leadName = clickupTask[field];
        break;
      }
    }
    
    // Falls nicht gefunden, suche in benutzerdefinierten Feldern
    if (!leadName) {
      for (const field of nameFields) {
        if (customFields[field] && typeof customFields[field] === 'string') {
          leadName = customFields[field];
          break;
        }
      }
    }
    
    // Wenn Name teil eines formatierten Titels ist (z.B. "Max Mustermann - Privatinsolvenz")
    if (leadName && leadName.includes('-')) {
      const nameParts = leadName.split('-');
      if (nameParts.length > 1) {
        leadName = nameParts[0].trim();
      }
    }
    
    // Wenn kein Name gefunden wurde, versuche einen aus der Beschreibung zu extrahieren
    if (!leadName) {
      // Suche nach Namen in der Beschreibung oder anderen Textfeldern
      const descFields = ['description', 'text_content', 'content', 'notes'];
      
      let textToSearch = '';
      for (const field of descFields) {
        if (clickupTask[field] && typeof clickupTask[field] === 'string') {
          textToSearch += ' ' + clickupTask[field];
        }
      }
      
      if (textToSearch) {
        // Suche nach "Name:" oder "Name :"
        const nameMatch = textToSearch.match(/Name\s*:\s*([^\n\r,;]+)/i);
        if (nameMatch && nameMatch[1]) {
          leadName = nameMatch[1].trim();
        }
      }
    }
    
    // Wenn immer noch kein Name, verwende einen aussagekräftigeren Platzhaltername
    if (!leadName) {
      console.warn('Kein Mandantenname gefunden, verwende Platzhaltername für ID:', taskId);
      leadName = `Neuer Lead (${taskId.substring(0, 8)})`;
    }
    
    // Extrahiere Email aus verschiedenen möglichen Quellen
    let email = '';
    
    // Mögliche Feldnamen für die E-Mail
    const emailFields = ['email', 'e-mail', 'emailAddress', 'e_mail', 'mail'];
    
    // Suche in benutzerdefinierten Feldern
    for (const field of emailFields) {
      if (customFields[field]) {
        email = customFields[field];
        break;
      }
    }
    
    // Suche in den Hauptdaten
    if (!email) {
      for (const field of emailFields) {
        if (clickupTask[field]) {
          email = clickupTask[field];
          break;
        }
      }
    }
    
    // Versuche, eine E-Mail aus Textfeldern zu extrahieren
    if (!email) {
      const textToSearch = [
        clickupTask.description,
        clickupTask.text_content,
        clickupTask.content,
        clickupTask.notes
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
      strasse: customFields['Straße'] || customFields['Strasse'] || customFields['strasse'] || customFields['street'] || '',
      hausnummer: customFields['Hausnummer'] || customFields['Hausnr'] || customFields['Nr'] || customFields['nr'] || customFields['number'] || '',
      plz: customFields['PLZ'] || customFields['Postleitzahl'] || customFields['plz'] || customFields['zip'] || '',
      wohnort: customFields['Ort'] || customFields['Stadt'] || customFields['Wohnort'] || customFields['city'] || customFields['ort'] || '',
      email: email,
      telefon: customFields['Telefonnummer'] || customFields['Telefon'] || customFields['Tel'] || customFields['phone'] || customFields['telefon'] || '',
      
      // Finanzielle Daten (optional)
      gesamtSchulden: customFields['Gesamtschulden'] || customFields['Schulden'] || customFields['schulden'] || customFields['debt'] || '0',
      glaeubiger: customFields['Gläubiger Anzahl'] || customFields['Anzahl Gläubiger'] || customFields['glaeubiger'] || customFields['creditors'] || '0',
      
      // Metadaten
      createdAt: createdAtDate,
      updatedAt: updatedAtDate,
      
      // ClickUp-spezifische Daten (für die Referenz)
      clickupData: {
        status: status,
        statusColor: clickupTask.status_color || clickupTask.color || clickupTask.statusColor || '#cccccc',
        priority: clickupTask.priority || 'normal'
      }
    };
    
    console.log('Transformed data:', JSON.stringify(transformedData, null, 2));
    return transformedData;
  } catch (error) {
    console.error('Fehler bei der Transformation der ClickUp-Daten:', error);
    // Standardobjekt zurückgeben, damit es nicht zu Fehlern kommt
    return {
      taskId: `error-${Date.now()}`,
      leadName: 'Fehler bei Datenverarbeitung',
      phase: 'erstberatung',
      qualifiziert: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      clickupData: {
        status: 'ERROR',
        statusColor: '#ff0000',
        priority: 'normal'
      }
    };
  }
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
  // Load logging system if available
  let addLog;
  try {
    const makeRoutes = require('../routes/makeRoutes');
    addLog = makeRoutes.addLog;
  } catch (e) {
    console.log('Logging system not available:', e.message);
    addLog = (...args) => console.log(...args);
  }
  
  try {
    // Starte Timer für Performance-Messung
    const startTime = Date.now();
    
    // Log the incoming webhook data
    console.log('Received data from Make.com:', JSON.stringify(req.body, null, 2));
    
    // Check if body is empty or undefined
    if (!req.body) {
      addLog('error', 'Make.com webhook received with empty body', {
        headers: req.headers
      }, 'ClickUp Controller');
      
      return res.status(400).json({
        success: false,
        message: 'Empty request body'
      });
    }
    
    addLog('info', 'Make.com webhook received', {
      contentType: req.headers['content-type'],
      bodyType: typeof req.body,
      isArray: Array.isArray(req.body),
      timestamp: new Date().toISOString()
    }, 'ClickUp Controller');
    
    // Handle array of tasks
    if (Array.isArray(req.body)) {
      addLog('info', 'Received array of tasks from Make.com', { 
        count: req.body.length 
      }, 'ClickUp Controller');
      
      if (req.body.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Received empty array of tasks'
        });
      }
      
      // Process each task in the array
      const results = [];
      for (const task of req.body) {
        try {
          // Nur gültige Tasks verarbeiten
          if (!task || typeof task !== 'object') {
            addLog('warn', 'Skipping invalid task in array', { task }, 'ClickUp Controller');
            continue;
          }
          
          // Transformiere Daten und speichere/aktualisiere in der Datenbank
          const transformedData = transformClickUpData(task);
          
          if (!transformedData.taskId) {
            addLog('warn', 'Skipping task without ID after transformation', { 
              originalTask: task 
            }, 'ClickUp Controller');
            continue;
          }
          
          // Prüfen, ob der Task bereits existiert
          let form = await Form.findOne({ taskId: transformedData.taskId });
          let operationType;
          
          if (form) {
            // Aktualisiere den bestehenden Task
            operationType = 'updated';
            form = await Form.findOneAndUpdate(
              { taskId: transformedData.taskId },
              { $set: transformedData },
              { new: true }
            );
          } else {
            // Erstelle einen neuen Task
            operationType = 'created';
            const newForm = new Form(transformedData);
            form = await newForm.save();
          }
          
          results.push({
            taskId: transformedData.taskId,
            leadName: transformedData.leadName,
            operation: operationType,
            success: true
          });
          
          addLog('success', `${operationType === 'created' ? 'Created' : 'Updated'} task from array: ${transformedData.leadName}`, {
            taskId: transformedData.taskId
          }, 'ClickUp Controller');
        } catch (taskError) {
          addLog('error', 'Error processing task in array', {
            error: taskError.message,
            task: task
          }, 'ClickUp Controller');
          
          results.push({
            taskId: task.id || 'unknown',
            error: taskError.message,
            success: false
          });
        }
      }
      
      // Gesamtzeit für alle Tasks berechnen
      const totalTime = Date.now() - startTime;
      
      addLog('info', `Processed ${results.length} tasks in ${totalTime}ms`, {
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }, 'ClickUp Controller');
      
      return res.json({
        success: true,
        message: `Processed ${results.length} tasks`,
        results: results,
        processingTime: totalTime
      });
    }
    
    // Handle single task object
    // Extract the task data from the request - handle different possible structures
    let taskData;
    
    // Determine the structure of the incoming data and extract accordingly
    if (req.body && req.body.id) {
      // Direct task object
      taskData = req.body;
      addLog('info', 'Processing direct task object', { id: taskData.id }, 'ClickUp Controller');
    } else if (req.body && req.body.task && req.body.task.id) {
      // Task wrapped in task property
      taskData = req.body.task;
      addLog('info', 'Processing task in task property', { id: taskData.id }, 'ClickUp Controller');
    } else if (req.body && req.body.data && req.body.data.id) {
      // Task wrapped in data property
      taskData = req.body.data;
      addLog('info', 'Processing task in data property', { id: taskData.id }, 'ClickUp Controller');
    } else if (req.body && typeof req.body === 'object') {
      // Try to find a task-like object in the properties
      const possibleTaskKeys = Object.keys(req.body).filter(key => 
        typeof req.body[key] === 'object' && req.body[key] !== null);
      
      addLog('info', 'Scanning properties for task-like object', { 
        keys: possibleTaskKeys 
      }, 'ClickUp Controller');
      
      for (const key of possibleTaskKeys) {
        const obj = req.body[key];
        
        // Ein Objekt mit id und name oder title ist wahrscheinlich ein Task
        if (obj.id && (obj.name || obj.title)) {
          taskData = obj;
          addLog('info', `Found task-like object in property: ${key}`, { id: taskData.id }, 'ClickUp Controller');
          break;
        }
      }
      
      // Wenn immer noch kein Task gefunden wurde, versuche das Body-Objekt selbst
      if (!taskData) {
        // Möglicherweise ein schlecht formatierter Task - sehen wir nach
        const requiredKeys = ['id', 'name', 'title', 'status'];
        const hasAnyRequiredKey = requiredKeys.some(key => req.body[key] !== undefined);
        
        if (hasAnyRequiredKey) {
          addLog('info', 'Using request body directly as task data with minimal validation', {
            availableKeys: Object.keys(req.body).filter(k => requiredKeys.includes(k))
          }, 'ClickUp Controller');
          
          taskData = req.body;
        }
      }
    }
    
    // Wenn Daten in einem ungewöhnlichen Format ankommen, versuchen wir einen leeren Task zu erstellen
    if (!taskData) {
      addLog('warning', 'No valid task data structure found, using entire body as fallback', {
        body: req.body
      }, 'ClickUp Controller');
      
      // Letzter Versuch - behandle als ob ein Task
      taskData = req.body;
    }
    
    // Transform task data using the utility function
    const transformedData = transformClickUpData(taskData);
    
    // Log the transformed data for debugging
    console.log('TRANSFORMED CLICKUP DATA:', JSON.stringify(transformedData, null, 2));
    
    addLog('info', 'Task data transformed', { 
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
        form: form._id,
        processingTime: Date.now() - startTime
      }, 'ClickUp Controller');
    } else {
      // Create new form
      operationType = 'created';
      const newForm = new Form(transformedData);
      form = await newForm.save();
      
      addLog('success', `Created new lead from ClickUp: ${transformedData.leadName}`, {
        taskId: transformedData.taskId,
        form: form._id,
        processingTime: Date.now() - startTime
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
    
    // Log the error
    try {
      addLog('error', 'Error processing Make.com webhook', {
        error: error.message,
        stack: error.stack,
        body: req.body
      }, 'ClickUp Controller');
    } catch (logError) {
      console.error('Error logging webhook error:', logError);
    }
    
    // Sende eine Erfolgsmeldung zurück, damit Make.com den Webhook als verarbeitet betrachtet
    // Dies verhindert erneute Zustellungsversuche bei temporären Fehlern
    res.status(200).json({
      success: false,
      message: 'Webhook received but processing failed',
      error: error.message
    });
  }
};