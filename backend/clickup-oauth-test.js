const express = require('express');
const axios = require('axios');
const app = express();

// Konfiguration für ClickUp OAuth
const CLIENT_ID = 'IKMND4LORUY6IQD1EOES6DKT3CIUVN92'; // Hier deine ClickUp App Client ID eintragen
const CLIENT_SECRET = 'ZM7WPKW2RHMU5JRN3PBOZGTJ14UC7AO9I6PXA3CH6S23C143YOR8RX8WSFYBVFIA'; // Hier dein ClickUp App Client Secret eintragen
const REDIRECT_URI = 'DEINE_NEUE_NGROK_URL/oauth/callback'; // Ersetze mit der neuen ngrok URL

// Statische HTML-Seite
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ClickUp API Test</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          button { padding: 10px 20px; background-color: #7B68EE; color: white; border: none; border-radius: 4px; cursor: pointer; }
          button:hover { background-color: #6A5ACD; }
          pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }
        </style>
      </head>
      <body>
        <h1>ClickUp OAuth Test</h1>
        <p>Klicke auf den Button, um den OAuth-Prozess zu starten:</p>
        <button onclick="startOAuth()">Mit ClickUp verbinden</button>
        <div id="result" style="margin-top: 20px;"></div>
        
        <script>
          function startOAuth() {
            // ClickUp OAuth URL mit Client ID und Redirect URI
            const oauthUrl = 'https://app.clickup.com/api?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}';
            window.location.href = oauthUrl;
          }
        </script>
      </body>
    </html>
  `);
});

// OAuth Callback Endpunkt
app.get('/oauth/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Fehler: Kein Autorisierungscode erhalten');
  }

  try {
    console.log('Autorisierungscode erhalten:', code);

    // Tausche den Code gegen ein Access Token
    const tokenResponse = await axios({
      method: 'POST',
      url: 'https://api.clickup.com/api/v2/oauth/token',
      data: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;
    console.log('Access Token erhalten:', accessToken);

    // Hole Benutzerinformationen mit dem Access Token
    const userResponse = await axios({
      method: 'GET',
      url: 'https://api.clickup.com/api/v2/user',
      headers: {
        'Authorization': accessToken
      }
    });

    // Zeige Erfolgsseite mit Benutzerinformationen
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ClickUp API Test - Erfolg</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .success { color: green; }
            pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1 class="success">Erfolg! ClickUp OAuth ist eingerichtet.</h1>
          <p>Dein Access Token: <strong>${accessToken}</strong></p>
          <p>Benutzerinformationen:</p>
          <pre>${JSON.stringify(userResponse.data, null, 2)}</pre>
          <hr>
          <h2>Was nun?</h2>
          <p>Du kannst diesen Access Token in deiner .env-Datei hinterlegen oder anstelle des API Keys verwenden.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('OAuth Fehler:', error.response?.data || error.message);

    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ClickUp API Test - Fehler</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .error { color: red; }
            pre { background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1 class="error">Fehler bei OAuth</h1>
          <p>Es ist ein Fehler aufgetreten:</p>
          <pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>
        </body>
      </html>
    `);
  }
});

// Server starten
const PORT = 5003;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`OAuth Redirect URI: ${REDIRECT_URI}`);
  console.log(`Besuche http://localhost:${PORT} im Browser`);
});