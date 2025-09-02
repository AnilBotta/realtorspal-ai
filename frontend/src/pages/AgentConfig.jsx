import React, { useState } from "react";

export default function AgentConfig(){
  const [tab, setTab] = useState("behavior");
  const agents = [
    { name: "Main Orchestrator AI", model: "auto", status: "active" },
    { name: "Lead Generator AI", model: "Claude 3", status: "active" },
    { name: "Lead Nurturing AI", model: "GPT-3.5 Turbo", status: "active" },
    { name: "Customer Service AI", model: "Gemini Pro", status: "active" },
    { name: "Onboarding Agent AI", model: "Claude Instant", status: "active" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-4">
        <div className="text-lg font-semibold">AI Agent Configuration</div>
        <div className="text-sm text-slate-500">Customize behavior, prompts, and AI models</div>

        <div className="flex gap-2 mt-3 overflow-x-auto">
          {agents.map(a => (
            <button key={a.name} className="px-3 py-2 rounded-full border bg-white text-slate-700 hover:bg-slate-50 text-sm">
              <span className="font-medium">{a.name}</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{a.status}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="flex items-center gap-4 text-sm">
            {[
              { id: "behavior", label: "Behavior & Prompts" },
              { id: "model", label: "AI Model" },
              { id: "performance", label: "Performance" },
              { id: "automation", label: "Automation" },
              { id: "analytics", label: "Analytics" },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`py-2 border-b-2 -mb-px ${tab===t.id?'border-emerald-600 text-emerald-700':'border-transparent text-slate-500'}`}>{t.label}</button>
            ))}
          </div>

          {tab === 'behavior' && (
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-slate-700 mb-2">System Prompt</div>
                <textarea className="w-full h-48 border rounded-xl p-3" defaultValue={`You are the Main Orchestrator AI for RealtorsPal, responsible for coordinating all AI agents and ensuring optimal system performance.\n\n1. Monitor agent activities and performance metrics\n2. Resolve conflicts\n3. Optimize lead routing\n4. Ensure system-wide efficiency\n5. Generate insights and recommendations`}></textarea>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <button className="px-2 py-1 rounded border">Copy</button>
                  <button className="px-2 py-1 rounded border">Reset to Default</button>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700 mb-2">Agent Status</div>
                <div className="rounded-xl border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Status</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-50 text-emerald-700">active</span>
                  </div>
                  <div className="mt-3 text-xs text-slate-600">
                    <div className="flex items-center justify-between"><span>Success Rate</span><span>98%</span></div>
                    <div className="flex items-center justify-between"><span>Avg Response</span><span>1.8s</span></div>
                  </div>
                  <div className="mt-3 text-xs grid gap-2">
                    <button className="px-2 py-1 rounded border">Restart Agent</button>
                    <button className="px-2 py-1 rounded border">Clone Configuration</button>
                    <button className="px-2 py-1 rounded border">View Logs</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'model' && (
            <div className="mt-4 grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border p-3">
                <div className="text-sm font-medium mb-2">Provider</div>
                <select className="border rounded px-2 py-1 text-sm"><option>Emergent (Auto)</option><option>OpenAI</option><option>Anthropic</option><option>Gemini</option></select>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-sm font-medium mb-2">Model</div>
                <input className="border rounded px-2 py-1 text-sm w-full" placeholder="e.g., gpt-4o-mini" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm">Save Configuration</button>
        </div>
      </div>
    </div>
  );
}