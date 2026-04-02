import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Database,
  Gauge,
  GitBranch,
  Sparkles,
  ShieldCheck,
  Users,
  Clock3,
  ArrowRight,
  Layers3,
  Wand2,
  BarChart3,
  Bot,
  Activity,
  AlertTriangle,
  Workflow,
  Building2,
} from "lucide-react";

const Card = ({ children, className = "" }) => (
  <div className={`rounded-[28px] border border-slate-200/80 bg-white/90 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`border-b border-slate-200/70 p-5 ${className}`}>{children}</div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-5 ${className}`}>{children}</div>
);

const CardTitle = ({ children, className = "" }) => (
  <h2 className={`text-lg font-semibold tracking-tight text-slate-900 ${className}`}>{children}</h2>
);

const Button = ({ children, variant = "default", className = "", ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
      variant === "outline"
        ? "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        : "bg-slate-900 text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800"
    } ${className}`}
  >
    {children}
  </button>
);

const Textarea = (props) => (
  <textarea
    {...props}
    className="min-h-[130px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-slate-300 focus:shadow-sm"
  />
);

const Badge = ({ children, className = "" }) => (
  <span className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 ${className}`}>
    {children}
  </span>
);

const Progress = ({ value }) => (
  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
    <div
      className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500"
      style={{ width: `${value}%` }}
    />
  </div>
);

const samplePrompts = [
  "Automate employee onboarding using M365, ServiceNow, and Teams approvals.",
  "Create a budget approval workflow with manager review, finance validation, and audit logging.",
  "Standardize duplicate collaboration tools across departments and recommend a migration path.",
];

const fallbackWorkflow = {
  title: "Employee Onboarding Workflow",
  summary: "Automates onboarding across HR, IT, Security, and Manager approvals with structured approvals, account provisioning, and day-one readiness tasks.",
  tools: ["OpenAI", "Power Automate", "ServiceNow", "M365", "Power BI"],
  risks: ["Approval delays", "Missing access requirements", "Manual handoff gaps"],
  metrics: ["Time saved", "Automation coverage", "Provisioning completion rate", "Day-one readiness rate"],
  steps: [
    { id: 1, name: "Submit Request", owner: "HR", type: "manual", description: "HR submits the onboarding request with employee details, start date, location, and role." },
    { id: 2, name: "Manager Approval", owner: "Manager", type: "decision", description: "Manager validates role, reporting line, and required access packages." },
    { id: 3, name: "Provision Accounts", owner: "IT", type: "automation", description: "Create M365 account, assign licenses, provision Teams and standard device profile." },
    { id: 4, name: "Security Review", owner: "Security", type: "decision", description: "Review elevated permissions, sensitive data access, and compliance flags." },
    { id: 5, name: "Welcome & Handoff", owner: "HR / IT", type: "manual", description: "Send welcome packet, confirm readiness, and close the onboarding request." },
  ],
};

const summaryCards = [
  {
    title: "Target Output",
    text: "Executive-ready workflow with visual steps, ownership, risks, and measurable outcomes.",
    icon: Workflow,
  },
  {
    title: "Recommended Stack",
    text: "OpenAI, Power Automate, ServiceNow, M365, Power BI",
    icon: Database,
  },
  {
    title: "Business Outcome",
    text: "Fewer handoffs, faster turnaround, stronger standardization and governance.",
    icon: Building2,
  },
];

const metricCards = [
  { label: "Workflow Confidence", value: 91, icon: Brain, note: "Strong prompt-to-process alignment" },
  { label: "Automation Coverage", value: 78, icon: Bot, note: "Most repetitive steps can be automated" },
  { label: "Governance Readiness", value: 86, icon: ShieldCheck, note: "Policies and approvals mapped" },
  { label: "Estimated Time Saved", value: 64, icon: Clock3, note: "Compared with manual coordination" },
];

