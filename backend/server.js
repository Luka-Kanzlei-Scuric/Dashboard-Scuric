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
        'http://localhost:4173', // Preview-Modus von Vite
        process.env.CORS_ORIGIN || 'https://dashboard-scuric.vercel.app', // Vercel Frontend URL
        '*' // Temporär alle Origins erlauben
    ].filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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

// Test Logs Endpoint für Frontend
app.get('/api/test-logs', (req, res) => {
    console.log('Test logs endpoint called');
    const testLogs = [
        {
            type: 'info',
            message: 'System gestartet',
            source: 'Backend',
            timestamp: new Date(),
            details: null
        },
        {
            type: 'success',
            message: 'Datenbankverbindung hergestellt',
            source: 'Database',
            timestamp: new Date(),
            details: null
        },
        {
            type: 'warning',
            message: 'Langsame Anfrage',
            source: 'API',
            timestamp: new Date(),
            details: { duration: '2500ms', endpoint: '/api/test' }
        }
    ];
    
    // CORS-Header explizit setzen
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    res.json({
        success: true,
        logs: testLogs,
        timestamp: new Date().toISOString()
    });
});

// Direkter Endpunkt für N8N Integration
app.post('/api/clickup-data', async (req, res) => {
    console.log('N8N DIRECT API ENDPOINT REACHED');
    
    try {
        // Logs-System importieren
        const makeRoutes = require('./routes/makeRoutes');
        const addLog = makeRoutes.addLog;
        
        // Event-Daten extrahieren
        let data = req.body;
        console.log('Received data:', JSON.stringify(data, null, 2));
        
        // Korrigiere verschachtelte Daten von N8N (bei Content Type: JSON-Problem)
        if (data && data["Content Type: JSON"]) {
            data = [data["Content Type: JSON"]]; // In Array verpacken für Kompatibilität
            console.log('Daten korrigiert aus Content-Type-Format');
        }
        
        // In Logs eintragen
        if (typeof addLog === 'function') {
            addLog('info', 'N8N Webhook empfangen', data, 'N8N Integration');
        }

        // Webhook-Daten extrahieren und in Form umwandeln
        const Form = require('./models/Form');
        let results = {
            created: 0,
            updated: 0,
            failed: 0,
            processed: 0
        };
        
        // Verarbeite Webhook-Daten
        if (Array.isArray(data) && data.length > 0) {
            for (const item of data) {
                try {
                    results.processed++;
                    
                    // Bei Webhook-Event direkter API-Call für Task-Details
                    if (item.task_id && (item.event === 'taskCreated' || item.event === 'taskUpdated')) {
                        const taskId = item.task_id;
                        
                        // Prüfe, ob der Task bereits existiert
                        let form = await Form.findOne({ taskId: taskId });
                        
                        if (form) {
                            // Nur Datum aktualisieren
                            form = await Form.findOneAndUpdate(
                                { taskId: taskId },
                                { $set: { updatedAt: new Date() } },
                                { new: true }
                            );
                            results.updated++;
                            
                            if (typeof addLog === 'function') {
                                addLog('success', `Task aktualisiert: ${taskId}`, {
                                    taskId: taskId,
                                    event: item.event
                                }, 'N8N Webhook');
                            }
                        } else {
                            // Minimalversion erstellen
                            const newForm = new Form({
                                taskId: taskId,
                                leadName: 'Neuer Lead von Webhook',
                                createdAt: new Date(),
                                updatedAt: new Date()
                            });
                            await newForm.save();
                            results.created++;
                            
                            if (typeof addLog === 'function') {
                                addLog('success', `Neuer Task angelegt: ${taskId}`, {
                                    taskId: taskId,
                                    event: item.event
                                }, 'N8N Webhook');
                            }
                        }
                    }
                } catch (error) {
                    console.error('Fehler bei Verarbeitung:', error);
                    results.failed++;
                    
                    if (typeof addLog === 'function') {
                        addLog('error', 'Fehler bei Webhook-Verarbeitung', {
                            error: error.message,
                            item: item
                        }, 'N8N Webhook');
                    }
                }
            }
        }
        
        // Erfolgreiche Antwort senden
        res.json({
            success: true,
            message: 'N8N Webhook verarbeitet',
            results: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Fehler im N8N Endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Verarbeitung',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

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