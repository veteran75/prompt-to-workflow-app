import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const workflowSchema = {
  name: "workflow_output",
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
      steps: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            owner: { type: "string" },
            type: {
              type: "string",
              enum: [
                "start",
                "process",
                "system",
                "decision",
                "approval",
                "end",
              ],
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
          required: ["source", "target", "label"],
        },
      },
      automationOpportunities: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "title",
      "executiveSummary",
      "roles",
      "systems",
      "steps",
      "connections",
      "automationOpportunities",
    ],
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "Missing OPENAI_API_KEY",
      });
    }

    const { prompt } = req.body || {};

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const response = await client.responses.create({
      model: "gpt-5.4-mini",
      input: [
        {
          role: "developer",
          content: [
            {
              type: "text",
              text:
                "You generate enterprise workflow definitions for diagram rendering. " +
                "Return only valid JSON matching the provided schema. " +
                "Create practical workflows with 6-12 steps, clear owners, realistic systems, " +
                "and meaningful labeled connections.",
            },
          ],
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: String(prompt),
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: workflowSchema.name,
          schema: workflowSchema.schema,
          strict: true,
        },
      },
    });

    const jsonText = response.output_text;
    const data = JSON.parse(jsonText);

    return res.status(200).json(data);
  } catch (error) {
    console.error("OpenAI generate error:", error);

    return res.status(500).json({
      error: "Failed to generate workflow",
      details: error?.message || "Unknown error",
    });
  }
}