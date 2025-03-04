const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Form = require('./models/Form'); // Falls du auf deine Formulare zugreifen willst

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Für Tests - in Produktion solltest du das einschränken
  credentials: true
}));
app.use(bodyParser.json());

// Webhook-Endpunkt für Make.com
app.post('/api/webhook/clickup', async (req, res) => {
  try {
    console.log('Webhook von Make.com empfangen:');
    console.log(JSON.stringify(req.body, null, 2));
    
    // Extrahiere Daten aus dem Webhook
    const { taskId, taskName, status, teamId, spaceId, listId, ...otherData } = req.body;
    
    // Validiere Mindestdaten
    if (!taskId) {
      return res.status(400).json({ error: 'TaskId ist erforderlich' });
    }
    
    // Prüfe, ob der Task bereits in der Datenbank existiert
    let form;
    try {
      form = await Form.findOne({ taskId });
    } catch (dbError) {
      console.log('Datenbank nicht verfügbar, speichere Daten lokal');
      // Speichere die Daten in einer lokalen Datei, wenn die DB nicht verfügbar ist
    }
    
    if (form) {
      // Update vorhandenes Formular
      console.log(`Formular mit TaskId ${taskId} gefunden, aktualisiere...`);
      
      try {
        form = await Form.findOneAndUpdate(
          { taskId }, 
          { 
            $set: {
              leadName: taskName || form.leadName,
              status: status || form.status,
              // Weitere Felder nach Bedarf aktualisieren
              lastUpdated: new Date()
            }
          },
          { new: true }
        );
        
        console.log('Formular aktualisiert');
      } catch (updateError) {
        console.error('Fehler beim Aktualisieren des Formulars:', updateError);
      }
    } else {
      // Erstelle neues Formular
      console.log(`Kein Formular mit TaskId ${taskId} gefunden, erstelle neu...`);
      
      try {
        const newForm = new Form({
          taskId,
          leadName: taskName || 'Unbekannt',
          phase: 'erstberatung',
          qualifiziert: false,
          status: status || 'Neu',
          // Weitere Felder nach Bedarf
          createdAt: new Date(),
          lastUpdated: new Date()
        });
        
        await newForm.save();
        console.log('Neues Formular erstellt');
      } catch (createError) {
        console.error('Fehler beim Erstellen des Formulars:', createError);
      }
    }
    
    // Erfolg zurückmelden
    res.json({ 
      success: true, 
      message: 'Webhook erfolgreich verarbeitet',
      taskId
    });
    
  } catch (error) {
    console.error('Fehler bei der Verarbeitung des Webhooks:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// Status-Endpunkt
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Make.com Webhook-Server ist bereit',
    timestamp: new Date().toISOString()
  });
});

// Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Make.com Webhook-Server läuft auf Port ${PORT}`);
});