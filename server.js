import express from "express";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        maxOutputTokens: 8000,
      },
    });
    const text = response.candidates[0].content.parts[0].text;
    res.json({ text: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: { message: err.message || "Unknown error" } });
  }
});

app.listen(process.env.PORT || 3000);
