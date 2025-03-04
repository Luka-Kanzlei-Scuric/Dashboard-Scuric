const express = require('express');
const axios = require('axios');
const app = express();

// Einfacher Endpunkt
app.get('/', (req, res) => {
  res.json({ message: 'Network Test Server läuft!' });
});

// Network-Test-Endpunkt
app.get('/network-test', async (req, res) => {
  const testUrls = [
    { name: 'Google', url: 'https://www.google.com' },
    { name: 'GitHub', url: 'https://api.github.com' },
    { name: 'ClickUp API', url: 'https://api.clickup.com/api/v2' }
  ];
  
  const results = [];
  
  try {
    for (const test of testUrls) {
      try {
        console.log(`Teste Verbindung zu ${test.name}...`);
        
        const startTime = Date.now();
        const response = await axios({
          method: 'GET',
          url: test.url,
          timeout: 5000
        });
        const duration = Date.now() - startTime;
        
        results.push({
          name: test.name,
          url: test.url,
          success: true,
          status: response.status,
          duration: `${duration}ms`
        });
        
        console.log(`✅ Verbindung zu ${test.name} erfolgreich (${duration}ms)`);
      } catch (error) {
        console.error(`❌ Verbindung zu ${test.name} fehlgeschlagen:`, error.message);
        
        results.push({
          name: test.name,
          url: test.url,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Netzwerk-Test abgeschlossen',
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
const PORT = 5006;
app.listen(PORT, () => {
  console.log(`Network Test Server läuft auf Port ${PORT}`);
  console.log(`Teste mit: http://localhost:${PORT}/network-test`);
});