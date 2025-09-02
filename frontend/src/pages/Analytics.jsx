import React, { useEffect, useState } from "react";
import { getDashboardAnalytics } from "../api";

export default function Analytics({ user }){
  const [data, setData] = useState({ total_leads: 0, by_stage: {} });

  useEffect(() => {
    async function load(){
      const { data } = await getDashboardAnalytics(user.id);
      setData(data);
    }
    load();
  }, [user.id]);

  const stages = [
    { key: "Website Visitors", value: 5420, percent: 100 },
    { key: "Lead Generated", value: data.by_stage?.New || 0 + (data.by_stage?.Contacted || 0), percent: 23 },
    { key: "Contacted", value: data.by_stage?.Contacted || 0, percent: 16.5 },
    { key: "Appointment Booked", value: data.by_stage?.Appointment || 0, percent: 4.3 },
    { key: "Onboarded", value: data.by_stage?.Onboarded || 0, percent: 2.9 },
    { key: "Closed Deal", value: data.by_stage?.Closed || 0, percent: 1.6 },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "Active Leads", value: data.total_leads },
          { label: "Agents Working", value: 5 },
          { label: "Tasks Active", value: 23 },
          { label: "Response Time", value: "2.3s" },
          { label: "Uptime", value: "99.8%" },
          { label: "Daily Goal", value: "78%" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border p-4">
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className="text-2xl font-semibold text-slate-800 mt-1">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold mb-3">Lead Conversion Funnel</div>
        <div className="space-y-4">
          {stages.map((s) => (
            <div key={s.key}>
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                <div>{s.key}</div>
                <div>{s.value}</div>
              </div>
              <div className="h-3 rounded-full bg-slate-100 border">
                <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, s.percent)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 md:col-span-2">
          <div className="text-sm font-semibold mb-3">Conversion Insights</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 bg-emerald-50 border-emerald-200">
              <div className="text-sm font-medium text-emerald-800">Top Performer</div>
              <div className="text-xs text-emerald-700 mt-1">Lead to Contact conversion increased by 15% this month</div>
            </div>
            <div className="rounded-lg border p-3 bg-amber-50 border-amber-200">
              <div className="text-sm font-medium text-amber-800">Needs Attention</div>
              <div className="text-xs text-amber-700 mt-1">Appointment booking rate below target by 8%</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="text-sm font-semibold mb-3">Stage Performance</div>
          <div className="text-xs text-slate-600 space-y-2">
            <div className="flex items-center justify-between"><span>Lead Quality Score</span><span>8.4/10</span></div>
            <div className="flex items-center justify-between"><span>Avg. Time in Funnel</span><span>12.3 days</span></div>
            <div className="flex items-center justify-between"><span>Best Converting Source</span><span>Referrals</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}