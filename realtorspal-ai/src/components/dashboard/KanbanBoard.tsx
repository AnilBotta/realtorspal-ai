"use client"

import React, { useMemo, useState, useCallback, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { VoiceCall } from "../voice/VoiceCall"
import { AddLeadForm } from "../leads/AddLeadForm"
import { useToast } from "@/hooks/use-toast"
import { useLeads } from "@/hooks/useLeads"
import type { Lead } from "@/lib/api"
import {
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Plus,
  Filter,
  PhoneCall,
  Loader2,
  RefreshCw
} from "lucide-react"

// dnd-kit
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  Over,
  closestCorners,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"

type Stage = "new" | "contacted" | "appointment" | "onboarded" | "closed"
const STAGES: Stage[] = ["new", "contacted", "appointment", "onboarded", "closed"]

interface KanbanBoardProps {
  expanded?: boolean
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "bg-red-100 text-red-700 border-red-200"
    case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200"
    case "low": return "bg-green-100 text-green-700 border-green-200"
    default: return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

function getSourceColor(source: string) {
  return source === "Manual Entry"
    ? "bg-purple-100 text-purple-700 border-purple-200"
    : "bg-blue-50 text-blue-700 border-blue-200"
}

/* ---------- Lead Card (visual only) ---------- */
function LeadCard({ lead, dragging = false }: { lead: Lead; dragging?: boolean }) {
  return (
    <Card className={`w-full mb-3 hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing border-slate-200/50 bg-white/90 backdrop-blur-sm ${dragging ? "opacity-70" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">
                {lead.name.split(" ").map(n => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm font-semibold">{lead.name}</CardTitle>
              <CardDescription className="text-xs">{lead.property_interest}</CardDescription>
            </div>
          </div>
          <Badge className={`text-xs px-2 py-1 ${getPriorityColor(lead.priority)}`}>
            {lead.priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <DollarSign className="w-3 h-3" />
          <span>{lead.budget_range}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <MapPin className="w-3 h-3" />
          <span>{lead.location}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          <span>Created: {new Date(lead.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`text-xs ${getSourceColor(lead.source)}`}>
            {lead.source}
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Lead Generator AI
          </Badge>
        </div>

        {/* Action buttons: stop mousedown bubbling so clicks don't start a drag */}
        <div className="flex gap-1 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs hover:bg-green-50 hover:border-green-300"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {/* wire in call modal from parent if desired */}}
          >
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs hover:bg-blue-50 hover:border-blue-300"
            onMouseDown={(e) => e.stopPropagation()}
          >
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs hover:bg-purple-50 hover:border-purple-300"
            onMouseDown={(e) => e.stopPropagation()}
          >
            SMS
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

/* ---------- Sortable item wrapper ---------- */
function SortableLead({ lead }: { lead: Lead }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { type: "lead", lead }
  })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none", // help dragging on browsers/touchpads
    width: "100%",
  }
  return (
    <div ref={setNodeRef} style={style} className="w-full" {...attributes} {...listeners}>
      <LeadCard lead={lead} dragging={isDragging} />
    </div>
  )
}

/* ---------- Droppable column ---------- */
function DroppableColumn({
  id,
  children,
  className,
}: {
  id: Stage
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "column", stage: id }
  })
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ""} ${isOver ? "ring-2 ring-blue-300" : ""}`}
    >
      {children}
    </div>
  )
}

export function KanbanBoard({ expanded = false }: KanbanBoardProps) {
  const [activeCall, setActiveCall] = useState<Lead | null>(null)
  const [showAddLeadForm, setShowAddLeadForm] = useState(false)
  const { toast } = useToast()
  const { leads, isLoading, error, addLead, updateLeadStage, refetch } = useLeads()

  // derive columns from hook
  const initial = useMemo(() => ({
    new: leads.new ?? [],
    contacted: leads.contacted ?? [],
    appointment: leads.appointment ?? [],
    onboarded: leads.onboarded ?? [],
    closed: leads.closed ?? [],
  }), [leads])

  const [columns, setColumns] = useState(initial)

  useEffect(() => {
    setColumns(initial)
  }, [initial])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleAddLead = async (newLeadData: Omit<Lead, "id" | "created_at" | "updated_at">) => {
    const ok = await addLead(newLeadData)
    toast({
      title: ok ? "Lead Added Successfully" : "Failed to Add Lead",
      description: ok ? `${newLeadData.name} has been added to your lead pipeline` : "There was an error adding the lead.",
      variant: ok ? "default" : "destructive"
    })
  }

  const findStageByLeadId = useCallback((id: string): Stage | null => {
    for (const s of STAGES) {
      if (columns[s].some(l => l.id === id)) return s
    }
    return null
  }, [columns])

  const toStageFromOver = (over: Over | null): Stage | null => {
    if (!over) return null
    // Case 1: over a column droppable
    const d = over.data?.current
    if (d && typeof d === "object" && "stage" in d) {
      const st = (d as { stage: Stage }).stage
      return STAGES.includes(st) ? st : null
    }
    // Case 2: over another lead -> map that lead's id to its column
    const overId = String(over.id)
    const stageFromItem = findStageByLeadId(overId)
    if (stageFromItem) return stageFromItem
    // Case 3: over id equals a stage (rare)
    if (STAGES.includes(overId as Stage)) return overId as Stage
    return null
  }

  const onDragStart = (event: DragStartEvent) => {
    // optional overlay could be set here
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!active?.id) return

    const fromStage = findStageByLeadId(String(active.id))
    const toStage = toStageFromOver(over)

    if (!fromStage || !toStage || fromStage === toStage) return

    // optimistic move locally
    setColumns(prev => {
      const fromItems = [...prev[fromStage]]
      const toItems = [...prev[toStage]]
      const moving = fromItems.find(l => l.id === active.id)
      if (!moving) return prev
      const nextFrom = fromItems.filter(l => l.id !== active.id)
      const nextTo = [{ ...moving, stage: toStage }, ...toItems]
      return { ...prev, [fromStage]: nextFrom, [toStage]: nextTo }
    })

    const ok = await updateLeadStage(String(active.id), toStage)
    if (!ok) {
      // rollback if failed
      setColumns(initial)
    } else {
      await refetch()
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading leads...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stageMeta: Record<Stage, { name: string; color: string }> = {
    new: { name: "New Leads", color: "bg-blue-100 border-blue-200" },
    contacted: { name: "Contacted", color: "bg-yellow-100 border-yellow-200" },
    appointment: { name: "Appointment Booked", color: "bg-purple-100 border-purple-200" },
    onboarded: { name: "Onboarded", color: "bg-green-100 border-green-200" },
    closed: { name: "Closed", color: "bg-gray-100 border-gray-200" },
  }

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Lead Pipeline
              </CardTitle>
              <CardDescription>Manage leads through each stage of the sales process</CardDescription>
            </div>
            <div className="flex gap-2">
              {error && (
                <Button size="sm" variant="outline" onClick={refetch}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              )}
              <Button size="sm" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button size="sm" onClick={() => setShowAddLeadForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Lead
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <DndContext
            sensors={sensors}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            collisionDetection={closestCorners}
          >
            <div className={`grid gap-4 ${expanded ? "grid-cols-1 lg:grid-cols-5" : "grid-cols-1 lg:grid-cols-5"} overflow-x-auto`}>
              {STAGES.map((stage) => {
                const meta = stageMeta[stage]
                const items = columns[stage]
                return (
                  <div key={stage} className="min-w-[280px]">
                    <DroppableColumn id={stage} className={`rounded-lg border-2 border-dashed ${meta.color} p-4 min-h-[500px]`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-sm">{meta.name}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {items.length}
                        </Badge>
                      </div>

                      <SortableContext items={items.map(l => l.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-3">
                          {items.map((lead) => (
                            <SortableLead key={lead.id} lead={lead} />
                          ))}
                        </div>
                      </SortableContext>

                      <Button
                        variant="ghost"
                        className="w-full mt-3 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600"
                        size="sm"
                        onClick={() => setShowAddLeadForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Lead
                      </Button>
                    </DroppableColumn>
                  </div>
                )
              })}
            </div>

            <DragOverlay>{/* optional overlay */}</DragOverlay>
          </DndContext>
        </CardContent>
      </Card>

      {/* Add Lead Modal */}
      <AddLeadForm
        isOpen={showAddLeadForm}
        onClose={() => setShowAddLeadForm(false)}
        onAddLead={handleAddLead}
      />

      {/* Voice Call Modal */}
      {activeCall && (
        <VoiceCall
          leadName={activeCall.name}
          leadPhone={activeCall.phone}
          leadId={activeCall.id}
          onClose={() => setActiveCall(null)}
        />
      )}
    </>
  )
}

