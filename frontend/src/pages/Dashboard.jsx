import React, { useEffect, useMemo, useState } from "react";
import { getLeads, getDashboardAnalytics, createLead, updateLeadStage } from "../api";
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { DollarSign, MapPin, Calendar, Phone, Mail, MessageSquare, GripVertical } from "lucide-react";
import dayjs from "dayjs";
import AddLeadModal from "../components/AddLeadModal";
import LeadDrawer from "../components/LeadDrawer";
import CommunicationModal from "../components/CommunicationModal";
import EmailModal from "../components/EmailModal";

function Stat({ label, value, hint }){
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-semibold text-slate-800 mt-1">{value}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

const STAGES = ["Prospecting", "Engagement", "Active", "Closing", "Closed"];

// Map pipeline statuses to Kanban categories
const getPipelineStageMapping = (pipeline) => {
  const mapping = {
    // Prospecting category
    'Not set': 'Prospecting',
    'New Lead': 'Prospecting', 
    'Tried to contact': 'Prospecting',
    
    // Engagement category
    'not responsive': 'Engagement',
    'made contact': 'Engagement',
    'cold/not ready': 'Engagement',
    
    // Active category
    'warm / nurturing': 'Active',
    'Hot/ Ready': 'Active',
    'set meeting': 'Active',
    
    // Closing category
    'signed agreement': 'Closing',
    'showing': 'Closing',
    
    // Closed category
    'sold': 'Closed',
    'past client': 'Closed',
    'sphere of influence': 'Closed',
    'archive': 'Closed',
  };
  
  return mapping[pipeline] || 'Prospecting';
};

function DroppableColumn({ id, title, count, children }){
  const { setNodeRef, isOver } = useDroppable({ id: `col-${id}`, data: { columnId: id } });
  
  // Define colors for each stage to match the design
  const getColumnColors = (stageId) => {
    switch(stageId) {
      case 'Prospecting':
        return 'bg-blue-50 border-blue-200';
      case 'Engagement': 
        return 'bg-yellow-50 border-yellow-200';
      case 'Active':
        return 'bg-purple-50 border-purple-200';
      case 'Closing':
        return 'bg-green-50 border-green-200';
      case 'Closed':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Map stage names to better display names
  const getDisplayTitle = (stageId) => {
    switch(stageId) {
      case 'Prospecting':
        return 'Prospecting';
      case 'Engagement':
        return 'Engagement';
      case 'Active':
        return 'Active';
      case 'Closing':
        return 'Closing';
      case 'Closed':
        return 'Closed';
      default:
        return stageId;
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-3 border border-dashed ${getColumnColors(id)} ${isOver?'ring-2 ring-emerald-300':''}`}
    >
      <div className="text-sm font-medium mb-2 text-slate-700 flex items-center justify-between">
        <span>{getDisplayTitle(id)} <span className="text-slate-400">({count})</span></span>
      </div>
      <div className="space-y-3 min-h-[96px]">
        {children}
      </div>
      <div className="h-1" />
    </div>
  );
}

function initialsFromName(name=''){
  return name.split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
}

function PriorityChip({ level }){
  const map = { high: "bg-rose-50 text-rose-700", medium: "bg-amber-50 text-amber-700", low: "bg-emerald-50 text-emerald-700" };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[level] || 'bg-slate-50 text-slate-700'}`}>{level || 'low'}</span>;
}

function displayName(lead){
  const composed = `${lead.first_name || ''} ${lead.last_name || ''}`.trim();
  return composed || lead.name || 'Lead';
}

function LeadCard({ lead, onOpen, onCommunicate, dragHandle }){
  const nameToShow = displayName(lead);
  const stage = lead.stage || 'New';
  const propertyType = lead.property_type || (stage === 'Contacted' ? 'Townhouse' : '3BR Condo');
  const neighborhood = lead.neighborhood || (stage === 'Contacted' ? 'Suburbs' : 'Downtown');
  const priceMin = lead.price_min ?? (stage === 'Contacted' ? 700000 : 400000);
  const priceMax = lead.price_max ?? (stage === 'Contacted' ? 900000 : 500000);
  const createdAt = lead.created_at || dayjs().format('M/D/YYYY');
  const priority = (lead.priority || (stage === 'New' ? 'high' : stage === 'Contacted' ? 'medium' : 'low')).toLowerCase();
  const tags = lead.source_tags || (stage === 'Contacted' ? ["Referral","Lead Generator AI"] : ["Website","Lead Generator AI"]);

  return (
    <div className={`bg-white rounded-2xl border p-3 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onOpen(lead)}>
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-medium">
            {initialsFromName(nameToShow)}
          </div>
          <div>
            <div className="font-semibold text-slate-800 leading-none">{nameToShow}</div>
            <div className="text-xs text-slate-500 mt-1">{propertyType} - {neighborhood}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PriorityChip level={priority} />
          <div className="text-slate-400">{dragHandle}</div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1"><DollarSign size={12}/> ${priceMin?.toLocaleString()} - ${priceMax?.toLocaleString()}</div>
        <div className="flex items-center gap-1"><MapPin size={12}/> {neighborhood}</div>
        <div className="flex items-center gap-1"><Calendar size={12}/> {createdAt}</div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {tags.slice(0,2).map((tag,idx) => (
            <span key={idx} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{tag}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs">
        <button 
          className="px-2 py-1 rounded border flex items-center gap-1 hover:bg-blue-50 hover:border-blue-200" 
          onClick={(e) => { e.stopPropagation(); onCommunicate(lead, 'call'); }}
        >
          <Phone size={14}/> Call
        </button>
        <button 
          className="px-2 py-1 rounded border flex items-center gap-1 hover:bg-blue-50 hover:border-blue-200" 
          onClick={(e) => { e.stopPropagation(); onCommunicate(lead, 'email'); }}
        >
          <Mail size={14}/> Email
        </button>
        <button 
          className="px-2 py-1 rounded border flex items-center gap-1 hover:bg-green-50 hover:border-green-200" 
          onClick={(e) => { e.stopPropagation(); onCommunicate(lead, 'sms'); }}
        >
          <MessageSquare size={14}/> SMS
        </button>
      </div>
    </div>
  );
}

function DraggableLeadCard({ lead, onOpen, onCommunicate }){
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `lead-${lead.id}`, data: { leadId: lead.id } });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-70 ring-2 ring-emerald-300' : ''}`}>
      <LeadCard lead={lead} onOpen={onOpen} onCommunicate={onCommunicate} dragHandle={<div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing"><GripVertical size={16}/></div>} />
    </div>
  );
}

export default function Dashboard({ user }){
  const [stats, setStats] = useState({ total_leads: 0, by_stage: {} });
  const [leads, setLeads] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [openComm, setOpenComm] = useState(false);
  const [commType, setCommType] = useState('call'); // 'call', 'sms', 'whatsapp'
  const [commLead, setCommLead] = useState(null);
  const [openEmail, setOpenEmail] = useState(false);
  const [emailLead, setEmailLead] = useState(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    async function load(){
      const [a, l] = await Promise.all([
        getDashboardAnalytics(user.id),
        getLeads(user.id)
      ]);
      setStats(a.data);
      // only show leads where in_dashboard !== false (i.e., true or undefined)
      setLeads(l.data.filter(x => x.in_dashboard !== false));
    }
    load();
  }, [user.id]);

  const grouped = useMemo(() => {
    const m = Object.fromEntries(STAGES.map(s => [s, []]));
    for (const l of leads) {
      // Map pipeline to stage category, fallback to existing stage if no pipeline
      const mappedStage = l.pipeline ? getPipelineStageMapping(l.pipeline) : (l.stage || 'Prospecting');
      if (m[mappedStage]) {
        m[mappedStage].push(l);
      } else {
        // Fallback to Prospecting for unknown stages
        m['Prospecting'].push(l);
      }
    }
    return m;
  }, [leads]);

  const addLead = () => setOpenAdd(true);
  const onCreate = async (payload) => {
    try{
      // Dashboard add -> ensure it appears in dashboard
      const { data } = await createLead({ user_id: user.id, in_dashboard: true, ...payload });
      setLeads(prev => [...prev, data]);
      setOpenAdd(false);
    }catch(err){ alert(err?.response?.data?.detail || 'Failed to create lead'); }
  };

  const onImported = (inserted) => {
    if (Array.isArray(inserted) && inserted.length) {
      setLeads(prev => [...inserted, ...prev]);
    }
  };

  const handleCommunication = (lead, type) => {
    if (type === 'email') {
      setEmailLead(lead);
      setOpenEmail(true);
    } else {
      setCommLead(lead);
      setCommType(type);
      setOpenComm(true);
    }
  };

  const closeCommunication = () => {
    setOpenComm(false);
    setCommLead(null);
    setCommType('call');
  };

  const closeEmail = () => {
    setOpenEmail(false);
    setEmailLead(null);
  };

  const openDetails = (lead) => { setActiveLead(lead); setOpenDrawer(true); };

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
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Stat label="Total Leads" value={stats.total_leads} />
        <Stat label="Active Conversations" value={1} />
        <Stat label="Appointments Scheduled" value={0} />
        <Stat label="Conversion Rate" value={`${((stats.by_stage.Closed||0)/(stats.total_leads||1)*100).toFixed(0)}%`} />
        <Stat label="Revenue Generated" value={`$0`} />
        <Stat label="Response Time" value={`3 min`} />
      </div>

      {/* Lead Pipeline */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm font-semibold mb-3">Lead Pipeline</div>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STAGES.map(col => (
              <DroppableColumn key={col} id={col} title={col} count={grouped[col].length}>
                {grouped[col].map(l => (
                  <DraggableLeadCard key={l.id} lead={l} onOpen={openDetails} onCommunicate={handleCommunication} />
                ))}
                <button onClick={addLead} className="w-full mt-3 text-xs px-2 py-1 rounded-lg border border-dashed text-slate-500 hover:bg-slate-50">+ Add Lead</button>
              </DroppableColumn>
            ))}
          </div>
        </DndContext>
      </div>

      <AddLeadModal open={openAdd} onClose={()=>setOpenAdd(false)} onCreate={onCreate} />
      <LeadDrawer open={openDrawer} lead={activeLead} onClose={()=>setOpenDrawer(false)} onSave={()=>{}} onDelete={()=>{}} />
      <CommunicationModal open={openComm} lead={commLead} type={commType} onClose={closeCommunication} user={user} />
      <EmailModal open={openEmail} lead={emailLead} onClose={closeEmail} user={user} />
    </div>
  );
}