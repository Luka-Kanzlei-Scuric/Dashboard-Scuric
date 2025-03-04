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

Die Integration mit ClickUp erfolgt über Make.com. Das Szenario ruft Tasks aus ClickUp ab und sendet sie an den `/api/make/clickup-sync` Endpunkt.

## Deployment

- **Backend**: Hostet auf Render.com mit Node.js
- **Frontend**: Hostet auf Vercel mit automatischem Deployment

## Entwickelt von

Luka Scuric, Kanzlei Scuric

## Lizenz

Alle Rechte vorbehalten