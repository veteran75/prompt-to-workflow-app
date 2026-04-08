import { useMemo, useRef, useState } from "react";
import dagre from "dagre";
import { toPng } from "html-to-image";
import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  Position,
} from "@xyflow/react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 110;

const examplePrompts = [
  {
    label: "Incident Response",
    text: "Create an enterprise incident response workflow with severity levels, escalation paths, stakeholder communication, and resolution tracking.",
  },
  {
    label: "Employee Onboarding",
    text: "Create a new employee onboarding workflow involving HR, IT, and hiring managers with account provisioning, equipment setup, approvals, and training steps.",
  },
  {
    label: "Tool Rationalization",
    text: "Create a workforce technology rationalization workflow to reduce tool sprawl, including inventory, usage analysis, retain-vs-retire decisions, migration planning, and governance.",
  },
  {
    label: "Help Desk",
    text: "Create a help desk ticket workflow including submission, triage, escalation, resolution, user validation, and closure.",
  },
];

function getNodeStyle(type) {
  const base = {
    width: NODE_WIDTH,
    padding: 12,
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    textAlign: "center",
    fontSize: 14,
    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
  };

  if (type === "start") {
    return {
      ...base,
      background: "#dcfce7",
      border: "2px solid #22c55e",
      fontWeight: 700,
    };
  }

  if (type === "end") {
    return {
      ...base,
      background: "#fee2e2",
      border: "2px solid #ef4444",
      fontWeight: 700,
    };
  }

  if (type === "approval") {
    return {
      ...base,
      background: "#fff7ed",
      border: "2px solid #f59e0b",
    };
  }

  if (type === "system") {
    return {
      ...base,
      background: "#eff6ff",
      border: "2px solid #60a5fa",
    };
  }

  if (type === "decision") {
    return {
      ...base,
      background: "#f5f3ff",
      border: "2px solid #7c3aed",
      boxShadow: "0 0 0 2px rgba(124,58,237,0.2)",
    };
  }

  return {
    ...base,
    background: "#f8fafc",
    border: "1px solid #cbd5e1",
  };
}

function getEdgeColor(label = "") {
  const text = label.toLowerCase();

  if (
    text.includes("reject") ||
    text.includes("rejected") ||
    text.includes("decline")
  ) {
    return "#ef4444";
  }

  if (
    text.includes("approve") ||
    text.includes("approved") ||
    text.includes("complete") ||
    text.includes("begin")
  ) {
    return "#22c55e";
  }

  if (
    text.includes("high") ||
    text.includes("escalate") ||
    text.includes("critical")
  ) {
    return "#f59e0b";
  }

  return "#475569";
}

