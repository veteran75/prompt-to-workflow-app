import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
You are an enterprise workflow architect.

Return ONLY valid JSON with this exact structure:
{
  "title": "string",
  "summary": "string",
  "tools": ["string"],
  "risks": ["string"],
  "metrics": ["string"],
  "steps": [
    {
      "id": 1,
      "name": "string",
      "owner": "string",
      "type": "manual | decision | automation | insight",
      "description": "string"
    }
  ]
}

Rules:
- Keep steps between 4 and 8
- Make the workflow practical and business-ready
- Use enterprise-friendly tool suggestions when relevant
- "type" must only be one of: manual, decision, automation, insight
- Return JSON only, no markdown, no commentary
          `.trim(),
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = response.choices[0].message.content;
    const workflow = JSON.parse(content);

    if (!workflow.title || !Array.isArray(workflow.steps)) {
      return res.status(500).json({
        error: "Invalid workflow response from AI",
      });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Server error:", error);

    res.status(500).json({
      error: "Failed to generate workflow",
    });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});