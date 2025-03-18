# Make.com Integration Guide f�r Scuric Dashboard

Diese Anleitung erkl�rt, wie die Integration zwischen ClickUp, Make.com und dem Scuric Dashboard funktioniert und wie sie konfiguriert wird.

## �berblick

Die Integration erm�glicht es, Aufgaben (Tasks) von ClickUp automatisch ins Dashboard zu importieren:

1. Make.com �berwacht ClickUp auf neue oder aktualisierte Aufgaben
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

4. Der Backend-Endpunkt, der die Daten von Make.com empf�ngt, ist:
```
/api/clickup/make-webhook
```

## Make.com Szenario einrichten

1. **Erstelle ein neues Szenario in Make.com**

2. **F�ge den ClickUp-Trigger hinzu**:
   - W�hle ClickUp als App
   - W�hle "Watch Tasks" oder "Watch Events" als Trigger
   - Authentifiziere dich mit deinem ClickUp-Konto
   - W�hle den relevanten Workspace und die Liste aus, die du �berwachen m�chtest
   - Konfiguriere, welche Ereignisse �berwacht werden sollen (Aufgaben erstellen, aktualisieren, etc.)

3. **F�ge einen HTTP-Request hinzu**:
   - W�hle "HTTP" als App
   - W�hle "Make a request" als Aktion
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
   - �berpr�fe die Logs im Backend und in Make.com

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
      "name": "Gl�ubiger Anzahl",
      "value": "3"
    }
  ]
}
```

Das Backend transformiert diese Daten ins interne Format und speichert sie als Formular/Mandant.

## Fehlerbehebung

### Kein Datenempfang im Backend

1. �berpr�fe die Make.com-Ausf�hrungsprotokolle
2. Stelle sicher, dass die richtige URL f�r den Webhook konfiguriert ist
3. �berpr�fe die Backend-Logs auf Fehler

### Make.com Fehler

1. Stelle sicher, dass dein ClickUp-API-Token g�ltig ist
2. �berpr�fe die Berechtigungen f�r die ClickUp-Liste
3. Validiere das JSON-Format der gesendeten Daten

## Erweiterungen

Nach der Grundkonfiguration k�nnen folgende Erweiterungen hinzugef�gt werden:

1. **Bidirektionale Synchronisierung**: �nderungen im Dashboard zur�ck zu ClickUp senden
2. **Statusaktualisierungen**: Dashboard-Status mit ClickUp-Status synchronisieren
3. **Dokumentenintegration**: Dokumente aus ClickUp ins Dashboard importieren

## Support

Bei Fragen oder Problemen wende dich an den Entwickler des Scuric Dashboards.