import { useMemo, useRef, useState } from "react";
import dagre from "dagre";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
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
    borderRadius: 16,
    border: "1px solid #d1d5db",
    background: "#ffffff",
    textAlign: "center",
    fontSize: 14,
    boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
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
      boxShadow: "0 0 0 2px rgba(124,58,237,0.16)",
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
      label: "Start",
      owner: "System",
      type: "start",
    },
    ...workflow.steps,
    {
      id: "END",
      label: "End",
      owner: "Process Owner",
      type: "end",
    },
  ];

  const enhancedConnections = [
    {
      source: "START",
      target: workflow.steps[0]?.id,
      label: "Begin",
    },
    ...workflow.connections,
    {
      source: workflow.steps[workflow.steps.length - 1]?.id,
      target: "END",
      label: "Complete",
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
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{step.label}</div>
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
          fontWeight: 700,
          fill: "#111827",
        },
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 0.96,
        },
      };
    });

  return { nodes, edges };
}

function Card({ title, children, style = {} }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.9)",
        border: "1px solid rgba(255,255,255,0.7)",
        borderRadius: 24,
        padding: 24,
        boxShadow:
          "0 10px 30px rgba(15, 23, 42, 0.08), 0 2px 10px rgba(15, 23, 42, 0.04)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        ...style,
      }}
    >
      {title ? (
        <h2
          style={{
            marginTop: 0,
            marginBottom: 16,
            fontSize: 24,
            lineHeight: 1.2,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

function StatPill({ label, value }) {
  return (
    <div
      style={{
        padding: "12px 16px",
        borderRadius: 18,
        background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        border: "1px solid #e2e8f0",
        minWidth: 110,
        boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ color: "#0f172a", fontWeight: 800, fontSize: 18 }}>
        {value}
      </div>
    </div>
  );
}

function SummaryBlock({ title, value }) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <strong style={{ display: "block", marginBottom: 6, color: "#0f172a" }}>
        {title}
      </strong>
      <span style={{ color: "#475569", lineHeight: 1.6 }}>{value}</span>
    </div>
  );
}

function slugify(text = "workflow-diagram") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const secondaryButtonStyle = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
  cursor: "pointer",
  fontWeight: 700,
  color: "#0f172a",
  boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
};

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

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
      setExportingPng(true);

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
      setExportingPng(false);
    }
  };

  const exportDiagramToPdf = async () => {
    if (!diagramRef.current || !result) return;

    try {
      setExportingPdf(true);

      const dataUrl = await toPng(diagramRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 24;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(result.title || "Workflow Diagram", margin, 24);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const summaryLines = pdf.splitTextToSize(
        result.executiveSummary?.recommendedSolution ||
          "AI-generated workflow diagram.",
        pageWidth - margin * 2
      );
      pdf.text(summaryLines, margin, 42);

      const img = new Image();
      img.src = dataUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - 110;
      const imgRatio = img.width / img.height;

      let imgWidth = availableWidth;
      let imgHeight = imgWidth / imgRatio;

      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = imgHeight * imgRatio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = 80;

      pdf.addImage(dataUrl, "PNG", x, y, imgWidth, imgHeight);
      pdf.save(`${slugify(result.title || "workflow-diagram")}.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export diagram to PDF.");
    } finally {
      setExportingPdf(false);
    }
  };

  const copyExecutiveSummary = async () => {
    if (!result?.executiveSummary) return;

    const summaryText = [
      `Title: ${result.title || "Workflow Summary"}`,
      "",
      `Business Challenge: ${result.executiveSummary.businessChallenge || ""}`,
      `Recommended Solution: ${
        result.executiveSummary.recommendedSolution || ""
      }`,
      `Expected Outcome: ${result.executiveSummary.expectedOutcome || ""}`,
      `Strategic Value: ${result.executiveSummary.strategicValue || ""}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summaryText);
      alert("Executive summary copied.");
    } catch (error) {
      console.error("Copy failed:", error);
      alert("Failed to copy executive summary.");
    }
  };

  return (
    <div
      style={{
        padding: 32,
        fontFamily: "Inter, Arial, sans-serif",
        background:
          "linear-gradient(180deg, #f8fafc 0%, #eef2ff 45%, #f8fafc 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1360, margin: "0 auto" }}>
        <Card>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 999,
                background: "#eef2ff",
                color: "#4338ca",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.02em",
                marginBottom: 14,
              }}
            >
              AI-Powered Workflow Design
            </div>

            <h1
              style={{
                marginTop: 0,
                marginBottom: 10,
                fontSize: 40,
                lineHeight: 1.05,
                color: "#0f172a",
                letterSpacing: "-0.03em",
              }}
            >
              Turn business prompts into executive-ready workflow diagrams
            </h1>

            <p
              style={{
                marginTop: 0,
                marginBottom: 0,
                color: "#475569",
                fontSize: 16,
                lineHeight: 1.6,
                maxWidth: 860,
              }}
            >
              Generate structured workflows, visualize process flows, and export
              polished outputs for presentations, stakeholder reviews, and
              executive communication.
            </p>
          </div>

          <label
            htmlFor="workflowPrompt"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: 10,
              color: "#0f172a",
              fontSize: 14,
              letterSpacing: "0.01em",
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
              padding: 16,
              borderRadius: 16,
              border: "1px solid #cbd5e1",
              marginBottom: 14,
              resize: "vertical",
              fontSize: 15,
              lineHeight: 1.5,
              background: "#ffffff",
              boxShadow: "inset 0 1px 2px rgba(15,23,42,0.04)",
              outline: "none",
            }}
            placeholder="Create a workforce technology rationalization workflow for a large organization with a clear start and end state."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <p
            style={{
              fontWeight: 700,
              marginTop: 0,
              marginBottom: 10,
              color: "#0f172a",
              fontSize: 14,
            }}
          >
            Try an example
          </p>

          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example.text)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: "1px solid #dbeafe",
                  background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#1e293b",
                  boxShadow: "0 1px 2px rgba(15,23,42,0.05)",
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
                padding: "12px 18px",
                borderRadius: 14,
                border: "none",
                cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
                fontWeight: 800,
                fontSize: 14,
                background: "linear-gradient(135deg, #111827 0%, #312e81 100%)",
                color: "#ffffff",
                boxShadow: "0 10px 20px rgba(49, 46, 129, 0.20)",
              }}
            >
              {loading ? "Generating..." : "Generate Workflow"}
            </button>

            <span style={{ color: "#64748b", fontSize: 14 }}>
              Best results: onboarding, incident response, help desk, or tool
              rationalization
            </span>
          </div>
        </Card>

        {loading ? (
          <div
            style={{
              marginTop: 24,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              borderRadius: 16,
              padding: 16,
              fontWeight: 600,
            }}
          >
            Generating AI workflow...
          </div>
        ) : null}

        {result?.error ? (
          <div
            style={{
              marginTop: 24,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <strong>{result.error}</strong>
            {result.details ? `: ${result.details}` : ""}
          </div>
        ) : null}

        {result && !result.error ? (
          <>
            <div style={{ marginTop: 24 }}>
              <Card title={result.title}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginBottom: 16,
                  }}
                >
                  <button
                    onClick={copyExecutiveSummary}
                    style={secondaryButtonStyle}
                  >
                    Copy Executive Summary
                  </button>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginTop: 8,
                  }}
                >
                  <SummaryBlock
                    title="Business Challenge"
                    value={result.executiveSummary?.businessChallenge}
                  />
                  <SummaryBlock
                    title="Recommended Solution"
                    value={result.executiveSummary?.recommendedSolution}
                  />
                  <SummaryBlock
                    title="Expected Outcome"
                    value={result.executiveSummary?.expectedOutcome}
                  />
                  <SummaryBlock
                    title="Strategic Value"
                    value={result.executiveSummary?.strategicValue}
                  />
                </div>

                <div
                  style={{
                    marginTop: 18,
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

            <div style={{ marginTop: 24 }}>
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
                    Export the rendered workflow as PNG or PDF for presentations
                    or sharing.
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={exportDiagramToPng}
                      disabled={exportingPng}
                      style={secondaryButtonStyle}
                    >
                      {exportingPng ? "Exporting PNG..." : "Export Diagram to PNG"}
                    </button>

                    <button
                      onClick={exportDiagramToPdf}
                      disabled={exportingPdf}
                      style={secondaryButtonStyle}
                    >
                      {exportingPdf ? "Exporting PDF..." : "Export Diagram to PDF"}
                    </button>
                  </div>
                </div>

                <div
                  ref={diagramRef}
                  style={{
                    height: 760,
                    border: "1px solid #e2e8f0",
                    borderRadius: 20,
                    overflow: "hidden",
                    background:
                      "radial-gradient(circle at top left, #ffffff 0%, #f8fafc 60%, #eef2ff 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
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

            <div style={{ marginTop: 24 }}>
              <Card title="Workflow Metadata">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: "#0f172a" }}>Systems</h3>
                    <ul style={{ marginBottom: 0, color: "#475569", lineHeight: 1.8 }}>
                      {result.systems?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <h3 style={{ marginTop: 0, color: "#0f172a" }}>
                      Automation Opportunities
                    </h3>
                    <ul style={{ marginBottom: 0, color: "#475569", lineHeight: 1.8 }}>
                      {result.automationOpportunities?.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            </div>

            <div style={{ marginTop: 24 }}>
              <Card>
                <button
                  onClick={() => setShowJson((prev) => !prev)}
                  style={secondaryButtonStyle}
                >
                  {showJson ? "Hide Technical Output" : "Show Technical Output"}
                </button>

                {showJson ? (
                  <pre
                    style={{
                      marginTop: 16,
                      background: "#f8fafc",
                      padding: 16,
                      borderRadius: 16,
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                      fontSize: 13,
                      color: "#334155",
                      border: "1px solid #e2e8f0",
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