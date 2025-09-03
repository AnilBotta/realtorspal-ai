import React, { useEffect, useMemo, useState } from "react";
import { getLeads, createLead, updateLead, deleteLead } from "../api";
import AddLeadModal from "../components/AddLeadModal";
import LeadDrawer from "../components/LeadDrawer";

export default function Leads({ user }){
  const [leads, setLeads] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeLead, setActiveLead] = useState(null);

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

  const rows = useMemo(() => leads.map(l => ({
    id: l.id,
    name: `${l.first_name||''} ${l.last_name||''}`.trim() || l.name || 'Lead',
    email: l.email || '-',
    phone: l.phone || '-',
    property_type: l.property_type || '-',
    neighborhood: l.neighborhood || '-',
    budget: l.price_min && l.price_max ? `$ ${Math.round(l.price_min/1000)}K - $ ${Math.round(l.price_max/1000)}K` : '-',
    priority: l.priority || '-',
    tags: Array.isArray(l.source_tags) ? l.source_tags.join(', ') : (l.source_tags || '-'),
    stage: l.stage,
    in_dashboard: l.in_dashboard !== false,
    raw: l,
  })), [leads]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Leads</div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setOpenAdd(true)} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Add Lead</button>
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
            {rows.map((r) => (
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
            {rows.length === 0 && (
              <tr><td className="p-6 text-center text-slate-500" colSpan={11}>No leads yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <AddLeadModal open={openAdd} onClose={()=>setOpenAdd(false)} onCreate={onCreate} />
      <LeadDrawer open={openDrawer} lead={activeLead} onClose={()=>setOpenDrawer(false)} onSave={onSave} onDelete={onDeleteLead} />
    </div>
  );
}