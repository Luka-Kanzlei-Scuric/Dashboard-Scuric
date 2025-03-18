# Make.com Integration Guide für Scuric Dashboard

Diese Anleitung erklärt, wie die Integration zwischen ClickUp, Make.com und dem Scuric Dashboard funktioniert und wie sie konfiguriert wird.

## Überblick

Die Integration ermöglicht es, Aufgaben (Tasks) von ClickUp automatisch ins Dashboard zu importieren:

1. Make.com überwacht ClickUp auf neue oder aktualisierte Aufgaben
2. Wenn eine Aufgabe erstellt oder aktualisiert wird, sendet Make.com die Daten an das Dashboard-Backend
3. Das Backend verarbeitet die Daten und speichert sie in der Datenbank
4. Die Aufgabe erscheint als neuer Mandant im Dashboard

## Voraussetzungen

- ClickUp-Konto mit Admin-Zugriff
- Make.com-Konto
- Laufendes Scuric Dashboard mit Backend

## Backend-Konfiguration

1. Kopiere die Beispiel-Umgebungsdatei:
```
cp .env.make-example .env
```

2. Bearbeite die `.env`-Datei und aktualisiere die folgenden Variablen:
```
INTEGRATION_TYPE=make
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/deine-webhook-id
MONGODB_URI=deine-mongodb-uri
```

3. Starte den Backend-Server neu:
```
cd backend
npm run dev
```

4. Der Backend-Endpunkt, der die Daten von Make.com empfängt, ist:
```
/api/clickup/make-webhook
```

## Make.com Szenario einrichten

1. **Erstelle ein neues Szenario in Make.com**

2. **Füge den ClickUp-Trigger hinzu**:
   - Wähle ClickUp als App
   - Wähle "Watch Tasks" oder "Watch Events" als Trigger
   - Authentifiziere dich mit deinem ClickUp-Konto
   - Wähle den relevanten Workspace und die Liste aus, die du überwachen möchtest
   - Konfiguriere, welche Ereignisse überwacht werden sollen (Aufgaben erstellen, aktualisieren, etc.)

3. **Füge einen HTTP-Request hinzu**:
   - Wähle "HTTP" als App
   - Wähle "Make a request" als Aktion
   - Konfiguriere den Request:
     - URL: `https://deine-backend-url/api/clickup/make-webhook`
     - Methode: POST
     - Headers: 
       ```
       Content-Type: application/json
       ```
     - Body: Mappe hier die ClickUp-Task-Daten vom Trigger. Wichtige Felder sind:
       - id (Task-ID)
       - name (Aufgabentitel)
       - status
       - custom_fields (benutzerdefinierte Felder)
       - date_created
       - date_updated

4. **Teste das Szenario**:
   - Klicke auf "Run once" in Make.com
   - Erstelle oder aktualisiere eine Aufgabe in ClickUp
   - Überprüfe die Logs im Backend und in Make.com

## Datenstruktur

Das Backend erwartet mindestens die folgenden Felder von ClickUp:

```json
{
  "id": "task123456",
  "name": "Mandant Name",
  "status": {
    "status": "NEUE ANFRAGE"
  },
  "date_created": "1629384567890",
  "date_updated": "1629384567890",
  "custom_fields": [
    {
      "name": "Gesamtschulden",
      "value": "15000"
    },
    {
      "name": "Gläubiger Anzahl",
      "value": "3"
    }
  ]
}
```

Das Backend transformiert diese Daten ins interne Format und speichert sie als Formular/Mandant.

## Fehlerbehebung

### Kein Datenempfang im Backend

1. Überprüfe die Make.com-Ausführungsprotokolle
2. Stelle sicher, dass die richtige URL für den Webhook konfiguriert ist
3. Überprüfe die Backend-Logs auf Fehler

### Make.com Fehler

1. Stelle sicher, dass dein ClickUp-API-Token gültig ist
2. Überprüfe die Berechtigungen für die ClickUp-Liste
3. Validiere das JSON-Format der gesendeten Daten

## Erweiterungen

Nach der Grundkonfiguration können folgende Erweiterungen hinzugefügt werden:

1. **Bidirektionale Synchronisierung**: Änderungen im Dashboard zurück zu ClickUp senden
2. **Statusaktualisierungen**: Dashboard-Status mit ClickUp-Status synchronisieren
3. **Dokumentenintegration**: Dokumente aus ClickUp ins Dashboard importieren

## Support

Bei Fragen oder Problemen wende dich an den Entwickler des Scuric Dashboards.