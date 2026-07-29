const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

app.use(express.json({ limit: '2mb' }));

// Allow cross-origin requests (e.g. from GitHub Pages) to hit /generate
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Serve all static files (index.html, css, js, images, etc.) from this folder
app.use(express.static(__dirname));

// AI DPP generator endpoint (now using Groq instead of Gemini)
app.post('/generate', async (req, res) => {
  try {
    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: { message: 'GROQ_API_KEY set nahi hai server pe.' } });
    }
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: { message: 'Prompt missing hai.' } });
    }

    const groqRes = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: 'user', content: prompt }]
        })
      }
    );

    const groqData = await groqRes.json();

    if (groqData.error) {
      return res.status(500).json({ error: { message: groqData.error.message || 'Groq API error' } });
    }

    const text = groqData?.choices?.[0]?.message?.content;
    if (!text) {
      return res.status(500).json({ error: { message: 'Groq se koi response nahi mila.' } });
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
