import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import passport from 'passport';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import Passport configuration
import configurePassport from './config/passport.js';

// Import DB config
import connectDB from './config/db.js';

// Import routes
import formRoutes from './routes/formRoutes.js';
import makeRoutes from './routes/makeRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Express app initialisieren
const app = express();

// Body Parser Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
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

// Initialize database connection
connectDB();

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'dashboard-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'none'
    },
    proxy: true
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport
const passportConfig = configurePassport();

// API Routes
app.use('/api/forms', formRoutes);
app.use('/api/make', makeRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/settings', settingsRoutes);

// Health Check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongodb: {
            connected: mongoose.connection.readyState === 1,
            host: mongoose.connection.host
        }
    });
});

// Make.com Webhook Route
app.post('/api/clickup-data', async (req, res) => {
    console.log('Make.com Webhook empfangen');
    console.log('Rohdaten empfangen:', JSON.stringify(req.body, null, 2));
    
    try {
        const Form = (await import('./models/Form.js')).default;
        let taskData = req.body;
        
        if (Array.isArray(taskData)) {
            if (taskData.length > 0) {
                taskData = taskData[0];
            } else {
                return res.json({
                    success: false, 
                    message: 'Leeres Array erhalten'
                });
            }
        }
        
        const taskId = String(taskData.id || taskData.taskId || taskData.task_id || `temp-${Date.now()}`);
        const leadName = String(taskData.name || taskData.title || taskData.leadName || "Neuer Mandant");
        
        let form = await Form.findOne({ taskId });
        
        if (form) {
            form.leadName = leadName;
            form.updatedAt = new Date();
            await form.save();
        } else {
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
        res.status(500).json({
            success: false,
            message: 'Fehler bei der Verarbeitung',
            error: error.message
        });
    }
});

// In production, serve the frontend
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist/client')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/client/index.html'));
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error(`SERVER-FEHLER [${new Date().toISOString()}]:`);
    console.error(`- Route: ${req.method} ${req.originalUrl}`);
    console.error(`- Fehler: ${err.message}`);
    console.error(`- Stack: ${err.stack}`);
    
    res.status(500).json({
        success: false,
        message: 'Interner Server-Fehler',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Auf dem Server ist ein Fehler aufgetreten'
    });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`
==============================================
🚀 PRIVATINSOLVENZ API SERVER GESTARTET
==============================================
🌐 Server läuft auf Port: ${PORT}
🔧 Umgebung: ${process.env.NODE_ENV || 'development'}
⏰ Startzeit: ${new Date().toISOString()}
==============================================
`);
});

export default app;