import React, { useEffect, useMemo, useState } from "react";
import { getLeads, createLead, updateLeadStage } from "../api";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { DollarSign, MapPin, Calendar, Phone, Mail, MessageSquare } from "lucide-react";
import dayjs from "dayjs";

const STAGES = ["New", "Contacted", "Appointment", "Onboarded", "Closed"];

function DroppableColumn({ id, title, count, children }){
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}`, data: { columnId: id } });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-3 border border-dashed ${id==='New'?'bg-rose-50/40':'bg-white'} ${id==='Contacted'?'bg-amber-50/40':''} ${id==='Onboarded'?'bg-emerald-50/40':''} ${isOver?'ring-2 ring-emerald-300':''}`}
    >
      <div className="text-sm font-medium mb-2 text-slate-700 flex items-center justify-between">
        <span>{title}</span>
        <span className="text-slate-400">{count}</span>
      </div>
      <div className="space-y-3 min-h-[96px]">
        {children}
      </div>
      <div className="h-1" />
    </div>
  );
}

function formatCurrencyRange(min, max){
  if (!min || !max) return "$ - $";
  const toK = (v) => `${Math.round(v/1000)}K`;
  return `$ ${toK(min)} - $ ${toK(max)}`;
}

function initialsFromName(name=''){
  return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
}

function PriorityChip({ level }){
  const map = {
    high: "bg-rose-50 text-rose-700",
    medium: "bg-amber-50 text-amber-700",
    low: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[level] || 'bg-slate-50 text-slate-700'}`}>{level || 'low'}</span>;
}

function displayName(lead){
  const composed = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
  return composed || lead.name || 'Lead';
}

function LeadCard({ lead }){
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `lead-${lead.id}`, data: { leadId: lead.id } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  const stage = lead.stage || 'New';
  const propertyType = lead.property_type || (stage === 'Contacted' ? 'Townhouse' : '3BR Condo');
  const neighborhood = lead.neighborhood || (stage === 'Contacted' ? 'Suburbs' : 'Downtown');
  const priceMin = lead.price_min ?? (stage === 'Contacted' ? 700000 : 400000);
  const priceMax = lead.price_max ?? (stage === 'Contacted' ? 900000 : 500000);
  const createdAt = lead.created_at || dayjs().format('M/D/YYYY');
  const priority = (lead.priority || (stage === 'New' ? 'high' : stage === 'Contacted' ? 'medium' : 'low')).toLowerCase();
  const tags = lead.source_tags || (stage === 'Contacted' ? ["Referral","Lead Generator AI"] : ["Website","Lead Generator AI"]);

  const nameToShow = displayName(lead);

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`bg-white rounded-2xl border p-3 shadow-sm ${isDragging ? 'opacity-70 ring-2 ring-emerald-300' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-medium">
            {initialsFromName(nameToShow)}
          </div>
          <div>
            <div className="font-semibold text-slate-800 leading-none">{nameToShow}</div>
            <div className="text-xs text-slate-500 mt-1">{propertyType} - {neighborhood}</div>
          </div>
        </div>
        <PriorityChip level={priority} />
      </div>

      {/* Details */}
      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-2"><DollarSign size={14} className="text-slate-400"/> {formatCurrencyRange(priceMin, priceMax)}</div>
        <div className="flex items-center gap-2"><MapPin size={14} className="text-slate-400"/> {neighborhood}</div>
        <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-400"/> Created: {createdAt}</div>
      </div>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-2">
        {tags.map(t => (
          <span key={t} className="text-[11px] px-2 py-1 rounded-md border bg-slate-50 text-slate-700">{t}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-2 text-xs">
        <button className="px-2 py-1 rounded border flex items-center gap-1"><Phone size={14}/> Call</button>
        <button className="px-2 py-1 rounded border flex items-center gap-1"><Mail size={14}/> Email</button>
        <button className="px-2 py-1 rounded border flex items-center gap-1"><MessageSquare size={14}/> SMS</button>
      </div>
    </div>
  );
}

export default function Leads({ user }){
  const [leads, setLeads] = useState([]);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

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
    const name = prompt("Lead name or First Last");
    if (!name) return;
    // If the user enters "First Last", split to first_name/last_name
    const parts = name.trim().split(" ");
    let payload = { user_id: user.id };
    if (parts.length >= 2){
      payload.first_name = parts[0];
      payload.last_name = parts.slice(1).join(" ");
    } else {
      payload.name = name;
    }
    const { data } = await createLead(payload);
    setLeads(prev => [...prev, data]);
  };

  const moveLeadTo = async (leadId, targetStage) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage === targetStage) return;
    const { data } = await updateLeadStage(leadId, targetStage);
    setLeads(arr => arr.map(l => l.id === data.id ? data : l));
  };

  const onDragEnd = async (event) => {
    const { active, over } = event;
    if (!over) return;
    if (String(over.id).startsWith('col-')){
      const columnId = String(over.id).replace('col-','');
      const leadId = String(active.id).replace('lead-','');
      await moveLeadTo(leadId, columnId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Lead Pipeline</div>
        <div className="flex items-center gap-2">
          <button onClick={addLead} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 text-sm">Add Lead</button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {STAGES.map(col => (
            <DroppableColumn key={col} id={col} title={col} count={grouped[col].length}>
              {grouped[col].map(l => (
                <LeadCard key={l.id} lead={l} />
              ))}
            </DroppableColumn>
          ))}
        </div>
      </DndContext>
    </div>
  );
}