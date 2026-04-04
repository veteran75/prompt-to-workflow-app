import React, { useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from "@xyflow/react";
import { Loader2, Sparkles, Download, BarChart3, ListChecks, Network, ShieldAlert } from "lucide-react";

type StepType = "process" | "decision" | "approval" | "system";

type WorkflowStep = {
  id: string;
  label: string;
  owner: string;
  type: StepType;
};

type WorkflowConnection = {
  source: string;
  target: string;
  label?: string;
};

type KPI = {
  name: string;
  target: string;
};

type ExecutiveSummary = {
  businessChallenge: string;
  recommendedSolution: string;
  expectedOutcome: string;
  strategicValue: string;
};

type WorkflowResponse = {
  title: string;
  executiveSummary: ExecutiveSummary;
  roles: string[];
  systems: string[];
  automationOpportunities: string[];
  risks: string[];
  kpis: KPI[];
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
};

type TabKey = "summary" | "workflow" | "automation" | "metrics";

const defaultPrompt =
  "Create a future-state employee onboarding workflow for a 500-person organization using Microsoft 365, Teams, SharePoint, and Power Automate. Include roles, systems, automation opportunities, risks, and measurable KPIs.";

const fallbackData: WorkflowResponse = {
  title: "Employee Onboarding Modernization",
  executiveSummary: {
    businessChallenge:
      "The onboarding process is fragmented across HR, IT, Facilities, and hiring managers, creating delays, missing information, and inconsistent day-one readiness.",
    recommendedSolution:
      "Implement a standardized onboarding workflow using Microsoft 365, Teams, SharePoint, and Power Automate to centralize intake, automate routing, and track completion.",
    expectedOutcome:
      "Reduce manual coordination, improve accountability, and deliver a more consistent onboarding experience.",
    strategicValue:
      "Supports digital workplace modernization, process standardization, and AI-enabled productivity improvements.",
  },
  roles: ["HR", "Hiring Manager", "IT", "Facilities", "New Hire"],
  systems: ["Microsoft 365", "Teams", "SharePoint", "Power Automate", "Planner"],
  automationOpportunities: [
    "Validate required fields before request submission",
    "Auto-create tasks for HR, IT, Facilities, and Managers",
    "Trigger reminders and escalations for incomplete items",
    "Send onboarding hub resources automatically to new hires",
  ],
  risks: [
    "Incomplete intake data from HR",
    "Unclear ownership for late tasks",
    "Over-customization between departments",
    "Low adoption of the standardized process",
  ],
  kpis: [
    { name: "Day-one readiness", target: "95%" },
    { name: "Cycle-time reduction", target: "40%" },
    { name: "Manual emails reduced", target: "60%" },
    { name: "Service desk tickets reduced", target: "30%" },
  ],
  steps: [
    { id: "step-1", label: "HR submits onboarding form", owner: "HR", type: "process" },
    { id: "step-2", label: "Validate required fields", owner: "System", type: "decision" },
    { id: "step-3", label: "Create tasks and notify owners", owner: "System", type: "system" },
    { id: "step-4", label: "Provision accounts and devices", owner: "IT", type: "process" },
    { id: "step-5", label: "Manager completes onboarding checklist", owner: "Hiring Manager", type: "process" },
    { id: "step-6", label: "Prepare badge and workspace", owner: "Facilities", type: "process" },
    { id: "step-7", label: "Send onboarding hub and training", owner: "System", type: "system" },
    { id: "step-8", label: "Run day-one readiness check", owner: "System", type: "approval" },
    { id: "step-9", label: "Launch day-one experience", owner: "New Hire", type: "process" },
  ],
  connections: [
    { source: "step-1", target: "step-2" },
    { source: "step-2", target: "step-3", label: "Complete" },
    { source: "step-3", target: "step-4" },
    { source: "step-3", target: "step-5" },
    { source: "step-3", target: "step-6" },
    { source: "step-4", target: "step-7" },
    { source: "step-5", target: "step-8" },
    { source: "step-6", target: "step-8" },
    { source: "step-7", target: "step-8" },
    { source: "step-8", target: "step-9", label: "Ready" },
  ],
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getNodeColors(type: StepType) {
  switch (type) {
    case "decision":
      return "bg-amber-50 border-amber-300";
    case "approval":
      return "bg-emerald-50 border-emerald-300";
    case "system":
      return "bg-sky-50 border-sky-300";
    default:
      return "bg-white border-slate-300";
  }
}

function WorkflowNode({ data }: { data: { label: string; owner: string; type: StepType } }) {
  return (
    <div className={cn("rounded-2xl border shadow-sm px-4 py-3 min-w-[220px]", getNodeColors(data.type))}>
      <Handle type="target" position={Position.Top} />
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{data.type}</div>
      <div className="text-sm font-semibold text-slate-900 whitespace-pre-wrap">{data.label}</div>
      <div className="text-xs text-slate-600 mt-2">Owner: {data.owner}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { workflowNode: WorkflowNode };

function buildFlow(data: WorkflowResponse) {
  const nodes = data.steps.map((step, index) => ({
    id: step.id,
    type: "workflowNode",
    position: {
      x: index % 2 === 0 ? 80 : 420,
      y: 40 + index * 135,
    },
    data: {
      label: step.label,
      owner: step.owner,
      type: step.type,
    },
  }));

  const edges = data.connections.map((conn, index) => ({
    id: `edge-${index}`,
    source: conn.source,
    target: conn.target,
    label: conn.label,
    markerEnd: { type: MarkerType.ArrowClosed },
    animated: true,
    style: { strokeWidth: 2 },
  }));

  return { nodes, edges };
}

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        {icon}
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SummaryView({ data }: { data: WorkflowResponse }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="Business Challenge" icon={<Sparkles className="w-5 h-5" />}>
        <p className="text-sm text-slate-700 leading-6">{data.executiveSummary.businessChallenge}</p>
      </SectionCard>
      <SectionCard title="Recommended Solution" icon={<Sparkles className="w-5 h-5" />}>
        <p className="text-sm text-slate-700 leading-6">{data.executiveSummary.recommendedSolution}</p>
      </SectionCard>
      <SectionCard title="Expected Outcome" icon={<BarChart3 className="w-5 h-5" />}>
        <p className="text-sm text-slate-700 leading-6">{data.executiveSummary.expectedOutcome}</p>
      </SectionCard>
      <SectionCard title="Strategic Value" icon={<Network className="w-5 h-5" />}>
        <p className="text-sm text-slate-700 leading-6">{data.executiveSummary.strategicValue}</p>
      </SectionCard>
    </div>
  );
}

function WorkflowView({ data }: { data: WorkflowResponse }) {
  const flow = useMemo(() => buildFlow(data), [data]);
  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <div className="h-[760px] w-full">
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

function AutomationView({ data }: { data: WorkflowResponse }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <SectionCard title="Automation Opportunities" icon={<ListChecks className="w-5 h-5" />}>
        <ul className="space-y-3 text-sm text-slate-700">
          {data.automationOpportunities.map((item) => (
            <li key={item} className="rounded-xl bg-slate-50 p-3 border border-slate-200">{item}</li>
          ))}
        </ul>
      </SectionCard>
      <SectionCard title="Risks & Dependencies" icon={<ShieldAlert className="w-5 h-5" />}>
        <ul className="space-y-3 text-sm text-slate-700">
          {data.risks.map((risk) => (
            <li key={risk} className="rounded-xl bg-slate-50 p-3 border border-slate-200">{risk}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function MetricsView({ data }: { data: WorkflowResponse }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {data.kpis.map((kpi) => (
        <div key={kpi.name} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="text-sm text-slate-500">{kpi.name}</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{kpi.target}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("summary");
  const [result, setResult] = useState<WorkflowResponse>(fallbackData);
  const [error, setError] = useState<string | null>(null);

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "summary", label: "Executive Summary" },
    { key: "workflow", label: "Workflow Diagram" },
    { key: "automation", label: "Automation & Risks" },
    { key: "metrics", label: "KPIs" },
  ];

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:3001/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Generation failed");
      }

      const data = (await res.json()) as WorkflowResponse;
      setResult(data);
      setActiveTab("summary");
    } catch (err) {
      console.error(err);
      setError("Could not reach the API. Showing fallback demo data so you can continue building the UI.");
      setResult(fallbackData);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 mb-4">
                <Sparkles className="w-4 h-4" />
                WorkflowIQ Demo Upgrade
              </div>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight">AI Workflow Modernization Platform</h1>
              <p className="mt-4 text-base md:text-lg text-slate-600 leading-7">
                Turn business problems into structured workflows, automation opportunities, and executive-ready outputs.
              </p>
            </div>

            <button
              onClick={handleExport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              Export / Print
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px,1fr]">
          <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-6 space-y-5 h-fit">
            <div>
              <h2 className="text-xl font-semibold">Generate Workflow</h2>
              <p className="text-sm text-slate-500 mt-1">Use a business prompt to create a full workflow scenario.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Business Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-[240px] rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Generating..." : "Generate Workflow"}
            </button>

            {error && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {error}
              </div>
            )}

            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Current demo title</div>
              <div className="font-semibold text-slate-900">{result.title}</div>
              <div className="mt-4 flex flex-wrap gap-2">
                {result.systems.map((system) => (
                  <span key={system} className="rounded-full border border-slate-300 px-3 py-1 text-xs text-slate-700">
                    {system}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      "rounded-2xl px-4 py-2 text-sm font-medium border",
                      activeTab === tab.key
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "summary" && <SummaryView data={result} />}
            {activeTab === "workflow" && <WorkflowView data={result} />}
            {activeTab === "automation" && <AutomationView data={result} />}
            {activeTab === "metrics" && <MetricsView data={result} />}
          </div>
        </div>
      </div>
    </div>
  );
}
