const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

// Import Passport configuration
const configurePassport = require('./config/passport');

// Import DB config
const connectDB = require('./config/db');

// Express app initialisieren
const app = express();

// Serve static files from the public directory
app.use(express.static('public'));

//Middleware
app.use(cors({
    origin: [
        'https://formular-mitarbeiter.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173', // Preview-Modus von Vite
        'https://dashboard-scuric.vercel.app', // Vercel Frontend URL
        process.env.CORS_ORIGIN,
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

// Configure session middleware (required for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dashboard-clickup-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'none'
  },
  proxy: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport
configurePassport();

// Basic test route
app.get('/', (req, res) => {
    res.json({ message: 'Privatinsolvenz API läuft' });
});

// Production ready - test routes removed

// Routes
app.use('/api/forms', require('./routes/formRoutes'));

// Make.com-Routes
app.use('/api/make', require('./routes/makeRoutes'));

// Integration Routes - disabled for Make.com integration
// app.use('/api/integration', require('./routes/integrationRoutes'));

// Real logs endpoint for frontend
app.get('/api/logs', (req, res) => {
    try {
        // Get logs from makeRoutes module
        const makeRoutes = require('./routes/makeRoutes');
        const logs = makeRoutes.getLogs ? makeRoutes.getLogs() : [];
        
        // CORS-Header explizit setzen
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        
        res.json({
            success: true,
            logs: logs,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get logs',
            error: error.message
        });
    }
});

// Webhook-Route für Make.com - Wird an den ClickUp-Controller weitergeleitet
app.post('/api/clickup-data', async (req, res) => {
    console.log('Make.com Webhook empfangen, leite an ClickUp-Controller weiter');
    
    try {
        // Logs-System importieren
        const makeRoutes = require('./routes/makeRoutes');
        const addLog = makeRoutes.addLog;
        
        // In Logs eintragen
        if (typeof addLog === 'function') {
            addLog('info', 'Make.com Webhook empfangen', req.body, 'Make Integration');
        }
        
        // An den ClickUp-Controller weiterleiten
        const clickupController = require('./controllers/clickupController');
        
        // Request und Response an den Make-Webhook-Handler weiterleiten
        await clickupController.handleMakeWebhook(req, res);
    } catch (error) {
        console.error('Fehler im Make.com Webhook Endpoint:', error);
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Verarbeitung des Webhooks',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Load ClickUp routes - simplified for Make.com integration
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
    console.log(`GET / - API Status`);
    console.log(`GET /api/forms - Formulare abrufen`);
    console.log(`GET /api/logs - Logs abrufen`);
    console.log(`POST /api/clickup/make-webhook - Make.com Webhook-Endpunkt`);
});