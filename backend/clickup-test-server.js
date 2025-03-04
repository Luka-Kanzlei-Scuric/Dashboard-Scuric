const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS erlauben
app.use(cors());

// Basis-Route
app.get('/', (req, res) => {
    res.json({ message: 'ClickUp Test Server läuft' });
});

// ClickUp Test Route
app.get('/test', async (req, res) => {
    try {
        // API-Key aus Umgebungsvariablen oder Hardcoded-Fallback
        const apiKey = process.env.CLICKUP_API_KEY || 'pk_84132000_89QTDVSH9ZPGW3WFSS5K8604I2KGOHMO';
        
        console.log('Testing ClickUp API with key:', apiKey.substring(0, 5) + '...');
        
        // Simple request to the ClickUp API
        const response = await axios({
            method: 'GET',
            url: 'https://api.clickup.com/api/v2/team',
            headers: {
                'Authorization': apiKey
            },
            timeout: 10000
        });
        
        res.json({
            success: true,
            message: 'ClickUp API connection successful',
            teams: response.data.teams.map(team => ({
                id: team.id,
                name: team.name
            }))
        });
    } catch (error) {
        console.error('ClickUp API Test Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'ClickUp API connection failed',
            error: error.response?.data || error.message
        });
    }
});

// Server starten
const PORT = 5002;
app.listen(PORT, () => {
    console.log(`ClickUp Test Server läuft auf Port ${PORT}`);
    console.log(`Verfügbare Routen:`);
    console.log(`GET / - Test Basisroute`);
    console.log(`GET /test - ClickUp API Test`);
});