function buildLayoutedFlow(workflow) {
  if (!workflow?.steps || !workflow?.connections) {
    return { nodes: [], edges: [] };
  }

  const stepsWithAnchors = [
    {
      id: "START",
      label: "Incident Detected",
      owner: "Monitoring System",
      type: "start",
    },
    ...workflow.steps,
    {
      id: "END",
      label: "Incident Closed",
      owner: "IT Operations",
      type: "end",
    },
  ];

  const enhancedConnections = [
    {
      source: "START",
      target: workflow.steps[0]?.id,
      label: "Trigger Incident",
    },
    ...workflow.connections,
    {
      source: workflow.steps[workflow.steps.length - 1]?.id,
      target: "END",
      label: "Close Incident",
    },
  ].filter((c) => c.source && c.target);

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: "LR",
    ranksep: 260,
    nodesep: 160,
    marginx: 120,
    marginy: 120,
    acyclicer: "greedy",
    ranker: "network-simplex",
  });

  stepsWithAnchors.forEach((step) => {
    dagreGraph.setNode(step.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  });

  enhancedConnections.forEach((connection) => {
    dagreGraph.setEdge(connection.source, connection.target);
  });

  dagre.layout(dagreGraph);

  const nodes = stepsWithAnchors.map((step) => {
    const nodeWithPosition = dagreGraph.node(step.id);

    return {
      id: step.id,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
      data: {
        label: (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{step.label}</div>

            {step.owner ? (
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 4 }}>
                Owner: {step.owner}
              </div>
            ) : null}

            <div
              style={{
                fontSize: 12,
                color: "#64748b",
                textTransform: "capitalize",
              }}
            >
              {step.type}
            </div>
          </div>
        ),
      },
      style: getNodeStyle(step.type),
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
  });

  const edges = enhancedConnections
    .filter((connection) => connection.source !== connection.target)
    .map((connection, index) => {
      const text = connection.label?.toLowerCase() || "";
      const isLoopLike =
        text.includes("parallel") ||
        text.includes("trigger") ||
        text.includes("feedback") ||
        text.includes("rework");

      const isPrimary =
        text.includes("plan") ||
        text.includes("standard") ||
        text.includes("resolve") ||
        text.includes("mitigate");

      return {
        id: `e-${index}`,
        source: connection.source,
        target: connection.target,
        label: connection.label,
        type: isLoopLike ? "smoothstep" : "step",
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        style: {
          strokeWidth: isPrimary ? 3 : 2,
          stroke: getEdgeColor(connection.label),
        },
        labelStyle: {
          fontSize: 12,
          fontWeight: 600,
          fill: "#111827",
        },
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 0.95,
        },
      };
    });

  return { nodes, edges };
}

function Card({ title, children, style = {} }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 20,
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        ...style,
      }}
    >
      {title ? <h2 style={{ marginTop: 0, marginBottom: 14 }}>{title}</h2> : null}
      {children}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRadius: 999,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        fontSize: 13,
      }}
    >
      <strong>{label}:</strong> {value}
    </div>
  );
}

