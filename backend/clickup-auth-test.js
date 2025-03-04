const express = require('express');
const axios = require('axios');
const app = express();

// Dein ClickUp API Key
const API_KEY = 'pk_84132000_89QTDVSH9ZPGW3WFSS5K8604I2KGOHMO';

// Einfacher Endpunkt
app.get('/', (req, res) => {
  res.json({ message: 'ClickUp Auth Test Server läuft!' });
});

// ClickUp Test Endpunkt mit verschiedenen Auth-Formaten
app.get('/auth-test', async (req, res) => {
  const results = {
    formats: [],
    errors: []
  };
  
  // Teste verschiedene Auth-Header-Formate
  const formats = [
    { name: 'Nur API Key', value: API_KEY },
    { name: 'Mit Bearer', value: `Bearer ${API_KEY}` }
  ];
  
  try {
    for (const format of formats) {
      try {
        console.log(`Teste Auth-Format: ${format.name}`);
        
        const response = await axios({
          method: 'GET',
          url: 'https://api.clickup.com/api/v2/user',
          headers: {
            'Authorization': format.value
          },
          timeout: 5000
        });
        
        results.formats.push({
          name: format.name,
          success: true,
          status: response.status,
          data: response.data
        });
        
        console.log(`✅ Format "${format.name}" erfolgreich!`);
      } catch (error) {
        console.error(`❌ Format "${format.name}" fehlgeschlagen:`, error.message);
        
        results.formats.push({
          name: format.name,
          success: false,
          status: error.response?.status,
          error: error.response?.data || error.message
        });
        
        results.errors.push(`Format "${format.name}": ${error.message}`);
      }
    }
    
    res.json({
      message: 'ClickUp Auth-Test abgeschlossen',
      results
    });
  } catch (error) {
    console.error('Allgemeiner Fehler:', error.message);
    
    res.status(500).json({
      success: false,
      message: 'Test fehlgeschlagen',
      error: error.message
    });
  }
});

// Server starten
const PORT = 5005;
app.listen(PORT, () => {
  console.log(`ClickUp Auth Test Server läuft auf Port ${PORT}`);
  console.log(`Teste mit: http://localhost:${PORT}/auth-test`);
});