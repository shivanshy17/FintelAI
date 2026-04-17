const express = require('express');
const axios = require('axios');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from current directory
app.use(express.static(path.join(__dirname, '.')));

// Add CSP header to allow localhost connections
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self' https:; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://www.gstatic.com; connect-src 'self' http://localhost:3000 https: wss:; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:;");
  next();
});

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' || GEMINI_API_KEY.startsWith('AQ.')) {
  console.error("❌ Error: GEMINI_API_KEY not set or invalid in .env file");
  console.log("Please get your API key from: https://aistudio.google.com/app/apikey");
  console.log("And update the GEMINI_API_KEY in .env");
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_ACTUAL_GEMINI_API_KEY_HERE' || GEMINI_API_KEY.startsWith('AQ.')) {
      return res.status(500).json({ error: "Gemini API key not configured. Please update GEMINI_API_KEY in .env file." });
    }

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a friendly financial advisor chatbot. Answer questions about personal finance, investments, saving, budgeting, mutual funds, taxes, and similar topics. Keep your response concise (2-3 sentences max). User question: "${message}"`
          }]
        }]
      }
    );

    const botReply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate response";
    res.json({ reply: botReply });
  } catch (error) {
    console.error("Gemini API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to get response from Gemini API. Please try again." });
  }
});

// Alpha Vantage API endpoints
app.get('/api/stock/search', async (req, res) => {
  try {
    const { keywords } = req.query;
    if (!keywords) {
      return res.status(400).json({ error: "Keywords parameter required" });
    }

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: keywords,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Alpha Vantage Search Error:", error.message);
    res.status(500).json({ error: "Failed to search stocks" });
  }
});

app.get('/api/stock/quote', async (req, res) => {
  try {
    const { symbol } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: "Symbol parameter required" });
    }

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Alpha Vantage Quote Error:", error.message);
    res.status(500).json({ error: "Failed to get stock quote" });
  }
});

app.get('/api/stock/history', async (req, res) => {
  try {
    const { symbol, interval = 'daily' } = req.query;
    if (!symbol) {
      return res.status(400).json({ error: "Symbol parameter required" });
    }

    const functionName = interval === 'intraday' ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
    const params = {
      function: functionName,
      symbol: symbol.toUpperCase(),
      apikey: ALPHA_VANTAGE_API_KEY
    };

    if (interval === 'intraday') {
      params.interval = '5min';
    }

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, { params });
    res.json(response.data);
  } catch (error) {
    console.error("Alpha Vantage History Error:", error.message);
    res.status(500).json({ error: "Failed to get stock history" });
  }
});

app.get('/api/market/news', async (req, res) => {
  try {
    const { topics = 'financial_markets' } = req.query;

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'NEWS_SENTIMENT',
        topics: topics,
        apikey: ALPHA_VANTAGE_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error("Alpha Vantage News Error:", error.message);
    res.status(500).json({ error: "Failed to get market news" });
  }
});

// Serve app.html as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`Chat endpoint: POST http://localhost:${PORT}/api/chat`);
  console.log(`Stock endpoints: GET http://localhost:${PORT}/api/stock/*`);
});
