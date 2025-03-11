const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import DB config
const connectDB = require('./config/db');

// Express app initialisieren
const app = express();

//Middleware
app.use(cors({
    origin: [
        'https://formular-mitarbeiter.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        process.env.CORS_ORIGIN || 'https://dashboard-scuric.vercel.app' // Vercel Frontend URL
    ].filter(Boolean),
    credentials: true
}));

// Connect to MongoDB
(async () => {
    try {
        const dbConnected = await connectDB();
        if (!dbConnected) {
            console.warn('⚠️ Server läuft ohne Datenbankverbindung');
        }
    } catch (error) {
        console.error('❌ Fehler beim Verbinden zur Datenbank:', error.message);
        console.warn('⚠️ Server läuft ohne Datenbankverbindung');
    }
})();

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Privatinsolvenz API läuft' });
});

// Test client route
app.get('/api/test-client', (req, res) => {
    res.json({
        taskId: "TEST001",
        leadName: "Test Mandant",
        phase: "erstberatung",
        qualifiziert: false,
        glaeubiger: "3",
        gesamtSchulden: "15000",
        createdAt: new Date(),
        updatedAt: new Date()
    });
});

// Direct ClickUp Test Route 
app.get('/api/clickup-test', async (req, res) => {
    try {
        const apiKey = process.env.CLICKUP_API_KEY || 'pk_84132000_89QTDVSH9ZPGW3WFSS5K8604I2KGOHMO';
        
        console.log('Testing ClickUp API with key:', apiKey.substring(0, 5) + '...');
        
        const axios = require('axios');
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

// Routes
app.use('/api/forms', require('./routes/formRoutes'));

// Make.com-Routes
app.use('/api/make', require('./routes/makeRoutes'));

// N8N-ClickUp-Route (für N8N Automation)
app.use('/api/clickup-data', require('./routes/makeRoutes'));

// Try-catch für ClickUp-Routes
try {
    app.use('/api/clickup', require('./routes/clickupRoutes'));
    console.log("ClickUp-Routen erfolgreich geladen");
} catch (error) {
    console.error("Fehler beim Laden der ClickUp-Routen:", error.message);
    
    // Fallback-Route, falls clickupRoutes.js nicht geladen werden kann
    app.get('/api/clickup/error', (req, res) => {
        res.status(500).json({
            error: "ClickUp-Routen konnten nicht geladen werden",
            message: error.message
        });
    });
}

// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Interner Server-Fehler',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Server starten
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT}`);
    console.log(`Verfügbare Routen:`);
    console.log(`GET / - Test Basisroute`);
    console.log(`GET /api/test-client - Test Client Daten`);
    console.log(`GET /api/clickup-test - ClickUp API Test`);
    console.log(`GET /api/clickup/test - ClickUp API Erweiterer Test`);
});