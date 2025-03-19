// backend/routes/clickupRoutes.js
const express = require('express');
const router = express.Router();
const clickupController = require('../controllers/clickupController');
const Form = require('../models/Form');

// Handle webhook from Make.com with ClickUp task data
router.post('/make-webhook', clickupController.handleMakeWebhook);

// DEBUG-ONLY: Get all forms in database
router.get('/debug-forms', async (req, res) => {
  try {
    const forms = await Form.find().select('taskId leadName phase qualifiziert updatedAt createdAt gesamtSchulden');
    console.log('Debug forms abgerufen, Anzahl:', forms.length);
    
    // CORS-Header werden bereits durch Middleware gesetzt
    
    res.json({
      success: true,
      count: forms.length,
      forms
    });
  } catch (error) {
    console.error('Error in debug-forms:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all leads from ClickUp
router.get('/leads', async (req, res) => {
  try {
    console.log('Request to fetch ClickUp leads received');
    
    // Vereinfachte Implementierung ohne Log-Abhängigkeit

    // Hole alle Formulare aus der Datenbank
    const forms = await Form.find({})
      .sort({ updatedAt: -1 }) // Sortiere nach Update-Datum (neuste zuerst)
      .limit(50); // Begrenze auf 50 Einträge
    
    // Wandle Formulare in das Format um, das im Frontend erwartet wird
    const tasks = forms.map(form => ({
      id: form.taskId,
      name: form.leadName || 'Unbekannter Mandant',
      status: form.clickupData?.status || 'Unbekannt',
      dateCreated: form.createdAt.toISOString(),
      dateUpdated: form.updatedAt.toISOString(),
      // Weitere Informationen für Frontend-Anzeige
      schulden: form.gesamtSchulden || "0",
      glaeubiger: form.glaeubiger || "0",
      phase: form.phase || "erstberatung",
      imported: true // Markiere als bereits importiert
    }));
    
    // Logs für Debugging
    console.log(`Gefunden: ${tasks.length} Tasks für das Frontend`);
    
    res.json({
      success: true,
      message: 'Leads erfolgreich abgerufen',
      tasks: tasks
    });
  } catch (error) {
    console.error('Error getting leads:', error);
    
    res.status(500).json({
      success: false,
      message: 'Fehler beim Abrufen der Leads',
      error: error.message
    });
  }
});

// Import a task from ClickUp
router.post('/import/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    console.log('Request to import ClickUp task:', taskId);
    
    // Suche zuerst, ob der Task bereits in der Datenbank existiert
    let existingForm = await Form.findOne({ taskId });
    
    if (existingForm) {
      // Der Task existiert bereits, gebe ihn zurück
      console.log('Task bereits vorhanden:', existingForm.leadName);
      
      return res.json({
        success: true,
        message: 'Task bereits importiert',
        form: existingForm
      });
    }
    
    // Erstelle einen neuen Task mit Testdaten
    const newForm = new Form({
      taskId: taskId,
      leadName: `Neuer Mandant (${taskId.substring(0, 6)})`,
      phase: 'erstberatung',
      qualifiziert: false,
      gesamtSchulden: '15000',
      glaeubiger: '5',
      strasse: 'Teststraße',
      hausnummer: '42',
      plz: '12345',
      wohnort: 'Berlin',
      email: 'test@example.com',
      telefon: '030-123456789',
      createdAt: new Date(),
      updatedAt: new Date(),
      clickupData: {
        status: 'NEUE ANFRAGE',
        statusColor: '#cccccc',
        priority: 'normal'
      }
    });
    
    // Speichere den neuen Task
    await newForm.save();
    
    console.log('Neuer Task erstellt:', newForm.leadName);
    
    res.json({
      success: true,
      message: 'Task importiert und mit Testdaten vorbereitet',
      form: newForm
    });
  } catch (error) {
    console.error('Error importing task:', error);
    
    res.status(500).json({
      success: false,
      message: 'Fehler beim Importieren des Tasks',
      error: error.message
    });
  }
});

module.exports = router;