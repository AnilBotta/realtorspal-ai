"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VoiceCall } from "../voice/VoiceCall"
import { AddLeadForm } from "../leads/AddLeadForm"
import { useToast } from "@/hooks/use-toast"
import { useLeads } from "@/hooks/useLeads"
import { useAuth } from "@/contexts/AuthContext"
import type { Lead } from "@/lib/api"
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  DollarSign,
  MapPin,
  Clock,
  Plus,
  Filter,
  MoreHorizontal,
  PhoneCall,
  User,
  Loader2,
  AlertCircle,
  Database,
  RefreshCw
} from "lucide-react"

interface KanbanBoardProps {
  expanded?: boolean
}

export function KanbanBoard({ expanded = false }: KanbanBoardProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [activeCall, setActiveCall] = useState<Lead | null>(null)
  const [showAddLeadForm, setShowAddLeadForm] = useState(false)
  const { toast } = useToast()
  const { leads, isLoading, error, addLead, updateLeadStage, refetch } = useLeads()
  const { user } = useAuth()

  // Check if current user is admin
  const isAdmin = user?.email === 'admin@realtorspal.ai'

  const stages = [
    { id: "new", name: "New Leads", color: "bg-blue-100 border-blue-200", count: leads.new?.length || 0 },
    { id: "contacted", name: "Contacted", color: "bg-yellow-100 border-yellow-200", count: leads.contacted?.length || 0 },
    { id: "appointment", name: "Appointment Booked", color: "bg-purple-100 border-purple-200", count: leads.appointment?.length || 0 },
    { id: "onboarded", name: "Onboarded", color: "bg-green-100 border-green-200", count: leads.onboarded?.length || 0 },
    { id: "closed", name: "Closed", color: "bg-gray-100 border-gray-200", count: leads.closed?.length || 0 }
  ]


  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700 border-red-200"
      case "medium": return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "low": return "bg-green-100 text-green-700 border-green-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getSourceColor = (source: string) => {
    if (source === "Manual Entry") {
      return "bg-purple-100 text-purple-700 border-purple-200"
    }
    return "bg-blue-50 text-blue-700 border-blue-200"
  }

  const handleCall = (lead: Lead) => {
    setActiveCall(lead)
    toast({
      title: "Initiating Voice Call",
      description: `Preparing to call ${lead.name} at ${lead.phone}`,
    })
  }

  const handleEmail = (lead: Lead) => {
    toast({
      title: "Email Composer",
      description: `Opening email composer for ${lead.name}`,
    })
  }

  const handleSMS = (lead: Lead) => {
    toast({
      title: "SMS Composer",
      description: `Opening SMS composer for ${lead.name}`,
    })
  }

  const handleAddLead = async (newLeadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => {
    const success = await addLead(newLeadData)

    if (success) {
      toast({
        title: "Lead Added Successfully",
        description: `${newLeadData.name} has been added to your lead pipeline`,
      })
    } else {
      toast({
        title: "Failed to Add Lead",
        description: "There was an error adding the lead. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleAddLeadToStage = (stageId: string) => {
    setShowAddLeadForm(true)
  }

  const LeadCard = ({ lead }: { lead: Lead }) => (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer border-slate-200/50 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs">{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
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

        {/* Source and AI Agent Tags */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className={`text-xs ${getSourceColor(lead.source)}`}>
            {lead.source}
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Lead Generator AI
          </Badge>
        </div>

        <div className="flex gap-1 pt-2">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs hover:bg-green-50 hover:border-green-300"
            onClick={() => handleCall(lead)}
          >
            <PhoneCall className="w-3 h-3 mr-1" />
            Call
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs hover:bg-blue-50 hover:border-blue-300"
            onClick={() => handleEmail(lead)}
          >
            <Mail className="w-3 h-3 mr-1" />
            Email
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs hover:bg-purple-50 hover:border-purple-300"
            onClick={() => handleSMS(lead)}
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            SMS
          </Button>
        </div>
      </CardContent>
    </Card>
  )

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

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Lead Pipeline
                {isAdmin && (
                  <Badge variant="outline" className="ml-2 text-blue-700 border-blue-300 bg-blue-50">
                    Demo Mode
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Manage leads through each stage of the sales process
              </CardDescription>
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
          <div className={`grid gap-4 ${expanded ? 'grid-cols-1 lg:grid-cols-5' : 'grid-cols-1 lg:grid-cols-5'} overflow-x-auto`}>
            {stages.map((stage) => (
              <div key={stage.id} className="min-w-[280px]">
                <div className={`rounded-lg border-2 border-dashed ${stage.color} p-4 min-h-[500px]`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {leads[stage.id]?.length || 0}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {leads[stage.id]?.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full mt-3 border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-600"
                    size="sm"
                    onClick={() => handleAddLeadToStage(stage.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Lead Form Modal */}
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
