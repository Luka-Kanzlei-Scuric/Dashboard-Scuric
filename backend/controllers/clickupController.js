// backend/controllers/clickupController.js
const Form = require('../models/Form');
const clickupUtils = require('../utils/clickupUtils');

// Map dashboard phases to ClickUp statuses
const mapPhaseToClickUpStatus = clickupUtils.mapPhaseToClickUpStatus;

// Implementiere die transformClickUpData Funktion direkt im Controller
function transformClickUpData(clickupTask) {
  // Extrahiere benutzerdefinierte Felder (für einfacheren Zugriff)
  const customFields = {};
  if (Array.isArray(clickupTask.custom_fields)) {
    clickupTask.custom_fields.forEach(field => {
      customFields[field.name] = field.value;
    });
  }
  
  // Ermittle Phase basierend auf Status
  const phase = mapStatusToPhase(clickupTask.status?.status || 'NEUE ANFRAGE');
  
  // Behandle die Daten
  let createdAtDate = new Date();
  let updatedAtDate = new Date();
  
  try {
    if (clickupTask.date_created) {
      createdAtDate = new Date(clickupTask.date_created);
    }
  } catch (e) {
    console.log('Fehler beim Parsen des Erstellungsdatums:', e);
  }
  
  try {
    if (clickupTask.date_updated) {
      updatedAtDate = new Date(clickupTask.date_updated);
    }
  } catch (e) {
    console.log('Fehler beim Parsen des Aktualisierungsdatums:', e);
  }
  
  // Stelle sicher, dass taskId und leadName gültige Werte haben
  const taskId = clickupTask.id || `fallback-${Date.now()}`;
  const leadName = clickupTask.name || 'Unbekannter Mandant';
  
  // Erstelle das transformierte Objekt
  return {
    taskId: taskId,
    leadName: leadName,
    phase: phase,
    qualifiziert: isQualified(clickupTask.status?.status || 'NEUE ANFRAGE'),
    
    // Kontaktinformationen (aus benutzerdefinierten Feldern)
    strasse: customFields['Straße'] || '',
    hausnummer: customFields['Hausnummer'] || '',
    plz: customFields['PLZ'] || '',
    wohnort: customFields['Ort'] || '',
    email: customFields['Email'] || '',
    telefon: customFields['Telefonnummer'] || '',
    
    // Finanzielle Daten (optional)
    gesamtSchulden: customFields['Gesamtschulden'] || '0',
    glaeubiger: customFields['Gläubiger Anzahl'] || '0',
    
    // Metadaten
    createdAt: createdAtDate,
    updatedAt: updatedAtDate,
    
    // ClickUp-spezifische Daten (für die Referenz)
    clickupData: {
      status: clickupTask.status?.status || 'Unbekannt',
      statusColor: clickupTask.status_color || '#cccccc',
      priority: clickupTask.priority || 'normal'
    }
  };
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
    
    // Extract the task data from the request
    const taskData = req.body;
    
    if (!taskData || !taskData.id) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task data received'
      });
    }
    
    // Transform task data using the utility function
    const transformedData = transformClickUpData(taskData);
    
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
      
      console.log(`Updated lead from ClickUp: ${transformedData.leadName}`);
    } else {
      // Create new form
      operationType = 'created';
      const newForm = new Form(transformedData);
      form = await newForm.save();
      
      console.log(`Created new lead from ClickUp: ${transformedData.leadName}`);
    }
    
    // Return success response
    res.json({
      success: true,
      message: `Task ${operationType} successfully`,
      form: form
    });
    
  } catch (error) {
    console.error('Error processing Make.com webhook:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook data',
      error: error.message
    });
  }
};