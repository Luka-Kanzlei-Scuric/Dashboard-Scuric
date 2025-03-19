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
// Verbesserte CORS-Konfiguration
app.use((req, res, next) => {
    // Zulässige Ursprünge definieren
    const allowedOrigins = [
        'https://formular-mitarbeiter.vercel.app',
        'https://dashboard-scuric.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
    ];
    
    // Ursprung aus dem Header auslesen
    const origin = req.headers.origin;
    
    // Header setzen, wenn der Ursprung in den erlaubten Ursprüngen ist oder für alle Ursprünge
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    }
    
    // CORS-Preflight-Anfrage beantworten
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Normale Anfrage weiterleiten
    next();
});

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

// Integration Routes
app.use('/api/integrations', require('./routes/integrationRoutes'));

// Real logs endpoint for frontend
app.get('/api/logs', (req, res) => {
    try {
        // Get logs from makeRoutes module
        const makeRoutes = require('./routes/makeRoutes');
        const logs = makeRoutes.getLogs ? makeRoutes.getLogs() : [];
        
        // CORS-Header werden bereits durch Middleware gesetzt
        
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
            addLog('info', 'Make.com Webhook empfangen', {
                endpoint: '/api/clickup-data',
                timestamp: new Date().toISOString(),
                headers: req.headers['content-type'],
                body: req.body
            }, 'Make Integration');
        }
        
        // Anfrage formatieren, wenn es ein Array ist
        if (Array.isArray(req.body) && req.body.length > 0) {
            addLog('info', 'Array von Tasks empfangen, verarbeite sequentiell', {
                count: req.body.length
            }, 'Make Integration');
            
            // An den ClickUp-Controller weiterleiten
            const clickupController = require('./controllers/clickupController');
            const results = [];
            
            // Verarbeite jede Task einzeln
            for (const task of req.body) {
                try {
                    // Erstelle ein temporäres Response-Objekt
                    const tempRes = {
                        status: (code) => ({ json: (data) => ({ code, data }) }),
                        json: (data) => data
                    };
                    
                    // Verarbeite die Anfrage mit einer einzelnen Task
                    const tempReq = { ...req, body: task };
                    const result = await clickupController.handleMakeWebhook(tempReq, tempRes);
                    results.push(result);
                } catch (taskError) {
                    addLog('error', `Fehler bei der Verarbeitung von Task ${task.id || 'unbekannt'}`, {
                        error: taskError.message
                    }, 'Make Integration');
                    
                    results.push({
                        success: false,
                        message: `Fehler bei Task ${task.id || 'unbekannt'}`,
                        error: taskError.message
                    });
                }
            }
            
            // Sende eine zusammengefasste Antwort
            return res.json({
                success: true,
                message: `${results.length} Tasks verarbeitet`,
                results: results
            });
        } else {
            // An den ClickUp-Controller weiterleiten
            const clickupController = require('./controllers/clickupController');
            
            // Request und Response an den Make-Webhook-Handler weiterleiten
            await clickupController.handleMakeWebhook(req, res);
        }
    } catch (error) {
        console.error('Fehler im Make.com Webhook Endpoint:', error);
        
        // Versuche, den Fehler zu loggen
        try {
            const makeRoutes = require('./routes/makeRoutes');
            if (typeof makeRoutes.addLog === 'function') {
                makeRoutes.addLog('error', 'Fehler bei der Verarbeitung eines Make.com-Webhooks', {
                    error: error.message,
                    stack: error.stack,
                    timestamp: new Date().toISOString()
                }, 'Make Integration');
            }
        } catch (logError) {
            console.error('Konnte Fehler nicht loggen:', logError);
        }
        
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