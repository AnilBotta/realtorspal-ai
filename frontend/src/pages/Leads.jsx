import React, { useEffect, useMemo, useState } from "react";
import { getLeads, createLead, updateLead, deleteLead } from "../api";
import AddLeadModal from "../components/AddLeadModal";
import LeadDrawer from "../components/LeadDrawer";

const STAGES = ["New", "Contacted", "Appointment", "Onboarded", "Closed"];
const PRIORITIES = ["high", "medium", "low"];

export default function Leads({ user }){
  const [leads, setLeads] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

  // Search & Filters
  const [query, setQuery] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    stages: new Set(),
    dashboard: "all", // all | yes | no
    priority: new Set(),
    property_type: "",
    neighborhood: "",
    budget_min: "",
    budget_max: "",
  });

  useEffect(() => {
    async function load(){
      const { data } = await getLeads(user.id);
      setLeads(data);
    }
    load();
  }, [user.id]);

  const onCreate = async (payload) => {
    try{
      const { data } = await createLead({ user_id: user.id, in_dashboard: false, ...payload });
      setLeads(prev => [data, ...prev]);
      setOpenAdd(false);
    }catch(err){
      alert(err?.response?.data?.detail || 'Failed to create lead');
    }
  };

  const onSave = async (payload) => {
    try{
      const { data } = await updateLead(activeLead.id, payload);
      setLeads(arr => arr.map(l => l.id === data.id ? data : l));
      setActiveLead(data);
      setOpenDrawer(false);
    }catch(err){ alert(err?.response?.data?.detail || 'Failed to update lead'); }
  };

  const onDeleteLead = async (leadId) => {
    try{
      await deleteLead(leadId);
      setLeads(arr => arr.filter(l => l.id !== leadId));
      setOpenDrawer(false);
      setActiveLead(null);
    }catch(err){ alert(err?.response?.data?.detail || 'Failed to delete lead'); }
  };

  const addToDashboard = async (lead) => {
    try{
      const { data } = await updateLead(lead.id, { in_dashboard: true, stage: 'New' });
      setLeads(arr => arr.map(l => l.id === data.id ? data : l));
      alert('Added to dashboard');
    }catch(err){ alert(err?.response?.data?.detail || 'Failed to add to dashboard'); }
  };

  // Base rows
  const rows = useMemo(() => leads.map(l => ({
    id: l.id,
    name: `${l.first_name||''} ${l.last_name||''}`.trim() || l.name || 'Lead',
    email: l.email || '-',
    phone: l.phone || '-',
    property_type: l.property_type || '-',
    neighborhood: l.neighborhood || '-',
    budget_min: l.price_min ?? null,
    budget_max: l.price_max ?? null,
    budget: l.price_min && l.price_max ? `$ ${Math.round(l.price_min/1000)}K - $ ${Math.round(l.price_max/1000)}K` : '-',
    priority: l.priority || '-',
    tags: Array.isArray(l.source_tags) ? l.source_tags.join(', ') : (l.source_tags || '-'),
    stage: l.stage,
    in_dashboard: l.in_dashboard !== false,
    raw: l,
  })), [leads]);

  // Search across all visible string fields
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = rows;

    if (q) {
      data = data.filter(r => {
        const bucket = [
          r.name, r.email, r.phone, r.property_type, r.neighborhood,
          r.budget, r.priority, r.tags, r.stage, r.id
        ].join(' ').toLowerCase();
        return bucket.includes(q);
      });
    }

    // Apply filters
    data = data.filter(r => {
      // Stage
      if (filters.stages.size && !filters.stages.has(r.stage)) return false;
      // Dashboard
      if (filters.dashboard === 'yes' && !r.in_dashboard) return false;
      if (filters.dashboard === 'no' && r.in_dashboard) return false;
      // Priority
      if (filters.priority.size && !filters.priority.has((r.priority||'').toLowerCase())) return false;
      // Property type
      if (filters.property_type && r.property_type !== filters.property_type) return false;
      // Neighborhood
      if (filters.neighborhood && r.neighborhood !== filters.neighborhood) return false;
      // Budget min/max (numeric)
      const bmin = filters.budget_min !== '' ? parseInt(filters.budget_min, 10) : null;
      const bmax = filters.budget_max !== '' ? parseInt(filters.budget_max, 10) : null;
      if (bmin !== null && (r.budget_min === null || r.budget_min < bmin)) return false;
      if (bmax !== null && (r.budget_max === null || r.budget_max > bmax)) return false;
      return true;
    });

    return data;
  }, [rows, query, filters]);

  // Distinct lists for dropdowns
  const propertyTypes = useMemo(() => Array.from(new Set(leads.map(l => l.property_type).filter(Boolean))).sort(), [leads]);
  const neighborhoods = useMemo(() => Array.from(new Set(leads.map(l => l.neighborhood).filter(Boolean))).sort(), [leads]);

  const toggleSet = (s, val) => {
    const next = new Set(Array.from(s));
    if (next.has(val)) next.delete(val); else next.add(val);
    return next;
  };

  const clearFilters = () => setFilters({
    stages: new Set(),
    dashboard: 'all',
    priority: new Set(),
    property_type: '',
    neighborhood: '',
    budget_min: '',
    budget_max: '',
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between relative">
        <div className="text-lg font-semibold">Leads</div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <input
            className="px-3 py-2 rounded-lg border text-sm w-56"
            placeholder="Search leads..."
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
          />
          {/* Filters button */}
          <button onClick={()=>setFiltersOpen(v=>!v)} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Filters</button>
          <button onClick={()=>setOpenAdd(true)} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Add Lead</button>

          {/* Filters panel */}
          {filtersOpen && (
            <div className="absolute right-0 top-12 z-20 w-[680px] bg-white border rounded-xl shadow-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="text-slate-600 mb-1">Stage</div>
                  <div className="flex flex-wrap gap-2">
                    {STAGES.map(s => (
                      <button key={s} onClick={()=>setFilters(f=>({...f, stages: toggleSet(f.stages, s)}))} className={`px-2 py-1 rounded border text-xs ${filters.stages.has(s)?'bg-emerald-50 border-emerald-300 text-emerald-700':'hover:bg-slate-50'}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Dashboard</div>
                  <select className="w-full px-2 py-1 rounded border" value={filters.dashboard} onChange={(e)=>setFilters(f=>({...f, dashboard: e.target.value}))}>
                    <option value="all">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Priority</div>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map(p => (
                      <button key={p} onClick={()=>setFilters(f=>({...f, priority: toggleSet(f.priority, p)}))} className={`px-2 py-1 rounded border text-xs ${filters.priority.has(p)?'bg-emerald-50 border-emerald-300 text-emerald-700':'hover:bg-slate-50'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Property Type</div>
                  <select className="w-full px-2 py-1 rounded border" value={filters.property_type} onChange={(e)=>setFilters(f=>({...f, property_type: e.target.value}))}>
                    <option value="">All</option>
                    {propertyTypes.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Location</div>
                  <select className="w-full px-2 py-1 rounded border" value={filters.neighborhood} onChange={(e)=>setFilters(f=>({...f, neighborhood: e.target.value}))}>
                    <option value="">All</option>
                    {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <div className="text-slate-600 mb-1">Budget (min / max)</div>
                  <div className="flex items-center gap-2">
                    <input className="w-full px-2 py-1 rounded border" type="number" placeholder="Min" value={filters.budget_min} onChange={(e)=>setFilters(f=>({...f, budget_min: e.target.value}))} />
                    <input className="w-full px-2 py-1 rounded border" type="number" placeholder="Max" value={filters.budget_max} onChange={(e)=>setFilters(f=>({...f, budget_max: e.target.value}))} />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end gap-2">
                <button onClick={clearFilters} className="px-3 py-2 rounded-lg border text-sm">Clear</button>
                <button onClick={()=>setFiltersOpen(false)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm">Apply</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead list table */}
      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Property Type</th>
              <th className="text-left p-3">Location</th>
              <th className="text-left p-3">Budget</th>
              <th className="text-left p-3">Priority</th>
              <th className="text-left p-3">Tags</th>
              <th className="text-left p-3">Stage</th>
              <th className="text-left p-3">Dashboard</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3 font-medium text-slate-800 cursor-pointer" onClick={()=>{setActiveLead(r.raw); setOpenDrawer(true);}}>{r.name}</td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.phone}</td>
                <td className="p-3">{r.property_type}</td>
                <td className="p-3">{r.neighborhood}</td>
                <td className="p-3">{r.budget}</td>
                <td className="p-3">{r.priority}</td>
                <td className="p-3">{r.tags}</td>
                <td className="p-3">{r.stage}</td>
                <td className="p-3">{r.in_dashboard ? 'Yes' : 'No'}</td>
                <td className="p-3 text-right">
                  {!r.in_dashboard && (
                    <button onClick={()=>addToDashboard(r.raw)} className="px-2 py-1 rounded border text-xs mr-2">Add to Dashboard</button>
                  )}
                  <button onClick={()=>{setActiveLead(r.raw); setOpenDrawer(true);}} className="px-2 py-1 rounded border text-xs mr-2">Edit</button>
                  <button onClick={()=>onDeleteLead(r.id)} className="px-2 py-1 rounded border text-xs text-rose-700">Delete</button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr><td className="p-6 text-center text-slate-500" colSpan={11}>No leads found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddLeadModal open={openAdd} onClose={()=>setOpenAdd(false)} onCreate={onCreate} />
      <LeadDrawer open={openDrawer} lead={activeLead} onClose={()=>setOpenDrawer(false)} onSave={onSave} onDelete={onDeleteLead} />
    </div>
  );
}