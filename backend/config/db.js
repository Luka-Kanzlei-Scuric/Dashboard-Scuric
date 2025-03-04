const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        mongoose.set('strictQuery', false);

        const MONGODB_URI = process.env.MONGODB_URI;
        if (!MONGODB_URI) {
            console.warn('⚠️ MongoDB URI ist nicht in den Umgebungsvariablen definiert');
            console.warn('⚠️ Der Server wird ohne Datenbankverbindung gestartet');
            console.warn('⚠️ Bitte fügen Sie eine gültige MONGODB_URI in der .env-Datei hinzu');
            return false; // Verbindung nicht hergestellt
        }

        if (MONGODB_URI.includes('your-mongodb-connection-string')) {
            console.warn('⚠️ Die MONGODB_URI enthält den Platzhalter "your-mongodb-connection-string"');
            console.warn('⚠️ Der Server wird ohne Datenbankverbindung gestartet');
            console.warn('⚠️ Bitte ersetzen Sie den Platzhalter durch eine gültige MongoDB-URI');
            return false; // Verbindung nicht hergestellt
        }

        const conn = await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000 // Falls die Verbindung nicht klappt, nicht ewig warten
        });

        console.log(`✅ MongoDB verbunden: ${conn.connection.host}`);
        return true; // Verbindung erfolgreich hergestellt
    } catch (error) {
        console.error(`❌ MongoDB Verbindungsfehler: ${error.message}`);

        if (process.env.NODE_ENV === 'development') {
            console.error(error);
        }

        console.warn('⚠️ Der Server wird ohne Datenbankverbindung gestartet');
        console.warn('⚠️ Einige Funktionen werden möglicherweise nicht wie erwartet funktionieren');
        
        return false; // Verbindung nicht hergestellt
    }
};

module.exports = connectDB;