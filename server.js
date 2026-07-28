const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

app.use(express.json({ limit: '2mb' }));

// Serve all static files (index.html, css, js, images, etc.) from this folder
app.use(express.static(__dirname));

// AI DPP generator endpoint (replaces old Railway backend)
app.post('/generate', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: { message: 'GEMINI_API_KEY set nahi hai server pe.' } });
    }
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: { message: 'Prompt missing hai.' } });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const geminiData = await geminiRes.json();

    if (geminiData.error) {
      return res.status(500).json({ error: { message: geminiData.error.message || 'Gemini API error' } });
    }

    const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(500).json({ error: { message: 'Gemini se koi response nahi mila.' } });
    }

    res.json({ text });
  } catch (err) {
    console.error('Generate error:', err);
    res.status(500).json({ error: { message: err.message } });
  }
});

// For any GET route, send index.html (SPA behavior)
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
