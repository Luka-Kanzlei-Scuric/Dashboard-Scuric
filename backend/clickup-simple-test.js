const express = require('express');
const axios = require('axios');
const app = express();

// Konfiguration
const API_KEY = 'pk_84132000_89QTDVSH9ZPGW3WFSS5K8604I2KGOHMO';

// Hauptseite mit Testlinks
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ClickUp API Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          button { padding: 10px 20px; background-color: #7B68EE; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 5px; }
          button:hover { background-color: #6A5ACD; }
          pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }
          h2 { margin-top: 30px; }
        </style>
      </head>
      <body>
        <h1>ClickUp API Test</h1>
        <p>Wähle einen Test aus:</p>
        
        <div>
          <button onclick="location.href='/test/user'">Benutzerinfo abrufen</button>
          <button onclick="location.href='/test/teams'">Teams abrufen</button>
          <button onclick="location.href='/test/spaces'">Spaces abrufen</button>
        </div>
        
        <div id="result"></div>
      </body>
    </html>
  `);
});

// Test: Benutzerinfo abrufen
app.get('/test/user', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.clickup.com/api/v2/user',
      headers: {
        'Authorization': API_KEY
      }
    });
    
    renderResult(res, 'Benutzerinfo', response.data);
  } catch (error) {
    renderError(res, 'Benutzerinfo', error);
  }
});

// Test: Teams abrufen
app.get('/test/teams', async (req, res) => {
  try {
    const response = await axios({
      method: 'GET',
      url: 'https://api.clickup.com/api/v2/team',
      headers: {
        'Authorization': API_KEY
      }
    });
    
    renderResult(res, 'Teams', response.data);
  } catch (error) {
    renderError(res, 'Teams', error);
  }
});

// Test: Spaces abrufen
app.get('/test/spaces', async (req, res) => {
  try {
    // Wir müssen zuerst die Team-ID abrufen
    const teamsResponse = await axios({
      method: 'GET',
      url: 'https://api.clickup.com/api/v2/team',
      headers: {
        'Authorization': API_KEY
      }
    });
    
    if (!teamsResponse.data.teams || teamsResponse.data.teams.length === 0) {
      return res.status(404).send('Keine Teams gefunden');
    }
    
    const teamId = teamsResponse.data.teams[0].id;
    
    // Dann können wir Spaces für das Team abrufen
    const spacesResponse = await axios({
      method: 'GET',
      url: `https://api.clickup.com/api/v2/team/${teamId}/space`,
      headers: {
        'Authorization': API_KEY
      }
    });
    
    renderResult(res, 'Spaces', spacesResponse.data);
  } catch (error) {
    renderError(res, 'Spaces', error);
  }
});

// Hilfsfunktion für Erfolgsanzeige
function renderResult(res, title, data) {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ClickUp API Test - ${title}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .success { color: green; }
          pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }
          button { padding: 10px 20px; background-color: #7B68EE; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1 class="success">Erfolg! ${title} abgerufen</h1>
        <button onclick="location.href='/'">Zurück zur Übersicht</button>
        <h2>API-Antwort:</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </body>
    </html>
  `);
}

// Hilfsfunktion für Fehleranzeige
function renderError(res, title, error) {
  console.error(`${title} Fehler:`, error.response?.data || error.message);
  
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ClickUp API Test - Fehler</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .error { color: red; }
          pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }
          button { padding: 10px 20px; background-color: #7B68EE; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1 class="error">Fehler bei ${title}</h1>
        <button onclick="location.href='/'">Zurück zur Übersicht</button>
        <p>Es ist ein Fehler aufgetreten:</p>
        <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
        <h3>Debugging-Informationen:</h3>
        <ul>
          <li>Status: ${error.response?.status || 'N/A'}</li>
          <li>URL: ${error.config?.url || 'N/A'}</li>
          <li>Methode: ${error.config?.method?.toUpperCase() || 'N/A'}</li>
        </ul>
      </body>
    </html>
  `);
}

// Server starten
const PORT = 5007; // Anderen Port verwenden
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Besuche http://localhost:${PORT} im Browser`);
});