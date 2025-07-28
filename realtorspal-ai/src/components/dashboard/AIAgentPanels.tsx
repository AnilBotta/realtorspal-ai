"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Zap,
  Users,
  MessageSquare,
  Phone,
  FileText,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  Mail,
  Calendar,
  Search,
  BrainCircuit
} from "lucide-react"

interface AIAgentPanelsProps {
  expanded?: boolean
}

export function AIAgentPanels({ expanded = false }: AIAgentPanelsProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>("orchestrator")

  const agents = [
    {
      id: "orchestrator",
      name: "Main Orchestrator AI",
      role: "System Coordinator",
      status: "active",
      icon: BrainCircuit,
      color: "from-purple-500 to-pink-500",
      description: "Oversees all agent activity and maintains system harmony",
      metrics: {
        tasksCompleted: 247,
        efficiency: 98,
        uptime: 99.9,
        conflicts: 2
      },
      currentTasks: [
        "Monitoring lead flow optimization",
        "Resolving agent conflict between Nurturing & Customer Service",
        "Generating performance insights",
        "Scheduling system maintenance"
      ],
      recentActions: [
        { time: "2 min ago", action: "Resolved duplicate lead contact", status: "success" },
        { time: "15 min ago", action: "Optimized email campaign timing", status: "success" },
        { time: "1 hour ago", action: "Flagged low conversion rate", status: "warning" }
      ]
    },
    {
      id: "lead-generator",
      name: "Lead Generator AI",
      role: "Lead Acquisition",
      status: "active",
      icon: Search,
      color: "from-blue-500 to-cyan-500",
      description: "Scrapes and enriches leads from social media and ads",
      metrics: {
        leadsGenerated: 89,
        dataAccuracy: 94,
        sourcesCovered: 12,
        conversionRate: 23
      },
      currentTasks: [
        "Scanning Facebook marketplace listings",
        "Enriching LinkedIn lead profiles",
        "Processing Instagram engagement data",
        "Validating contact information"
      ],
      recentActions: [
        { time: "5 min ago", action: "Generated 3 new leads from Facebook", status: "success" },
        { time: "20 min ago", action: "Enriched 12 lead profiles", status: "success" },
        { time: "45 min ago", action: "API rate limit reached", status: "warning" }
      ]
    },
    {
      id: "lead-nurturing",
      name: "Lead Nurturing AI",
      role: "Relationship Building",
      status: "active",
      icon: MessageSquare,
      color: "from-green-500 to-emerald-500",
      description: "Manages email/SMS campaigns and follow-ups",
      metrics: {
        emailsSent: 156,
        openRate: 68,
        responseRate: 45,
        conversionRate: 18
      },
      currentTasks: [
        "Sending personalized follow-up emails",
        "Processing SMS responses",
        "Updating drip campaign sequences",
        "Analyzing engagement patterns"
      ],
      recentActions: [
        { time: "1 min ago", action: "Sent follow-up to Sarah Johnson", status: "success" },
        { time: "10 min ago", action: "Updated email template for luxury leads", status: "success" },
        { time: "30 min ago", action: "Scheduled 5 follow-up emails", status: "success" }
      ]
    },
    {
      id: "customer-service",
      name: "Customer Service AI",
      role: "Client Support",
      status: "active",
      icon: Phone,
      color: "from-orange-500 to-red-500",
      description: "Handles calls, FAQs, and appointment booking",
      metrics: {
        callsHandled: 43,
        appointmentsBooked: 12,
        satisfaction: 92,
        avgResponseTime: 2.3
      },
      currentTasks: [
        "Handling incoming call from Mike Chen",
        "Booking property viewing appointments",
        "Updating FAQ database",
        "Processing callback requests"
      ],
      recentActions: [
        { time: "3 min ago", action: "Booked appointment for Emily Davis", status: "success" },
        { time: "12 min ago", action: "Answered FAQ about financing", status: "success" },
        { time: "25 min ago", action: "Escalated complex query to human agent", status: "warning" }
      ]
    },
    {
      id: "onboarding",
      name: "Onboarding Agent AI",
      role: "Document Processing",
      status: "active",
      icon: FileText,
      color: "from-indigo-500 to-purple-500",
      description: "Manages contracts, signatures, and client onboarding",
      metrics: {
        documentsProcessed: 28,
        signatureRate: 87,
        processingTime: 1.2,
        errorRate: 0.5
      },
      currentTasks: [
        "Preparing offer letter for David Wilson",
        "Collecting e-signatures",
        "Validating document completeness",
        "Sending welcome packages"
      ],
      recentActions: [
        { time: "8 min ago", action: "Sent purchase agreement to Lisa Rodriguez", status: "success" },
        { time: "35 min ago", action: "Collected signature from previous client", status: "success" },
        { time: "1 hour ago", action: "Document validation failed", status: "error" }
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700 border-green-200"
      case "busy": return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "offline": return "bg-red-100 text-red-700 border-red-200"
      default: return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getActionStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-3 h-3 text-green-600" />
      case "warning": return <AlertTriangle className="w-3 h-3 text-yellow-600" />
      case "error": return <AlertTriangle className="w-3 h-3 text-red-600" />
      default: return <Activity className="w-3 h-3 text-blue-600" />
    }
  }

  if (expanded) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              AI Agent Command Center
            </CardTitle>
            <CardDescription>
              Monitor and manage your agentic AI workforce
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map((agent) => {
            const Icon = agent.icon
            return (
              <Card key={agent.id} className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${agent.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.role}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600">{agent.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(agent.metrics).map(([key, value]) => (
                      <div key={key} className="text-center p-2 bg-slate-50 rounded">
                        <div className="text-lg font-bold text-slate-900">{value}{key.includes('Rate') || key.includes('accuracy') || key.includes('efficiency') || key.includes('uptime') || key.includes('satisfaction') ? '%' : ''}</div>
                        <div className="text-xs text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>

                  {/* Current Tasks */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Current Tasks</h4>
                    <div className="space-y-1">
                      {agent.currentTasks.slice(0, 3).map((task, index) => (
                        <div key={index} className="text-xs text-slate-600 flex items-center gap-2">
                          <Activity className="w-3 h-3 text-blue-500" />
                          {task}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Actions */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Recent Actions</h4>
                    <div className="space-y-2">
                      {agent.recentActions.slice(0, 2).map((action, index) => (
                        <div key={index} className="flex items-start gap-2 text-xs">
                          {getActionStatusIcon(action.status)}
                          <div className="flex-1">
                            <div className="text-slate-700">{action.action}</div>
                            <div className="text-slate-500">{action.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Agents Status
        </CardTitle>
        <CardDescription>
          Monitor your agentic AI workforce
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedAgent} onValueChange={setSelectedAgent} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="orchestrator" className="text-xs">Orchestrator</TabsTrigger>
            <TabsTrigger value="lead-generator" className="text-xs">Generator</TabsTrigger>
            <TabsTrigger value="lead-nurturing" className="text-xs">Nurturing</TabsTrigger>
          </TabsList>

          {agents.slice(0, 3).map((agent) => {
            const Icon = agent.icon
            return (
              <TabsContent key={agent.id} value={agent.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${agent.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{agent.name}</h3>
                    <p className="text-xs text-slate-600">{agent.description}</p>
                  </div>
                  <Badge className={getStatusColor(agent.status)}>
                    {agent.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(agent.metrics).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="text-center p-2 bg-slate-50 rounded">
                      <div className="font-bold text-slate-900">{value}{key.includes('Rate') || key.includes('accuracy') || key.includes('efficiency') || key.includes('uptime') ? '%' : ''}</div>
                      <div className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="text-xs font-semibold mb-2">Recent Activity</h4>
                  <div className="space-y-2">
                    {agent.recentActions.slice(0, 2).map((action, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs">
                        {getActionStatusIcon(action.status)}
                        <div className="flex-1">
                          <div className="text-slate-700">{action.action}</div>
                          <div className="text-slate-500">{action.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </Tabs>

        <div className="pt-4 border-t border-slate-200">
          <Button variant="outline" size="sm" className="w-full">
            View All Agents
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
