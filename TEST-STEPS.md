# Dashboard Testing Guide

I've modified your code to be testable without any database connection, using mock data. Follow these steps to test the dashboard:

## 1. Start Backend Server

```bash
cd backend
node server.js
```

You should see the server start message showing it's running on port 5001.

## 2. Start Frontend Development Server

Open a new terminal window and run:

```bash
npm run dev
```

This will start Vite's development server, typically on port 3000.

## 3. Access the Dashboard

Open your browser and navigate to:
```
http://localhost:3000/dashboard
```

## What to Expect

- You should see a list of mock clients in the dashboard
- You can click on a client to see the Erstberatung form with mock data
- You can navigate between the different phases (Erstberatung, Checkliste, Dokumente)
- All functionality should work with mock data

## Testing Specific Features

### Client List
- Test filtering clients by using the search box
- Test the phase navigation to see clients in different phases

### Checkliste Phase
- Test checking/unchecking items on the checklist
- Note that saving won't actually persist data (using mock data)

### Dokumente Phase
- Test uploading a document (mock functionality)
- Test the different tabs to see personal data and templates
- Test the document search functionality

## Troubleshooting

If you see the error "Fehler beim Laden der Mandanten", make sure:
1. Your backend server is running on port 5001
2. The .env file in the frontend directory has `VITE_BACKEND_URL=http://localhost:5001`
3. Try clearing your browser cache

All components have been modified to use mock data if the API fails, so you should be able to test the entire dashboard functionality even without a working database connection.