function WorkflowNode({ icon: Icon, title, text, tone = "slate" }) {
  const tones = {
    slate: "border-slate-200 bg-white",
    blue: "border-sky-200 bg-sky-50/70",
    violet: "border-violet-200 bg-violet-50/70",
    emerald: "border-emerald-200 bg-emerald-50/70",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`min-w-[220px] rounded-[24px] border p-4 shadow-sm ${tones[tone]}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-2xl border border-white/80 bg-white p-2 shadow-sm">
          <Icon className="h-5 w-5 text-slate-800" />
        </div>
        <div className="font-semibold text-slate-900">{title}</div>
      </div>
      <p className="text-sm leading-6 text-slate-600">{text}</p>
    </motion.div>
  );
}

function StepCard({ step, isLast }) {
  const tone = {
    manual: "border-slate-200 bg-slate-50 text-slate-700",
    decision: "border-amber-200 bg-amber-50 text-amber-700",
    automation: "border-emerald-200 bg-emerald-50 text-emerald-700",
    insight: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div className="relative">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Step {step.id}</div>
            <h3 className="mt-1 text-base font-semibold text-slate-900">{step.name}</h3>
          </div>
          <Badge className={tone[step.type] || ""}>{step.type}</Badge>
        </div>
        <div className="mb-2 text-sm font-medium text-slate-700">Owner: {step.owner}</div>
        <p className="text-sm leading-6 text-slate-600">{step.description}</p>
      </div>
      {!isLast && (
        <div className="mx-auto my-2 flex w-full items-center justify-center text-slate-300">
          <ArrowRight className="h-4 w-4 rotate-90" />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState(samplePrompts[0]);
  const [workflowResult, setWorkflowResult] = useState(fallbackWorkflow);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateWorkflow = async () => {
    console.log("CLICKED");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      console.log("STATUS:", res.status);
      console.log("DATA:", data);

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      setWorkflowResult(data);
    } catch (err) {
      console.error("ERROR:", err);
      setError(err.message || "Error connecting to AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.10),_transparent_28%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_55%,_#f8fafc)] p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <Card className="overflow-hidden border-slate-200/80 bg-white/85">
            <div className="grid lg:grid-cols-[1.35fr_0.9fr]">
              <div className="p-6 md:p-8">
                <Badge className="mb-4 bg-white">Enterprise Workflow Studio</Badge>
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                      Prompt to Workflow
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                      Turn natural-language requests into structured workflows with AI analysis,
                      orchestration logic, optimization insight, and executive-ready outputs.
                    </p>
                  </div>
                  <div className="hidden rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 lg:block">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                      <Sparkles className="h-4 w-4" /> CIO Demo Ready
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Live AI + visual workflow output</div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">Workflow Prompt</div>
                      <div className="text-xs text-slate-500">Describe the business process you want designed or optimized</div>
                    </div>
                    <Badge>AI-assisted generation</Badge>
                  </div>

                  <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />

                  <div className="mt-4 flex flex-wrap gap-2">
                    {samplePrompts.map((item) => (
                      <button
                        key={item}
                        onClick={() => setPrompt(item)}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition hover:bg-slate-100"
                      >
                        {item.length > 52 ? `${item.slice(0, 52)}...` : item}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button onClick={generateWorkflow}>
                      <Wand2 className="mr-2 h-4 w-4" />
                      {loading ? "Generating..." : "Generate Workflow"}
                    </Button>
                    <Button variant="outline">
                      <GitBranch className="mr-2 h-4 w-4" /> Visualize Flow
                    </Button>
                    <Button variant="outline">
                      <BarChart3 className="mr-2 h-4 w-4" /> Review Metrics
                    </Button>
                  </div>

                  {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      <AlertTriangle className="h-4 w-4" /> {error}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-l border-slate-200 bg-slate-950 p-6 text-white md:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-2xl bg-white/10 p-3">
                    <Gauge className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-300">AI Assessment</div>
                    <div className="text-xl font-semibold">Workflow Readiness</div>
                  </div>
                </div>

                <div className="mb-5 rounded-[24px] bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-200">
                    <span>Overall score</span>
                    <span className="font-semibold text-white">89 / 100</span>
                  </div>
                  <Progress value={89} />
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    High potential for automation, strong governance alignment, minor exception handling still recommended.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {metricCards.map((metric) => {
                    const Icon = metric.icon;
                    return (
                      <div key={metric.label} className="rounded-[22px] bg-white/5 p-4 ring-1 ring-white/10">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 text-sm text-slate-200">
                            <Icon className="h-4 w-4" /> {metric.label}
                          </div>
                          <div className="text-lg font-semibold text-white">{metric.value}%</div>
                        </div>
                        <Progress value={metric.value} />
                        <p className="mt-3 text-xs leading-5 text-slate-400">{metric.note}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid gap-4 xl:grid-cols-4">
          <Card className="xl:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Layers3 className="h-5 w-5" /> Workflow Architecture
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto pb-2">
                <div className="flex min-w-[1050px] items-center gap-3">
                  {(workflowResult?.steps || []).map((step, index, arr) => (
                    <React.Fragment key={step.id}>
                      <WorkflowNode
                        icon={step.type === "automation" ? Bot : step.type === "decision" ? ShieldCheck : step.type === "insight" ? Brain : Users}
                        title={step.name}
                        text={`${step.owner} • ${step.type}`}
                        tone={step.type === "automation" ? "emerald" : step.type === "decision" ? "violet" : step.type === "insight" ? "slate" : "blue"}
                      />
                      {index < arr.length - 1 && <ArrowRight className="h-5 w-5 shrink-0 text-slate-400" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {summaryCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title}>
                  <CardContent className="flex items-start gap-3">
                    <div className="rounded-2xl bg-slate-100 p-3">
                      <Icon className="h-5 w-5 text-slate-800" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-slate-600">{item.text}</div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {workflowResult && (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Activity className="h-5 w-5" /> AI Workflow Output
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-semibold text-slate-950">{workflowResult.title}</h2>
                    <Badge>{workflowResult.steps?.length || 0} steps</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{workflowResult.summary}</p>
                </div>

                <div className="grid gap-3">
                  {(workflowResult.steps || []).map((step, index, arr) => (
                    <StepCard key={step.id} step={step} isLast={index === arr.length - 1} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Database className="h-5 w-5" /> Recommended Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(workflowResult.tools || []).map((tool) => (
                      <Badge key={tool}>{tool}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <AlertTriangle className="h-5 w-5" /> Risks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(workflowResult.risks || []).map((risk) => (
                    <div key={risk} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {risk}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <BarChart3 className="h-5 w-5" /> Success Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(workflowResult.metrics || []).map((metric) => (
                    <div key={metric} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      {metric}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
