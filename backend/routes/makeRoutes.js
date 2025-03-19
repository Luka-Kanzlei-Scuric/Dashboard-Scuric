const express = require('express');
const router = express.Router();
const Form = require('../models/Form');

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

// Exportiere Funktionen für andere Module
module.exports.addLog = addLog;
module.exports.getLogs = () => logs;

// Empfange Rohdaten und verarbeite sie im Backend
// Hauptroute ohne Pfad
router.post('/', async (req, res) => {
  console.log('Root Endpunkt erreicht');
  console.log('Rohdaten empfangen:', JSON.stringify(req.body, null, 2));
  
  // In Logs eintragen
  addLog('info', 'Webhook-Anfrage erhalten', {
    data: req.body,
    headers: req.headers
  }, 'API Integration');
  
  // Erfolgreiches Ergebnis zurückgeben
  res.json({
    success: true,
    message: 'Anfrage empfangen',
    received: true
  });
});

// ClickUp-Synchronisierungsroute
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
    addLog('info', `ClickUp Synchronisierung gestartet`, {
      tasksCount: tasks.length,
      source: 'api',
      timestamp: new Date()
    }, 'ClickUp Integration');
    
    if (tasks.length === 0) {
      addLog('warning', 'Leerer Request erhalten', null, 'ClickUp Integration');
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
          }, 'ClickUp Integration');
        } else {
          // Erstelle neues Formular
          const newForm = new Form(transformedData);
          await newForm.save();
          results.created++;
          addLog('success', `Neuer Mandant erstellt: ${transformedData.leadName}`, {
            taskId: transformedData.taskId,
            operation: 'create'
          }, 'ClickUp Integration');
        }
      } catch (error) {
        console.error(`Fehler bei Task ${task.id}:`, error);
        results.failed++;
        addLog('error', `Fehler bei der Verarbeitung von Task ${task.id || 'unbekannt'}`, {
          errorMessage: error.message,
          stackTrace: error.stack
        }, 'ClickUp Integration');
      }
    }
    
    // Erfolgreiches Ergebnis loggen
    addLog('info', 'ClickUp Synchronisierung abgeschlossen', results, 'ClickUp Integration');
    
    res.json({
      success: true,
      message: 'Synchronisierung abgeschlossen',
      results
    });
  } catch (error) {
    console.error('Fehler bei der Verarbeitung der Daten:', error);
    
    // Fehler loggen
    addLog('error', 'Fehler bei der ClickUp Synchronisierung', {
      errorMessage: error.message,
      stackTrace: error.stack
    }, 'ClickUp Integration');
    
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

// Logs abrufen
router.get('/logs', (req, res) => {
  // CORS-Header werden bereits durch Middleware gesetzt
  
  try {
    // Debug-Ausgabe
    console.log(`Logs-Anfrage erhalten. Sende ${logs.length} Logs zurück.`);
    
    res.json({ 
      success: true,
      logs: logs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Logs:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      logs: []
    });
  }
});

// Produktionsbereit - Testroute entfernt

// Importiere die Funktionen aus dem Controller
// Um Zirkularreferenzen zu vermeiden, exportieren wir die transformClickUpData Funktion nicht mehr aus makeRoutes
// Stattdessen nutzen wir die Version aus dem Controller

module.exports = router;