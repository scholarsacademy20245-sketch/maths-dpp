const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve all static files (index.html, css, js, images, etc.) from this folder
app.use(express.static(__dirname));

// For any route, send index.html (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Self-ping every 10 minutes to keep the free instance awake
const SELF_URL = process.env.SELF_URL || 'https://maths-dpp.onrender.com';
setInterval(() => {
  fetch(SELF_URL)
    .then(() => console.log(`Self-ping sent to ${SELF_URL} at ${new Date().toISOString()}`))
    .catch(err => console.log('Self-ping failed:', err.message));
}, 10 * 60 * 1000); // 10 minutes
