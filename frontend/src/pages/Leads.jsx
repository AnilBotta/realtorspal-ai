import React, { useEffect, useMemo, useState } from "react";
import { getLeads, createLead, updateLeadStage } from "../api";

const STAGES = ["New", "Contacted", "Appointment", "Onboarded", "Closed"];

function LeadCard({ lead, onMove }){
  return (
    <div className="bg-white rounded-xl border p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-medium text-slate-800">{lead.name}</div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${lead.stage === 'New' ? 'bg-rose-50 text-rose-700' : lead.stage === 'Contacted' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{lead.stage}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {STAGES.map(s => (
          <button key={s} onClick={() => onMove(lead, s)} className={`text-xs px-2 py-1 rounded border ${s===lead.stage?'bg-emerald-600 text-white border-emerald-600':'hover:bg-slate-50'}`}>{s}</button>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs">
        <button className="px-2 py-1 rounded border">Call</button>
        <button className="px-2 py-1 rounded border">Email</button>
        <button className="px-2 py-1 rounded border">SMS</button>
      </div>
    </div>
  );
}

export default function Leads({ user }){
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    async function load(){
      const { data } = await getLeads(user.id);
      setLeads(data);
    }
    load();
  }, [user.id]);

  const grouped = useMemo(() => {
    const m = Object.fromEntries(STAGES.map(s => [s, []]));
    for (const l of leads) m[l.stage]?.push(l);
    return m;
  }, [leads]);

  const addLead = async () => {
    const name = prompt("Lead name");
    if (!name) return;
    const { data } = await createLead({ user_id: user.id, name });
    setLeads(prev => [...prev, data]);
  };

  const move = async (lead, stage) => {
    if (lead.stage === stage) return;
    const { data } = await updateLeadStage(lead.id, stage);
    setLeads(arr => arr.map(l => l.id === data.id ? data : l));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Lead Pipeline</div>
        <div className="flex items-center gap-2">
          <button onClick={addLead} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Add Lead</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map(col => (
          <div key={col} className={`rounded-xl p-3 border ${col==='New'?'bg-rose-50/40':'bg-white'} ${col==='Contacted'?'bg-amber-50/40':''} ${col==='Onboarded'?'bg-emerald-50/40':''}`}>
            <div className="text-sm font-medium mb-2 text-slate-700 flex items-center justify-between">
              <span>{col}</span>
              <span className="text-slate-400">{grouped[col].length}</span>
            </div>
            <div className="space-y-3">
              {grouped[col].map(l => (
                <LeadCard key={l.id} lead={l} onMove={move} />
              ))}
            </div>
            <button onClick={addLead} className="w-full mt-3 text-xs px-2 py-1 rounded-lg border border-dashed text-slate-500 hover:bg-slate-50">+ Add Lead</button>
          </div>
        ))}
      </div>
    </div>
  );
}