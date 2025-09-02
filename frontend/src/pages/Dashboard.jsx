import React, { useEffect, useMemo, useState } from "react";
import { getLeads, getDashboardAnalytics } from "../api";

function Stat({ label, value, hint }){
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-800 mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function Dashboard({ user }){
  const [stats, setStats] = useState({ total_leads: 0, by_stage: {} });
  const stages = ["New", "Contacted", "Appointment", "Onboarded", "Closed"];

  useEffect(() => {
    async function load(){
      const { data } = await getDashboardAnalytics(user.id);
      setStats(data);
    }
    load();
  }, [user.id]);

  const board = useMemo(() => stages.map(s => ({ name: s, count: stats.by_stage[s] || 0 })), [stats]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Stat label="Total Leads" value={stats.total_leads} />
        <Stat label="Active Conversations" value={1} />
        <Stat label="Appointments Scheduled" value={0} />
        <Stat label="Conversion Rate" value={`${((stats.by_stage.Closed||0)/(stats.total_leads||1)*100).toFixed(0)}%`} />
        <Stat label="Revenue Generated" value={`$0`} />
        <Stat label="Response Time" value={`3 min`} />
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold mb-3">Lead Pipeline</div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {board.map(col => (
            <div key={col.name} className="rounded-xl border border-dashed p-3 bg-slate-50">
              <div className="text-sm font-medium text-slate-700 mb-2">{col.name} <span className="text-slate-400">({col.count})</span></div>
              <div className="h-24 text-xs text-slate-400 flex items-center justify-center">Add Lead</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {["Import Leads","View Reports","Configure AI","System Setup","Export Data","Refresh All"].map(a => (
            <button key={a} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">{a}</button>
          ))}
        </div>
      </div>
    </div>
  );
}