function slugify(text = "workflow-diagram") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [exporting, setExporting] = useState(false);

  const diagramRef = useRef(null);

  const { nodes, edges } = useMemo(() => buildLayoutedFlow(result), [result]);

  const handleExampleClick = (text) => {
    setPrompt(text);
  };

  const generateWorkflow = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResult(null);
    setShowJson(false);

    try {
      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const rawText = await res.text();

      if (!res.ok) {
        throw new Error(`API error ${res.status}: ${rawText}`);
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server did not return JSON: ${rawText}`);
      }

      if (!data.steps || !Array.isArray(data.steps)) {
        throw new Error("Invalid workflow format: missing steps array.");
      }

      if (!data.connections || !Array.isArray(data.connections)) {
        throw new Error("Invalid workflow format: missing connections array.");
      }

      setResult(data);
    } catch (err) {
      console.error("Generate failed:", err);
      setResult({
        error: "Failed to generate workflow",
        details: err?.message || "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportDiagramToPng = async () => {
    if (!diagramRef.current) return;

    try {
      setExporting(true);

      const dataUrl = await toPng(diagramRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.download = `${slugify(result?.title || "workflow-diagram")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("PNG export failed:", error);
      alert("Failed to export diagram to PNG.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div
      style={{
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>
        <Card>
          <h1 style={{ marginTop: 0, marginBottom: 8 }}>AI Workflow Generator</h1>
          <p style={{ marginTop: 0, marginBottom: 16, color: "#4b5563" }}>
            Turn business prompts into executive-ready workflow diagrams.
          </p>

          <label
            htmlFor="workflowPrompt"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Workflow Prompt
          </label>

          <textarea
            id="workflowPrompt"
            name="workflowPrompt"
            rows="5"
            style={{
              width: "100%",
              padding: 14,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              marginBottom: 14,
              resize: "vertical",
              fontSize: 14,
            }}
            placeholder="Create a workforce technology rationalization workflow for a large organization with a clear start and end state."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 8 }}>
            Try an example:
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 14,
            }}
          >
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example.text)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {example.label}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={generateWorkflow}
              disabled={loading || !prompt.trim()}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: "none",
                cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                fontWeight: 700,
                background: "#111827",
                color: "#ffffff",
              }}
            >
              {loading ? "Generating..." : "Generate Workflow"}
            </button>

            <span style={{ color: "#6b7280", fontSize: 14 }}>
              Try: onboarding, incident response, help desk, or tool rationalization
            </span>
          </div>
        </Card>

        {loading ? (
          <div
            style={{
              marginTop: 18,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              borderRadius: 12,
              padding: 14,
            }}
          >
            Generating AI workflow...
          </div>
        ) : null}

        {result?.error ? (
          <div
            style={{
              marginTop: 18,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: 12,
              padding: 14,
            }}
          >
            <strong>{result.error}</strong>
            {result.details ? `: ${result.details}` : ""}
          </div>
        ) : null}

        {result && !result.error ? (
          <>
            <div style={{ marginTop: 18 }}>
              <Card title={result.title}>
                <p>
                  <strong>Business Challenge:</strong>{" "}
                  {result.executiveSummary?.businessChallenge}
                </p>
                <p>
                  <strong>Recommended Solution:</strong>{" "}
                  {result.executiveSummary?.recommendedSolution}
                </p>
                <p>
                  <strong>Expected Outcome:</strong>{" "}
                  {result.executiveSummary?.expectedOutcome}
                </p>
                <p style={{ marginBottom: 0 }}>
                  <strong>Strategic Value:</strong>{" "}
                  {result.executiveSummary?.strategicValue}
                </p>

                <div
                  style={{
                    marginTop: 16,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <StatPill label="Roles" value={result.roles?.length || 0} />
                  <StatPill label="Systems" value={result.systems?.length || 0} />
                  <StatPill label="Steps" value={result.steps?.length || 0} />
                  <StatPill
                    label="Connections"
                    value={result.connections?.length || 0}
                  />
                </div>
              </Card>
            </div>

            <div style={{ marginTop: 18 }}>
              <Card title="Workflow Diagram">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ color: "#64748b", fontSize: 14 }}>
                    Export the rendered workflow as a PNG for presentations or sharing.
                  </div>

                  <button
                    onClick={exportDiagramToPng}
                    disabled={exporting}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: "1px solid #d1d5db",
                      background: "#f9fafb",
                      cursor: exporting ? "not-allowed" : "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {exporting ? "Exporting..." : "Export Diagram to PNG"}
                  </button>
                </div>

                <div
                  ref={diagramRef}
                  style={{
                    height: 760,
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    overflow: "hidden",
                    background: "#ffffff",
                  }}
                >
                  <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    fitView
                    fitViewOptions={{ padding: 0.1 }}
                    attributionPosition="bottom-left"
                  >
                    <Background />
                    <Controls />
                  </ReactFlow>
                </div>
              </Card>
            </div>

            <div style={{ marginTop: 18 }}>
              <Card title="Workflow Metadata">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                  }}
                >
                  <div>
                    <h3 style={{ marginTop: 0 }}>Systems</h3>
                    <ul style={{ marginBottom: 0 }}>
                      {result.systems?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ marginTop: 0 }}>Automation Opportunities</h3>
                    <ul style={{ marginBottom: 0 }}>
                      {result.automationOpportunities?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ marginTop: 18 }}>
              <Card>
                <button
                  onClick={() => setShowJson((prev) => !prev)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #d1d5db",
                    background: "#f9fafb",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {showJson ? "Hide Technical Output" : "Show Technical Output"}
                </button>

                {showJson ? (
                  <pre
                    style={{
                      marginTop: 16,
                      background: "#f8fafc",
                      padding: 16,
                      borderRadius: 12,
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                      fontSize: 13,
                    }}
                  >
                    {JSON.stringify(result, null, 2)}
                  </pre>
                ) : null}
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}