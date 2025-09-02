import React, { useState } from "react";

export default function DataPage(){
  const [history] = useState([
    { name: "leads_batch_1.csv", total: 1250, success: 1187, errors: 63, status: "completed" },
    { name: "facebook_leads.xlsx", total: 834, success: 398, errors: 27, status: "processing", progress: 425 },
  ]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border p-4">
        <div className="text-lg font-semibold">Import & Export</div>
        <div className="text-sm text-slate-500">Manage data import, export, and CRM integrations</div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="rounded-xl border border-dashed bg-slate-50 p-6 text-center text-slate-500">
              <div className="text-sm">Click to upload or drag and drop</div>
              <div className="text-xs mt-1">Supports CSV, Excel, TSV up to 50MB</div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Preview</button>
              <button className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-sm">Start Import</button>
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium mb-2">Import History</div>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.name} className="rounded-xl border bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-slate-700">{h.name}</div>
                        <div className="text-xs text-slate-500">Total Records {h.total} • Successful {h.success} • Errors {h.errors}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${h.status==='completed'?'bg-emerald-50 text-emerald-700':'bg-amber-50 text-amber-700'}`}>{h.status}</span>
                    </div>
                    {h.progress && (
                      <div className="mt-2 h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (h.progress/h.total)*100)}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <div className="rounded-xl border bg-white p-3">
              <div className="text-sm font-medium mb-2">Import Settings</div>
              <div className="grid gap-3 text-sm">
                <div className="flex items-center justify-between"><span>Data Source</span><select className="border rounded px-2 py-1 text-sm"><option>Manual Upload</option></select></div>
                <div className="flex items-center justify-between"><span>Skip Duplicates</span><input type="checkbox" defaultChecked/></div>
                <div className="flex items-center justify-between"><span>Auto-assign Agent</span><input type="checkbox"/></div>
                <div className="flex items-center justify-between"><span>Send Welcome Email</span><input type="checkbox"/></div>
                <div className="flex items-center justify-between"><span>Default Lead Stage</span><select className="border rounded px-2 py-1 text-sm"><option>New Leads</option></select></div>
              </div>
            </div>
            <div className="rounded-xl border bg-white p-3 mt-4">
              <div className="text-sm font-medium mb-2">Quick Stats</div>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between"><span>Total Imports</span><span>47</span></div>
                <div className="flex items-center justify-between"><span>Records Imported</span><span>12,847</span></div>
                <div className="flex items-center justify-between"><span>Success Rate</span><span>94.2%</span></div>
                <div className="flex items-center justify-between"><span>Last Import</span><span>2 hours ago</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}