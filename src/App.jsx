import React, { useState, useMemo, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const COLORS = {
  bg: "#f8fafc",
  card: "#ffffff",
  border: "#cbd5e1",
  text: "#0f172a",
  muted: "#64748b",
  line: "#94a3b8",
};

const rolesLibrary = ["HR", "IT", "Manager", "Employee", "Security"];

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
    roles: finalRoles,
    stages: stages.map((name, i) => ({
      id: i,
      name,
      owner: finalRoles[i % finalRoles.length],
      type: name === "Approval" || name === "Validate" ? "decision" : "process",
    })),
  };
}

export default function App() {
  const [prompt, setPrompt] = useState(
    "Employee onboarding with HR, IT, Manager, approvals and account setup"
  );
  const [savedPrompt, setSavedPrompt] = useState(prompt);
  const diagramRef = useRef(null);

  const workflow = useMemo(() => inferWorkflow(savedPrompt), [savedPrompt]);

  const exportPNG = async () => {
    const canvas = await html2canvas(diagramRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const link = document.createElement("a");
    link.download = "workflow.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(diagramRef.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "px", [
      canvas.width,
      canvas.height,
    ]);
    pdf.addImage(img, "PNG", 0, 0);
    pdf.save("workflow.pdf");
  };

  return (
    <div style={{ padding: 24, background: COLORS.bg, minHeight: "100vh" }}>
      <h1 style={{ marginBottom: 10 }}>Workflow Generator</h1>

      <textarea
        style={{
          width: "100%",
          height: 120,
          padding: 10,
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
        }}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={() => setSavedPrompt(prompt)}>Generate</button>
        <button onClick={exportPNG} style={{ marginLeft: 10 }}>
          Export PNG
        </button>
        <button onClick={exportPDF} style={{ marginLeft: 10 }}>
          Export PDF
        </button>
      </div>

      <div
        ref={diagramRef}
        style={{
          marginTop: 30,
          padding: 20,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
        }}
      >
        <h2>{workflow.title}</h2>

        {workflow.roles.map((role) => (
          <div key={role} style={{ marginBottom: 20 }}>
            <strong>{role}</strong>

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              {workflow.stages
                .filter((s) => s.owner === role)
                .map((stage) => (
                  <div
                    key={stage.id}
                    style={{
                      padding: 10,
                      minWidth: 120,
                      textAlign: "center",
                      border:
                        stage.type === "decision"
                          ? "2px dashed #000"
                          : "2px solid #000",
                    }}
                  >
                    {stage.name}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}