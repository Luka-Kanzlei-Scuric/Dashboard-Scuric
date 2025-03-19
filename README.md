# Scuric Privatinsolvenz Dashboard

Ein robustes Dashboard zur Verwaltung von Privatinsolvenz-Mandanten mit nahtloser Integration zu ClickUp über Make.com.

## Hauptfunktionen

- Verwaltung von Mandanten in verschiedenen Phasen (Erstberatung, Checkliste, Dokumente)
- Bidirektionale Synchronisierung mit ClickUp durch Make.com
- Getrennte Ansichten für Verkaufsteam und Sachbearbeitungsteam
- Automatische Datenaktualisierung und Statusverfolgung
- Fehlertolerante Backend-Architektur für hohe Verfügbarkeit

## Technologie-Stack

- **Frontend**: React 18, React Router v6, TailwindCSS, Vite
- **Backend**: Node.js, Express.js, MongoDB
- **Integration**: Make.com, ClickUp API
- **Deployment**: Backend auf Render.com, Frontend auf Vercel

## Schnellstart

### Lokale Entwicklung

1. Repository klonen:
   ```bash
   git clone https://github.com/Luka-Kanzlei-Scuric/Dashboard-Scuric.git
   cd Dashboard-Scuric
   ```

2. Umgebungsvariablen einrichten:
   ```bash
   # Kopieren der Beispieldatei
   cp .env.example .env
   # Anpassen der Werte in .env
   ```

3. Frontend starten:
   ```bash
   npm install
   npm run dev
   ```

4. Backend starten:
   ```bash
   cd backend
   npm install
   npm run dev  # Verwendet nodemon für automatisches Neuladen
   ```

## Server-Setup (Produktionsumgebung)

### Voraussetzungen

- Node.js 16+ installiert
- MongoDB-Instanz (Atlas oder selbst gehostet)
- Make.com-Konto für ClickUp-Integration

### Installation

1. Klonen Sie das Repository auf Ihren Server:
   ```bash
   git clone https://github.com/Luka-Kanzlei-Scuric/Dashboard-Scuric.git
   cd Dashboard-Scuric
   ```

2. Backend-Abhängigkeiten installieren:
   ```bash
   cd backend
   npm install --production
   ```

3. Umgebungsvariablen konfigurieren:
   ```bash
   cp .env.example .env
   # Bearbeiten Sie die .env-Datei mit Ihren tatsächlichen Werten
   ```

4. Dauerhafte Prozessführung mit PM2 (empfohlen):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "privatinsolvenz-api"
   pm2 save
   pm2 startup
   ```

### Verfügbare Webhooks

Das Backend bietet mehrere redundante Webhooks für Make.com-Integration:

1. **Primärer Webhook**: `/api/clickup-data`
   - Optimiert für Fehlertoleranz
   - Erfordert nur minimale Felder: `id` und `name`

2. **Alternativer Webhook**: `/api/make-webhook`
   - Hochgradig vereinfacht für maximale Zuverlässigkeit
   - Erfordert nur: `id` oder `taskId` und `name` oder `title`

3. **Legacy-Webhook**: `/api/clickup/make-webhook`
   - Für bestehende Integrationen

### Make.com Konfiguration

1. Erstellen Sie ein Szenario in Make.com
2. Nutzen Sie das ClickUp-Modul als Trigger
3. Konfigurieren Sie das HTTP-Modul zur Datenübertragung an Ihr Backend
   ```
   URL: https://ihre-backend-domain.com/api/clickup-data
   Methode: POST
   Körper (JSON): Die Task-Daten aus dem ClickUp-Trigger
   ```

4. Beispiel für Datenstruktur:
   ```json
   {
     "id": "task-12345",
     "name": "Max Mustermann",
     "status": {
       "status": "NEUE ANFRAGE"
     },
     "custom_fields": [
       {
         "name": "Email",
         "value": "max@beispiel.de"
       },
       {
         "name": "Telefonnummer",
         "value": "0123456789"
       }
     ]
   }
   ```

## Robustheit und Fehlertoleranz

Das Backend wurde optimiert für:

- **Automatische Wiederverbindung** zu MongoDB bei Verbindungsabbrüchen
- **Graceful Shutdown** mit sauberer Ressourcenfreigabe
- **Unbehandelte Fehlererkennung** ohne Serverabsturz
- **Multiple redundante Webhook-Endpunkte** für Make.com-Integration
- **Memory-Leak-Überwachung** für lange Laufzeiten

## Entwickelt von

Luka Scuric, Kanzlei Scuric

## Lizenz

© 2024 Scuric Privatinsolvenz - Alle Rechte vorbehalten