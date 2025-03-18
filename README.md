# Scuric Dashboard

Ein interaktives Dashboard zur Verwaltung von Privatinsolvenz-Klienten, mit Integration zu ClickUp über Make.com.

## Funktionen

- Verwaltung von Klienten in verschiedenen Phasen (Erstberatung, Checkliste, Dokumente)
- Integration mit ClickUp über Make.com
- Getrennte Dashboards für Verkaufsteam und Sachbearbeitungsteam
- Automatische Synchronisierung von Daten

## Technologien

- **Frontend**: React, React Router, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **Integration**: Make.com, ClickUp API
- **Deployment**: Backend auf Render.com, Frontend auf Vercel

## Setup

### Lokale Entwicklung

1. Repository klonen:
   ```
   git clone https://github.com/Luka-Kanzlei-Scuric/Dashboard-Scuric.git
   cd Dashboard-Scuric
   ```

2. Frontend starten:
   ```
   npm install
   npm run dev
   ```

3. Backend starten:
   ```
   cd backend
   npm install
   node server.js
   ```

### Umgebungsvariablen

#### Backend (.env):
```
MONGODB_URI=deine_mongodb_verbindung
CLICKUP_API_KEY=dein_clickup_api_key
PORT=5001
```

#### Frontend (.env.local):
```
VITE_API_URL=http://localhost:5001/api
```

## Make.com Integration

Die Integration mit ClickUp erfolgt über Make.com. 

### Setup

1. Kopiere die Beispiel-Umgebungsdatei:
   ```
   cp .env.make-example .env
   ```

2. Bearbeite die `.env`-Datei und aktualisiere folgende Werte:
   - `MAKE_WEBHOOK_URL`: Deine Make.com Webhook-URL
   - `MONGODB_URI`: Deine MongoDB-Verbindungszeichenfolge
   - `FRONTEND_URL`: URL deiner Frontend-Anwendung
   - `PORT`: Der Port für den Backend-Server

3. Make.com-Szenario einrichten:
   - Erstelle ein neues Szenario in Make.com
   - Füge ein ClickUp-Trigger-Modul hinzu (z.B. "Watch Tasks")
   - Konfiguriere den Trigger, um neue oder aktualisierte Tasks zu beobachten
   - Füge ein HTTP-Modul hinzu, um Daten an dein Backend zu senden:
     - URL: `https://deine-backend-url/api/clickup/make-webhook`
     - Methode: POST
     - Body: Mappe die ClickUp-Task-Daten vom Trigger

Diese Integration sendet ClickUp-Aufgabendaten an den `/api/clickup/make-webhook` Endpunkt.

## Deployment

- **Backend**: Hostet auf Render.com mit Node.js
- **Frontend**: Hostet auf Vercel mit automatischem Deployment

## Entwickelt von

Luka Scuric, Kanzlei Scuric

## Lizenz

Alle Rechte vorbehalten