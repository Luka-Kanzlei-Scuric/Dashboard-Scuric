const express = require('express');
const router = express.Router();
const Form = require('../models/Form');

// Empfange Rohdaten von Make.com und verarbeite sie im Backend
router.post('/clickup-sync', async (req, res) => {
  try {
    // Empfange die ClickUp-Tasks als Rohdaten
    const tasks = req.body;
    
    console.log(`Empfangene Tasks: ${tasks.length}`);
    
    if (!Array.isArray(tasks) || tasks.length === 0) {
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
        } else {
          // Erstelle neues Formular
          const newForm = new Form(transformedData);
          await newForm.save();
          results.created++;
        }
      } catch (error) {
        console.error(`Fehler bei Task ${task.id}:`, error);
        results.failed++;
      }
    }
    
    res.json({
      success: true,
      message: 'Synchronisierung abgeschlossen',
      results
    });
  } catch (error) {
    console.error('Fehler bei der Verarbeitung der Daten:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Interner Serverfehler',
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
  
  // Erstelle das transformierte Objekt
  return {
    taskId: clickupTask.id,
    leadName: clickupTask.name,
    phase: phase,
    qualifiziert: isQualified(clickupTask.status),
    
    // Kontaktinformationen (aus benutzerdefinierten Feldern)
    strasse: customFields['Straße'] || '',
    hausnummer: customFields['Hausnummer'] || '',
    plz: customFields['PLZ'] || '',
    wohnort: customFields['Ort'] || '',
    
    // Finanzielle Daten
    gesamtSchulden: customFields['Gesamtschulden'] || '',
    glaeubiger: customFields['Gläubiger Anzahl'] || '',
    
    // Metadaten
    createdAt: new Date(clickupTask.date_created) || new Date(),
    updatedAt: new Date(clickupTask.date_updated) || new Date(),
    
    // ClickUp-spezifische Daten (für die Referenz)
    clickupData: {
      status: clickupTask.status,
      statusColor: clickupTask.status_color,
      priority: clickupTask.priority
    },
    
    // Speichere auch die Rohdaten (optional)
    rawData: clickupTask
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