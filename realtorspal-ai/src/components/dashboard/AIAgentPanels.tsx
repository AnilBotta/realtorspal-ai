"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Mail, Zap } from "lucide-react"

interface AIAgentPanelsProps {
  isAdmin?: boolean
  expanded?: boolean
}

export const AIAgentPanels: React.FC<AIAgentPanelsProps> = ({ isAdmin, expanded = false }) => {
  const demoAgents = [
    {
      name: "Lead Generator",
      type: "Scraper AI",
      status: "Active",
      description: "Collecting leads from social media ads",
      icon: <Zap className="w-5 h-5 text-yellow-500" />,
    },
    {
      name: "Follow-Up Agent",
      type: "Email AI",
      status: "Running",
      description: "Sending scheduled follow-up messages",
      icon: <Mail className="w-5 h-5 text-blue-500" />,
    },
    {
      name: "Appointment Booker",
      type: "Voice AI",
      status: "Idle",
      description: "Awaiting new queries for appointment booking",
      icon: <Bot className="w-5 h-5 text-purple-500" />,
    },
  ]

  const emptyAgents: typeof demoAgents = []

  const agentsToShow = isAdmin ? demoAgents : emptyAgents

  return (
    <div className={`space-y-4 ${expanded ? "w-full" : ""}`}>
      {agentsToShow.length > 0 ? (
        agentsToShow.map((agent, idx) => (
          <Card key={idx} className="bg-white/80 backdrop-blur border-slate-200/50">
            <CardHeader className="flex items-center gap-4">
              <div className="p-2 bg-slate-100 rounded-md">{agent.icon}</div>
              <div>
                <CardTitle className="text-sm">{agent.name}</CardTitle>
                <CardDescription className="text-xs text-slate-500">{agent.type}</CardDescription>
              </div>
              <div className="ml-auto">
                <Badge variant="outline" className="text-xs">{agent.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0 text-sm text-slate-600">{agent.description}</CardContent>
          </Card>
        ))
      ) : (
        <Card className="bg-white/80 backdrop-blur border-slate-200/50">
          <CardHeader>
            <CardTitle className="text-sm">AI Agents</CardTitle>
            <CardDescription className="text-xs">No AI agent activity to display</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-500 italic">
            You haven’t configured any AI agents yet. Once setup, their activity will appear here.
          </CardContent>
        </Card>
      )}
    </div>
  )
}

