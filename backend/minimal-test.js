const express = require('express');
const app = express();

// Einfacher Endpunkt
app.get('/', (req, res) => {
  res.json({ message: 'Server läuft!' });
});

// Server starten
const PORT = 5003;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});