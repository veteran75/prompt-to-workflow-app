import React, { useState, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = {
  bgTop: "#eef4ff",
  bgBottom: "#ffffff",
  card: "#ffffff",
  border: "#cbd5e1",
  text: "#0f172a",
  muted: "#64748b",
  primary: "#2563eb",
  primarySoft: "#dbeafe",
  secondary: "#7c3aed",
  secondarySoft: "#ede9fe",
  teal: "#0f766e",
  tealSoft: "#ccfbf1",
  green: "#059669",
  greenSoft: "#d1fae5",
  orange: "#d97706",
  orangeSoft: "#fef3c7",
  red: "#dc2626",
  redSoft: "#fee2e2",
  slateSoft: "#e2e8f0",
};

const ROLE_STYLES = {
  HR: { bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", accent: "#2563eb" },
  IT: { bg: "linear-gradient(135deg, #ecfeff 0%, #ccfbf1 100%)", accent: "#0f766e" },
  Manager: { bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)", accent: "#7c3aed" },
  Employee: { bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", accent: "#059669" },
  Security: { bg: "linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)", accent: "#dc2626" },
};

const rolesLibrary = ["HR", "IT", "Manager", "Employee", "Security"];

function getStageStyle(name) {
  switch (name) {
    case "Intake":
      return { bg: COLORS.primarySoft, border: COLORS.primary };
    case "Review":
      return { bg: COLORS.secondarySoft, border: COLORS.secondary };
    case "Approval":
      return { bg: COLORS.orangeSoft, border: COLORS.orange };
    case "Provision":
      return { bg: COLORS.tealSoft, border: COLORS.teal };
    case "Validate":
      return { bg: COLORS.redSoft, border: COLORS.red };
    case "Enable":
      return { bg: COLORS.greenSoft, border: COLORS.green };
    default:
      return { bg: COLORS.slateSoft, border: COLORS.muted };
  }
}

function inferWorkflow(prompt) {
  const roles = rolesLibrary.filter((r) =>
    prompt.toLowerCase().includes(r.toLowerCase())
  );
  const finalRoles = roles.length ? roles : ["HR", "IT", "Manager"];

  const stages = [
    "Intake",
    "Review",
    "Approval",
    "Provision",
    "Validate",
    "Enable",
    "Close",
  ];

  return {
    title: "Workflow Diagram",
    subtitle: "Color-coded workflow with swimlanes and decision points",
    roles: finalRoles,
    stages: stages.map((name, i) => {
      const style = getStageStyle(name);
      return {
        id: i,
        name,
        owner: finalRoles[i % finalRoles.length],
        type: name === "Approval" || name === "Validate" ? "decision" : "process",
        bg: style.bg,
        borderColor: style.border,
      };
    }),
  };
}

function runInferenceTests() {
  const results = [];

  const workflowA = inferWorkflow(
    "Employee onboarding with HR, IT, Manager, Teams, approvals, and account setup"
  );
  results.push({
    name: "detects known roles",
    pass:
      workflowA.roles.includes("HR") &&
      workflowA.roles.includes("IT") &&
      workflowA.roles.includes("Manager"),
  });

  const workflowB = inferWorkflow("");
  results.push({
    name: "falls back safely on empty prompt",
    pass: workflowB.roles.length === 3 && workflowB.stages.length === 7,
  });

  const workflowC = inferWorkflow("Security validation and approval workflow");
  results.push({
    name: "marks approval and validate as decision nodes",
    pass:
      workflowC.stages.find((stage) => stage.name === "Approval")?.type === "decision" &&
      workflowC.stages.find((stage) => stage.name === "Validate")?.type === "decision",
  });

  const workflowD = inferWorkflow("Create onboarding workflow for HR and Employee");
  results.push({
    name: "keeps role detection scoped to prompt content",
    pass: workflowD.roles.includes("HR") && workflowD.roles.includes("Employee"),
  });

  return results;
}

export default function App() {
  const [prompt, setPrompt] = useState(
    "Create an employee onboarding workflow using HR, IT, Manager, Security, and Employee swimlanes. Include approvals, account setup, equipment assignment, security validation, collaboration setup, training, and 30-day follow-up."
  );
  const [savedPrompt, setSavedPrompt] = useState(prompt);
  const [activeTab, setActiveTab] = useState("diagram");
  const diagramRef = useRef(null);

  const workflow = useMemo(() => inferWorkflow(savedPrompt), [savedPrompt]);
  const testResults = useMemo(() => runInferenceTests(), []);

  const exportPNG = async () => {
    const canvas = await html2canvas(diagramRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = "workflow-colorful.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(diagramRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "px", [canvas.width, canvas.height]);
    pdf.addImage(img, "PNG", 0, 0);
    pdf.save("workflow-colorful.pdf");
  };

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${COLORS.bgTop} 0%, #f8fafc 45%, ${COLORS.bgBottom} 100%)`,
        color: COLORS.text,
        fontFamily: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            marginBottom: 18,
            padding: 22,
            borderRadius: 22,
            background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #0f766e 100%)",
            color: "#ffffff",
            boxShadow: "0 14px 34px rgba(37, 99, 235, 0.18)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            Executive workflow demo
          </div>
          <h1 style={{ margin: "8px 0 6px 0", fontSize: 34, lineHeight: 1.1 }}>
            Workflow Generator
          </h1>
          <div style={{ fontSize: 15, opacity: 0.94, maxWidth: 760 }}>
            Turn plain-language prompts into colorful, presentation-ready workflow diagrams for interviews, portfolio demos, and executive walkthroughs.
          </div>
        </div>

        <div
          style={{
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 20,
            padding: 18,
            boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Workflow prompt</div>
          <textarea
            style={{
              width: "100%",
              height: 120,
              padding: 14,
              borderRadius: 14,
              border: `1px solid ${COLORS.border}`,
              background: "#ffffff",
              boxShadow: "0 2px 10px rgba(15, 23, 42, 0.04)",
              fontSize: 14,
              color: COLORS.text,
              resize: "vertical",
            }}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setSavedPrompt(prompt)}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
                color: "#ffffff",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 18px rgba(37, 99, 235, 0.18)",
              }}
            >
              Generate
            </button>
            <button
              onClick={exportPNG}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: `1px solid ${COLORS.primary}`,
                background: COLORS.primarySoft,
                color: COLORS.primary,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Export PNG
            </button>
            <button
              onClick={exportPDF}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                border: `1px solid ${COLORS.secondary}`,
                background: COLORS.secondarySoft,
                color: COLORS.secondary,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Export PDF
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          {[
            { key: "diagram", label: "Diagram" },
            { key: "summary", label: "Summary" },
            { key: "tests", label: "Tests" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                background: activeTab === tab.key ? "linear-gradient(135deg, #eff6ff 0%, #ede9fe 100%)" : "#ffffff",
                color: COLORS.text,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "diagram" && (
          <div
            ref={diagramRef}
            style={{
              padding: 24,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 22,
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 18,
              }}
            >
              <div>
                <h2 style={{ margin: 0, color: COLORS.text, fontSize: 26 }}>{workflow.title}</h2>
                <div style={{ marginTop: 6, color: COLORS.muted, fontSize: 14 }}>
                  {workflow.subtitle}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {workflow.roles.map((role) => (
                  <span
                    key={role}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      background: "linear-gradient(135deg, #eff6ff 0%, #ede9fe 100%)",
                      color: COLORS.text,
                      fontSize: 12,
                      fontWeight: 800,
                      border: `1px solid ${COLORS.border}`,
                    }}
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {workflow.roles.map((role) => {
              const laneStyle = ROLE_STYLES[role] || { bg: "#f8fafc", accent: COLORS.muted };
              return (
                <div
                  key={role}
                  style={{
                    marginBottom: 18,
                    padding: 16,
                    borderRadius: 18,
                    background: laneStyle.bg,
                    border: `1px solid ${COLORS.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        background: laneStyle.accent,
                      }}
                    />
                    <strong style={{ color: COLORS.text, fontSize: 16 }}>{role}</strong>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                    {workflow.stages
                      .filter((s) => s.owner === role)
                      .map((stage) => (
                        <div
                          key={stage.id}
                          style={{
                            padding: "12px 14px",
                            minWidth: 140,
                            textAlign: "center",
                            border: `2px ${stage.type === "decision" ? "dashed" : "solid"} ${stage.borderColor}`,
                            borderRadius: stage.type === "decision" ? 18 : 12,
                            background: stage.bg,
                            color: COLORS.text,
                            fontWeight: 800,
                            boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
                          }}
                        >
                          <div style={{ fontSize: 13 }}>{stage.name}</div>
                          <div style={{ marginTop: 6, fontSize: 11, color: COLORS.muted, fontWeight: 700 }}>
                            {stage.type === "decision" ? "Decision" : "Process"}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "summary" && (
          <div
            style={{
              padding: 24,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 22,
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Workflow summary</h2>
            <div style={{ display: "grid", gap: 12 }}>
              {workflow.stages.map((stage) => (
                <div
                  key={stage.id}
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    border: `1px solid ${COLORS.border}`,
                    background: stage.bg,
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{stage.name}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: COLORS.muted }}>
                    Owner: {stage.owner} · Type: {stage.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tests" && (
          <div
            style={{
              padding: 24,
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 22,
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
            }}
          >
            <h2 style={{ marginTop: 0 }}>Parser checks</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {testResults.map((test) => (
                <div
                  key={test.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    padding: 14,
                    borderRadius: 14,
                    border: `1px solid ${COLORS.border}`,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ fontSize: 14 }}>{test.name}</div>
                  <span
                    style={{
                      padding: "5px 10px",
                      borderRadius: 999,
                      background: test.pass ? COLORS.greenSoft : COLORS.redSoft,
                      color: test.pass ? COLORS.green : COLORS.red,
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {test.pass ? "PASS" : "FAIL"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
