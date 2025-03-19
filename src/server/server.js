const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
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

// Simplified CORS configuration
const allowedOrigins = [
    'https://dashboard-scuric-git-main-luka-kanzlei-scurics-projects.vercel.app',
    'https://dashboard-scuric.vercel.app',
    'https://dashboard-scuric.onrender.com',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

//Middleware - CORS aktivieren für alle Anfragen
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = [
        'https://formular-mitarbeiter.vercel.app',
        'https://dashboard-scuric.vercel.app',
        'https://dashboard-scuric.onrender.com',
        'https://dashboard-scuric-5qwacs1xe-luka-kanzlei-scurics-projects.vercel.app',
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

// Datenbank-Verbindung mit Wiederversuchen
(async () => {
    try {
        const MAX_RETRY_COUNT = 5;
        let retryCount = 0;
        let dbConnected = false;
        
        while (!dbConnected && retryCount < MAX_RETRY_COUNT) {
            try {
                dbConnected = await connectDB();
                
                if (!dbConnected) {
                    retryCount++;
                    if (retryCount < MAX_RETRY_COUNT) {
                        console.log(`⏳ Datenbankverbindung fehlgeschlagen. Wiederversuch ${retryCount}/${MAX_RETRY_COUNT} in 5 Sekunden...`);
                        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 Sekunden warten
                    }
                }
            } catch (innerError) {
                retryCount++;
                console.error(`❌ Fehler beim Verbindungsversuch ${retryCount}:`, innerError.message);
                
                if (retryCount < MAX_RETRY_COUNT) {
                    const waitTime = 5000 * retryCount; // Exponentielles Backoff
                    console.log(`⏳ Warte ${waitTime/1000} Sekunden vor dem nächsten Versuch...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }
        
        if (!dbConnected) {
            console.warn('⚠️ Server läuft ohne Datenbankverbindung nach mehreren Versuchen');
            console.warn('⚠️ Der Server ist betriebsbereit, aber Daten können nicht gespeichert werden');
            console.warn('⚠️ Die Make.com Integration wird trotzdem funktionieren, aber Daten könnten verloren gehen');
        }
    } catch (error) {
        console.error('❌ Kritischer Fehler beim Verbinden zur Datenbank:', error.message);
        console.warn('⚠️ Server läuft ohne Datenbankverbindung - Bitte überprüfen Sie die Konfiguration');
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

// Server-Status Route mit erweiterten Informationen
app.get('/', (req, res) => {
    const uptime = process.uptime();
    const uptimeFormatted = `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`;
    
    res.json({ 
        status: 'online',
        message: 'Privatinsolvenz API läuft', 
        version: '1.0.0',
        uptime: uptimeFormatted,
        serverTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Einfache Health-Check Route für Server-Monitoring
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Production ready - test routes entfernt

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
    console.log('Make.com Webhook empfangen');
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
        
        // Extrahiere die wichtigsten Daten
        const taskId = String(taskData.id || taskData.taskId || taskData.task_id || `temp-${Date.now()}`);
        const leadName = String(taskData.name || taskData.title || taskData.leadName || "Neuer Mandant");
        
        // Prüfe, ob der Task bereits existiert
        let form = await Form.findOne({ taskId });
        
        if (form) {
            console.log(`Task ${taskId} existiert bereits, aktualisiere`);
            form.leadName = leadName;
            form.updatedAt = new Date();
            await form.save();
        } else {
            console.log(`Erstelle neuen Task ${taskId}`);
            
            // Erstelle ein neues Formular mit minimalen Daten
            form = new Form({
                taskId: taskId,
                leadName: leadName,
                phase: 'erstberatung',
                qualifiziert: false,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            await form.save();
        }
        
        console.log(`Task ${form._id ? 'erstellt' : 'aktualisiert'}: ${leadName} (${taskId})`);
        
        // Erfolgreiche Antwort
        res.json({
            success: true,
            message: `Task erfolgreich ${form._id ? 'erstellt' : 'aktualisiert'}`,
            form: {
                id: form.taskId,
                name: form.leadName,
                phase: form.phase
            }
        });
        
    } catch (error) {
        console.error('Fehler bei der Verarbeitung des Make.com Webhooks:', error);
        
        // Fehlerantwort
        res.status(500).json({
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

// Globale Fehlerbehandlung für unbehandelte Fehler und Abstürze verhindern
process.on('uncaughtException', (error) => {
    console.error('UNBEHANDELTE EXCEPTION - Server läuft weiter:', error);
    // Optional: Sende Benachrichtigungen über kritische Fehler, z.B. per E-Mail
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNBEHANDELTE PROMISE REJECTION - Server läuft weiter:', reason);
});

// Erweiterter Error Handler mit besserem Logging
app.use((err, req, res, next) => {
    // Detailliertes Error-Logging
    console.error(`SERVER-FEHLER [${new Date().toISOString()}]:`);
    console.error(`- Route: ${req.method} ${req.originalUrl}`);
    console.error(`- Fehler: ${err.message}`);
    console.error(`- Stack: ${err.stack}`);
    
    // Client-IP für mögliche Fehleranalyse
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.error(`- Client: ${clientIP}`);
    
    // Sichere Fehlerantwort - keine internen Details in Produktion
    res.status(500).json({
        success: false,
        message: 'Interner Server-Fehler',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Auf dem Server ist ein Fehler aufgetreten',
        requestId: Date.now().toString(36) + Math.random().toString(36).substring(2, 5)
    });
});

// Server starten mit verbesserter Fehlerbehandlung und Informationen
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
    const serverEnv = process.env.NODE_ENV || 'development';
    
    console.log(`
==============================================
🚀 PRIVATINSOLVENZ API SERVER GESTARTET
==============================================
🌐 Server läuft auf Port: ${PORT}
🔧 Umgebung: ${serverEnv.toUpperCase()}
⏰ Startzeit: ${new Date().toISOString()}
==============================================
📋 HAUPTROUTEN:
  > GET / - API Status & Health
  > GET /health - Server Health Check
  > GET /api/forms - Mandanten abrufen
  > GET /api/logs - Logs abrufen
==============================================
🔌 WEBHOOK ENDPUNKTE:
  > POST /api/clickup-data - Primärer Make.com Webhook
  > POST /api/make-webhook - Alternativer Make.com Webhook
  > POST /api/clickup/make-webhook - Legacy Webhook
==============================================
📢 Server bereit für Anfragen!
`);

    // Überwache Server-Ressourcennutzung
    setInterval(() => {
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100;
        if (memoryUsageMB > 200) { // Warnung bei mehr als 200MB
            console.warn(`WARNUNG: Hohe Speichernutzung: ${memoryUsageMB} MB`);
        }
    }, 300000); // Alle 5 Minuten prüfen
});

// Ordentliches Herunterfahren ermöglichen
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown() {
    console.log('\nServer wird ordnungsgemäß heruntergefahren...');
    server.close(() => {
        console.log('Server-Verbindungen geschlossen.');
        process.exit(0);
    });
    
    // Falls der Server innerhalb von 10 Sekunden nicht sauber heruntergefahren wird, hart beenden
    setTimeout(() => {
        console.error('Konnte nicht ordnungsgemäß herunterfahren, erzwinge Beendigung');
        process.exit(1);
    }, 10000);
}

// In production, serve the frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist/client')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
    });
}