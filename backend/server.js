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

// Body Parser Middleware muss vor CORS stehen
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the public directory
app.use(express.static('public'));

//Middleware - CORS aktivieren für alle Anfragen
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://formular-mitarbeiter.vercel.app',
        'https://dashboard-scuric.vercel.app',
        'https://dashboard-scuric.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        undefined
    ];
    
    // Im Development-Modus oder für erlaubte Origins CORS erlauben
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
    } else {
        // Log ungültige Anfrage
        console.warn(`CORS-Anfrage von nicht erlaubter Origin blockiert: ${origin}`);
    }
    
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

// SUPER-VEREINFACHTE Webhook-Route für Make.com - Minimale Version für maximale Zuverlässigkeit
app.post('/api/clickup-data', async (req, res) => {
    console.log('Make.com Webhook empfangen - SUPER-VEREINFACHTE VERARBEITUNG');
    console.log('Rohdaten empfangen:', JSON.stringify(req.body, null, 2));
    
    try {
        // Datenbank-Modell importieren
        const Form = require('./models/Form');
        
        // Grundlegende Datenextraktion
        let taskData = req.body;
        
        // Support für Arrays
        if (Array.isArray(taskData)) {
            console.log(`Array mit ${taskData.length} Elementen erhalten, verwende das erste Element`);
            if (taskData.length > 0) {
                taskData = taskData[0];
            } else {
                return res.json({
                    success: false, 
                    message: 'Leeres Array erhalten'
                });
            }
        }
        
        // MINIMALE Datenextraktion - nur ID und Name sind notwendig
        // Alle Werte in String konvertieren um Typprobleme zu vermeiden
        let taskId = String(taskData.id || taskData.taskId || taskData.task_id || `temp-${Date.now()}`);
        let leadName = String(taskData.name || taskData.title || taskData.leadName || "Neuer Mandant");
        
        // Optional: Versuch, Status und Kontaktinformationen zu extrahieren
        let status = "NEUE ANFRAGE";
        let email = "";
        let telefon = "";
        
        // Einfache Status-Extraktion
        if (taskData.status) {
            if (typeof taskData.status === 'string') {
                status = taskData.status;
            } else if (taskData.status.status) {
                status = taskData.status.status;
            }
        }
        
        // Einfache Email-Extraktion
        if (taskData.email) email = taskData.email;
        
        // Einfache Telefon-Extraktion
        if (taskData.telefon) telefon = taskData.telefon;
        if (taskData.phone) telefon = taskData.phone;
        
        // Extrahiere aus Custom Fields, falls vorhanden
        if (Array.isArray(taskData.custom_fields)) {
            taskData.custom_fields.forEach(field => {
                if (field.name === "Email" && field.value) email = field.value;
                if (field.name === "Telefonnummer" && field.value) telefon = field.value;
            });
        }
        
        // Prüfen, ob der Task bereits existiert
        let form = await Form.findOne({ taskId });
        let isNew = false;
        
        if (form) {
            console.log(`Task ${taskId} existiert bereits, aktualisiere`);
            form.leadName = leadName;
            form.updatedAt = new Date();
            
            // Status aktualisieren - direkter Zugriff statt verschachtelter Struktur
            form.clickupData = form.clickupData || {};
            form.clickupData.status = status;
            
            // Aktualisiere Kontaktinformationen, wenn vorhanden
            if (email) form.email = email;
            if (telefon) form.telefon = telefon;
            
            await form.save();
        } else {
            console.log(`Erstelle neuen Task ${taskId}`);
            isNew = true;
            
            // Erstelle ein neues Formular mit minimalen Daten
            form = new Form({
                taskId: taskId,
                leadName: leadName,
                phase: 'erstberatung',
                qualifiziert: false,
                email: email || '',
                telefon: telefon || '',
                createdAt: new Date(),
                updatedAt: new Date(),
                clickupData: {
                    status: status
                }
            });
            
            await form.save();
        }
        
        console.log(`Task ${isNew ? 'erstellt' : 'aktualisiert'}: ${leadName} (${taskId})`);
        
        // Erfolgreiche Antwort
        res.json({
            success: true,
            message: `Task erfolgreich ${isNew ? 'erstellt' : 'aktualisiert'}`,
            form: {
                id: form.taskId,
                name: form.leadName,
                status: form.clickupData?.status || status
            }
        });
        
    } catch (error) {
        console.error('Fehler bei der Verarbeitung des Make.com Webhooks:', error);
        
        // Einfache Fehlerantwort
        res.status(200).json({  // Status 200 damit Make.com es als "erfolgreich" betrachtet
            success: false,
            message: 'Fehler bei der Verarbeitung',
            error: error.message
        });
    }
});

// Alternative Make-Route - noch einfachere Version
app.post('/api/make-webhook', async (req, res) => {
    console.log('Make.com Webhook: ALTERNATIVE ROUTE');
    console.log('Received data:', JSON.stringify(req.body, null, 2));
    
    try {
        const Form = require('./models/Form');
        const data = req.body;
        
        // Absolute Mindestdaten extrahieren
        const taskId = String(data.id || data.taskId || `make-${Date.now()}`);
        const name = String(data.name || data.title || "Mandant von Make");
        
        // In Datenbank speichern
        let form = await Form.findOne({ taskId });
        
        if (form) {
            form.leadName = name;
            form.updatedAt = new Date();
            await form.save();
            console.log('Updated existing form:', taskId);
        } else {
            form = new Form({
                taskId,
                leadName: name,
                phase: 'erstberatung',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            await form.save();
            console.log('Created new form:', taskId);
        }
        
        res.json({ success: true, id: taskId, name });
        
    } catch (error) {
        console.error('Error processing Make webhook:', error);
        res.status(200).json({ success: false, error: error.message });
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