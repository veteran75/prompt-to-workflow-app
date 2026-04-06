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

const workflowSchema = {
  name: "workflow_response",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      executiveSummary: {
        type: "object",
        additionalProperties: false,
        properties: {
          businessChallenge: { type: "string" },
          recommendedSolution: { type: "string" },
          expectedOutcome: { type: "string" },
          strategicValue: { type: "string" },
        },
        required: [
          "businessChallenge",
          "recommendedSolution",
          "expectedOutcome",
          "strategicValue",
        ],
      },
      roles: {
        type: "array",
        items: { type: "string" },
      },
      systems: {
        type: "array",
        items: { type: "string" },
      },
      automationOpportunities: {
        type: "array",
        items: { type: "string" },
      },
      risks: {
        type: "array",
        items: { type: "string" },
      },
      kpis: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            target: { type: "string" },
          },
          required: ["name", "target"],
        },
      },
      steps: {
        type: "array",
        minItems: 5,
        maxItems: 10,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            owner: { type: "string" },
            type: {
              type: "string",
              enum: ["process", "decision", "approval", "system"],
            },
          },
          required: ["id", "label", "owner", "type"],
        },
      },
      connections: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            source: { type: "string" },
            target: { type: "string" },
            label: { type: "string" },
          },
          required: ["source", "target"],
        },
      },
    },
    required: [
      "title",
      "executiveSummary",
      "roles",
      "systems",
      "automationOpportunities",
      "risks",
      "kpis",
      "steps",
      "connections",
    ],
  },
  strict: true,
};

function validateWorkflow(workflow) {
  if (!workflow || typeof workflow !== "object") return false;
  if (!workflow.title || typeof workflow.title !== "string") return false;
  if (!workflow.executiveSummary || typeof workflow.executiveSummary !== "object") return false;
  if (!Array.isArray(workflow.roles)) return false;
  if (!Array.isArray(workflow.systems)) return false;
  if (!Array.isArray(workflow.automationOpportunities)) return false;
  if (!Array.isArray(workflow.risks)) return false;
  if (!Array.isArray(workflow.kpis)) return false;
  if (!Array.isArray(workflow.steps)) return false;
  if (!Array.isArray(workflow.connections)) return false;
  return true;
}

app.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: {
        type: "json_schema",
        json_schema: workflowSchema,
      },
      messages: [
        {
          role: "system",
          content: `
You are an enterprise workflow architect.

Create a business-ready future-state workflow response.
Return only data that matches the provided JSON schema.

Rules:
- Make the workflow practical, executive-ready, and visually mappable
- Keep steps between 5 and 10
- Use realistic enterprise systems when relevant
- Connections should reference valid step ids
- Write concise but strong executive summary content
- KPIs should be measurable targets such as percentages, time savings, cycle-time reduction, adoption rate, or ticket reduction
          `.trim(),
        },
        {
          role: "user",
          content: prompt.trim(),
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({
        error: "No content returned from OpenAI",
      });
    }

    let workflow;
    try {
      workflow = JSON.parse(content);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, content);
      return res.status(500).json({
        error: "Model returned invalid JSON",
      });
    }

    if (!validateWorkflow(workflow)) {
      return res.status(500).json({
        error: "Invalid workflow response shape from AI",
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

app.listen(3001, () => {
  console.log("Server running on port 3001");
});