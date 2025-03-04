const express = require('express');
const axios = require('axios');
const app = express();

// Dein ClickUp API Key
const API_KEY = 'pk_84132000_89QTDVSH9ZPGW3WFSS5K8604I2KGOHMO';

// Einfacher Endpunkt
app.get('/', (req, res) => {
  res.json({ message: 'ClickUp Test Server läuft!' });
});

// ClickUp Test Endpunkt
app.get('/clickup-test', async (req, res) => {
  try {
    console.log('ClickUp API Test mit Key:', API_KEY.substring(0, 5) + '...');
    
    const response = await axios({
      method: 'GET',
      url: 'https://api.clickup.com/api/v2/team',
      headers: {
        'Authorization': API_KEY
      }
    });
    
    res.json({
      success: true,
      message: 'ClickUp API Verbindung erfolgreich',
      teams: response.data.teams
    });
  } catch (error) {
    console.error('ClickUp API Fehler:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'ClickUp API Verbindung fehlgeschlagen',
      error: error.message
    });
  }
});

// Server starten
const PORT = 5004;
app.listen(PORT, () => {
  console.log(`ClickUp Test Server läuft auf Port ${PORT}`);
  console.log(`Teste mit: http://localhost:${PORT}/clickup-test`);
});