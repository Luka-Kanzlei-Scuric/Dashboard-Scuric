const mongoose = require('mongoose');

let isConnected = false; // Variable zur Nachverfolgung des Verbindungsstatus

// Verbindungsoptionen für eine robuste Verbindung in produktiven Umgebungen
const connectOptions = {
    serverSelectionTimeoutMS: 10000, // 10 Sekunden Timeout für initiale Verbindung
    socketTimeoutMS: 45000,         // Lange Socket-Timeouts für stabilere Verbindungen
    maxPoolSize: 10,                // Begrenzt die Anzahl der Verbindungen im Pool
    minPoolSize: 3,                 // Minimale Anzahl der Verbindungen im Pool
    keepAlive: true,                // Hält die Verbindung aktiv
    keepAliveInitialDelay: 300000,  // 5 Minuten Delay für Keep-Alive
    retryWrites: true,              // Wiederholt fehlgeschlagene Schreiboperationen
    retryReads: true                // Wiederholt fehlgeschlagene Leseoperationen
};

// Verbindung zur MongoDB herstellen
const connectDB = async () => {
    try {
        // Verhindert Warnung bei neueren Mongoose-Versionen
        mongoose.set('strictQuery', false);
        
        // Holen der Verbindungs-URI aus den Umgebungsvariablen
        const MONGODB_URI = process.env.MONGODB_URI;
        
        // Prüfen, ob die URI vorhanden ist
        if (!MONGODB_URI) {
            console.warn('⚠️ MongoDB URI fehlt in den Umgebungsvariablen');
            console.warn('⚠️ Server startet ohne Datenbankverbindung');
            console.warn('⚠️ MONGODB_URI muss in .env-Datei definiert werden');
            return false;
        }

        // Prüfen, ob es sich um einen Platzhalter handelt
        if (MONGODB_URI.includes('your-mongodb-connection-string')) {
            console.warn('⚠️ MONGODB_URI enthält Platzhalter "your-mongodb-connection-string"');
            console.warn('⚠️ Server startet ohne Datenbankverbindung');
            console.warn('⚠️ Bitte ersetzen Sie den Platzhalter mit einer gültigen URI');
            return false;
        }

        // Falls bereits verbunden, keine neue Verbindung herstellen
        if (isConnected) {
            console.log('📊 MongoDB: Bestehende Verbindung wird verwendet');
            return true;
        }

        // Verbindung zur Datenbank herstellen
        const conn = await mongoose.connect(MONGODB_URI, connectOptions);
        
        isConnected = true;
        console.log(`✅ MongoDB verbunden: ${conn.connection.host}`);
        
        // Event-Listener für Verbindungsfehler
        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB Verbindungsfehler: ${err.message}`);
            isConnected = false;
        });

        // Event-Listener für geschlossene Verbindungen
        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB Verbindung getrennt');
            isConnected = false;
            
            // Automatisch versuchen, die Verbindung wiederherzustellen
            setTimeout(() => {
                console.log('Versuche, MongoDB-Verbindung wiederherzustellen...');
                connectDB().catch(err => console.error('Fehler bei Wiederverbindung:', err));
            }, 5000); // 5 Sekunden warten vor Wiederverbindungsversuch
        });
        
        return true; // Verbindung erfolgreich hergestellt
    } catch (error) {
        console.error(`❌ MongoDB Verbindungsfehler: ${error.message}`);
        
        if (process.env.NODE_ENV === 'development') {
            console.error(error);
        }
        
        console.warn('⚠️ Server startet ohne Datenbankverbindung');
        console.warn('⚠️ Einige Funktionen werden nicht wie erwartet funktionieren');
        
        // Bei Verbindungsfehlern in Produktion mehrmals versuchen
        if (process.env.NODE_ENV === 'production') {
            console.log('Automatischer Wiederverbindungsversuch in 10 Sekunden...');
            setTimeout(() => {
                connectDB().catch(err => console.error('Fehler bei automatischer Wiederverbindung:', err));
            }, 10000);
        }
        
        isConnected = false;
        return false; // Verbindung nicht hergestellt
    }
};

module.exports = connectDB;