export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt } = req.body || {};

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const promptText = String(prompt).trim();

    return res.status(200).json({
      title: `Workflow for: ${promptText}`,
      executiveSummary: {
        businessChallenge: `The organization needs a defined process for: ${promptText}.`,
        recommendedSolution: `Create a structured workflow for ${promptText} with clear ownership, systems, and decision points.`,
        expectedOutcome: "Improved consistency, visibility, and execution.",
        strategicValue: "Better governance, faster delivery, and clearer accountability."
      },
      roles: ["Requester", "Service Desk", "IT Operations", "Management"],
      systems: ["Microsoft Teams", "Ticketing System", "Email"],
      steps: [
        { id: "1", label: "Request Submitted", owner: "Requester", type: "start" },
        { id: "2", label: "Create Record", owner: "Ticketing System", type: "system" },
        { id: "3", label: "Initial Review", owner: "Service Desk", type: "process" },
        { id: "4", label: "Decision / Approval", owner: "Management", type: "decision" },
        { id: "5", label: "Execute Workflow", owner: "IT Operations", type: "process" },
        { id: "6", label: "Validate Outcome", owner: "Service Desk", type: "approval" }
      ],
      connections: [
        { source: "1", target: "2", label: "Submit" },
        { source: "2", target: "3", label: "Log" },
        { source: "3", target: "4", label: "Review" },
        { source: "4", target: "5", label: "Approved" },
        { source: "5", target: "6", label: "Complete" }
      ],
      automationOpportunities: [
        `Auto-create workflow records for ${promptText}`,
        "Automated notifications",
        "Status tracking and reporting"
      ]
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      details: error.message
    });
  }
}