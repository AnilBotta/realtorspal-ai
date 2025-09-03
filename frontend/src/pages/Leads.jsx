import React, { useEffect, useMemo, useState } from "react";
import { getLeads, createLead, updateLeadStage } from "../api";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";

const STAGES = ["New", "Contacted", "Appointment", "Onboarded", "Closed"];

function DroppableColumn({ id, title, count, children }){
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}`, data: { columnId: id } });
  return (
    <div ref={setNodeRef} className={`rounded-xl p-3 border ${id==='New'?'bg-rose-50/40':'bg-white'} ${id==='Contacted'?'bg-amber-50/40':''} ${id==='Onboarded'?'bg-emerald-50/40':''} ${isOver?'ring-2 ring-emerald-300':''}`}>
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

function LeadCard({ lead }){
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `lead-${lead.id}`, data: { leadId: lead.id } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={`bg-white rounded-xl border p-3 shadow-sm ${isDragging ? 'opacity-70 ring-2 ring-emerald-300' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="font-medium text-slate-800">{lead.name}</div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${lead.stage === 'New' ? 'bg-rose-50 text-rose-700' : lead.stage === 'Contacted' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{lead.stage}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500">ID: {lead.id.slice(0,8)}</div>
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
    const name = prompt("Lead name");
    if (!name) return;
    const { data } = await createLead({ user_id: user.id, name });
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
    // If dropped over a column, parse its id
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