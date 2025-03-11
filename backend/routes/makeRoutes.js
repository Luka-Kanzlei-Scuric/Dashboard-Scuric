const express = require('express');
const router = express.Router();
const Form = require('../models/Form');

// Empfange Rohdaten von Make.com oder N8N und verarbeite sie im Backend
router.post('/clickup-sync', async (req, res) => {
  try {
    // Empfange die ClickUp-Tasks als Rohdaten
    let tasks = req.body;
    
    // Debug-Ausgabe der eingehenden Daten
    console.log('Rohdaten empfangen:', JSON.stringify(req.body, null, 2));
    
    // Unterstütze sowohl Arrays als auch einzelne Task-Objekte
    if (!Array.isArray(tasks)) {
      console.log('Einzelner Task empfangen, konvertiere zu Array');
      tasks = [tasks];
    }
    
    console.log(`Empfangene Tasks: ${tasks.length}`);
    
    // In Logs eintragen
    addLog('info', `N8N Synchronisierung gestartet`, {
      tasksCount: tasks.length,
      source: 'api',
      timestamp: new Date()
    }, 'N8N Integration');
    
    if (tasks.length === 0) {
      addLog('warning', 'Leerer Request erhalten', null, 'N8N Integration');
      return res.status(400).json({ 
        success: false, 
        message: 'Keine Tasks im Request gefunden oder Daten nicht im erwarteten Format' 
      });
    }
    
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      processed: tasks.length
    };
    
    // Verarbeite jeden Task
    for (const task of tasks) {
      try {
        // Transformiere die Daten im Backend
        const transformedData = transformClickUpData(task);
        
        // Prüfe, ob der Task bereits existiert
        let form = await Form.findOne({ taskId: transformedData.taskId });
        
        if (form) {
          // Update vorhandenes Formular
          form = await Form.findOneAndUpdate(
            { taskId: transformedData.taskId },
            { $set: transformedData },
            { new: true }
          );
          
          results.updated++;
          addLog('success', `Mandant aktualisiert: ${transformedData.leadName}`, {
            taskId: transformedData.taskId,
            operation: 'update'
          }, 'N8N Integration');
        } else {
          // Erstelle neues Formular
          const newForm = new Form(transformedData);
          await newForm.save();
          results.created++;
          addLog('success', `Neuer Mandant erstellt: ${transformedData.leadName}`, {
            taskId: transformedData.taskId,
            operation: 'create'
          }, 'N8N Integration');
        }
      } catch (error) {
        console.error(`Fehler bei Task ${task.id}:`, error);
        results.failed++;
        addLog('error', `Fehler bei der Verarbeitung von Task ${task.id || 'unbekannt'}`, {
          errorMessage: error.message,
          stackTrace: error.stack
        }, 'N8N Integration');
      }
    }
    
    // Erfolgreiches Ergebnis loggen
    addLog('info', 'N8N Synchronisierung abgeschlossen', results, 'N8N Integration');
    
    res.json({
      success: true,
      message: 'Synchronisierung abgeschlossen',
      results
    });
  } catch (error) {
    console.error('Fehler bei der Verarbeitung der Daten:', error);
    
    // Fehler loggen
    addLog('error', 'Fehler bei der N8N Synchronisierung', {
      errorMessage: error.message,
      stackTrace: error.stack
    }, 'N8N Integration');
    
    res.status(500).json({ 
      success: false, 
      message: 'Interner Serverfehler',
      error: error.message
    });
  }
});

// Debug-Route für die Fehlerbehebung
router.post('/debug', (req, res) => {
  console.log('Debug endpoint hit');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  // Respond with a success message
  res.json({ 
    success: true, 
    message: 'Debug endpoint reached successfully',
    receivedData: req.body
  });
});

// Log-System für das Dashboard
const logs = [];
const MAX_LOGS = 100;

// Log-Funktion
function addLog(type, message, details = null, source = 'System') {
  const logEntry = {
    type: type, // 'success', 'error', 'info', 'warning'
    message,
    details,
    source,
    timestamp: new Date()
  };
  
  logs.unshift(logEntry); // Neue Logs am Anfang hinzufügen
  
  // Maximale Anzahl an Logs begrenzen
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }
  
  console.log(`[${type.toUpperCase()}] ${message}`);
  return logEntry;
}

// Logs abrufen
router.get('/logs', (req, res) => {
  res.json({ 
    success: true,
    logs: logs 
  });
});

// Vereinfachte Test-Route ohne Datenbankzugriff
router.post('/test', (req, res) => {
  try {
    console.log('Test endpoint hit');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Simuliere eine Verarbeitung ohne Datenbankzugriff
    const receivedData = req.body;
    let processedCount = 0;
    
    if (Array.isArray(receivedData)) {
      processedCount = receivedData.length;
    } else if (receivedData && typeof receivedData === 'object') {
      processedCount = 1;
    }
    
    res.json({
      success: true,
      message: 'Test successful',
      processed: processedCount,
      receivedData: req.body
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error in test endpoint',
      error: error.message
    });
  }
});

// Hilfsfunktion zur Transformation der ClickUp-Daten in das gewünschte Format
function transformClickUpData(clickupTask) {
  // Extrahiere benutzerdefinierte Felder (für einfacheren Zugriff)
  const customFields = {};
  if (Array.isArray(clickupTask.custom_fields)) {
    clickupTask.custom_fields.forEach(field => {
      customFields[field.name] = field.value;
    });
  }
  
  // Ermittle Phase basierend auf Status
  const phase = mapStatusToPhase(clickupTask.status);
  
  // Behandle die Daten
  let createdAtDate = new Date();
  let updatedAtDate = new Date();
  
  try {
    if (clickupTask.date_created) {
      createdAtDate = new Date(parseInt(clickupTask.date_created));
    }
  } catch (e) {
    console.log('Fehler beim Parsen des Erstellungsdatums:', e);
  }
  
  try {
    if (clickupTask.date_updated) {
      updatedAtDate = new Date(parseInt(clickupTask.date_updated));
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
    qualifiziert: isQualified(clickupTask.status),
    
    // Kontaktinformationen (aus benutzerdefinierten Feldern)
    strasse: customFields['Straße'] || '',
    hausnummer: customFields['Hausnummer'] || '',
    plz: customFields['PLZ'] || '',
    wohnort: customFields['Ort'] || '',
    
    // Finanzielle Daten
    gesamtSchulden: customFields['Gesamtschulden'] || '0',
    glaeubiger: customFields['Gläubiger Anzahl'] || '0',
    
    // Metadaten
    createdAt: createdAtDate,
    updatedAt: updatedAtDate,
    
    // ClickUp-spezifische Daten (für die Referenz)
    clickupData: {
      status: clickupTask.status || 'Unbekannt',
      statusColor: clickupTask.status_color || '#cccccc',
      priority: clickupTask.priority || 'normal'
    }
  };
}

// Status-zu-Phase Mapping
function mapStatusToPhase(status) {
  const statusMap = {
    'NEUE ANFRAGE': 'erstberatung',
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

// Bestimme, ob ein Task qualifiziert ist
function isQualified(status) {
  const qualifiedStatuses = [
    'QUALIFIZIERT',
    'ANGEBOTSZUSTELLUNG',
    'ANGEBOT UNTERSCHRIEBEN',
    'ANWALT'
  ];
  
  return qualifiedStatuses.includes(status);
}

module.exports = router;