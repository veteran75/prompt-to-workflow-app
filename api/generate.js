import OpenAI from "openai";

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

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
      return res.status(400).json({
        error: "Prompt is required",
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: `Return valid JSON only for an enterprise workflow based on this prompt: ${prompt}`,
      text: {
        format: {
          type: "json_schema",
          name: "workflow_output",
          strict: true,
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
                  strategicValue: { type: "string" }
                },
                required: [
                  "businessChallenge",
                  "recommendedSolution",
                  "expectedOutcome",
                  "strategicValue"
                ]
              },
              roles: {
                type: "array",
                items: { type: "string" }
              },
              systems: {
                type: "array",
                items: { type: "string" }
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
                      enum: ["start", "process", "system", "decision", "approval", "end"]
                    }
                  },
                  required: ["id", "label", "owner", "type"]
                }
              },
              connections: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    source: { type: "string" },
                    target: { type: "string" },
                    label: { type: "string" }
                  },
                  required: ["source", "target", "label"]
                }
              },
              automationOpportunities: {
                type: "array",
                items: { type: "string" }
              }
            },
            required: [
              "title",
              "executiveSummary",
              "roles",
              "systems",
              "steps",
              "connections",
              "automationOpportunities"
            ]
          }
        }
      }
    });

    let data;
    try {
      data = JSON.parse(response.output_text);
    } catch {
      return res.status(500).json({
        error: "OpenAI returned non-JSON output",
        details: response.output_text || "Empty output",
      });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate workflow",
      details: error?.message || "Unknown server error",
    });
  }
}