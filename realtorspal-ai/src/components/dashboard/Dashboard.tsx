"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import {
  Users,
  Calendar,
  TrendingUp,
  Phone,
  Mail,
  BarChart3,
  Bot,
  Settings,
  Bell,
  Search,
  Filter,
  Database,
  BrainCircuit,
  Download,
  Upload,
  Zap,
  LogOut,
  User,
  ChevronDown,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { MetricsOverview } from "./MetricsOverview"
import { KanbanBoard } from "./KanbanBoard"
import { AIAgentPanels } from "./AIAgentPanels"
import { SettingsPanel } from "../settings/SettingsPanel"
import { AgentConfiguration } from "../agents/AgentConfiguration"
import { AdvancedAnalytics } from "../analytics/AdvancedAnalytics"
import { ImportExportSystem } from "../import-export/ImportExportSystem"

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [showAddLeadForm, setShowAddLeadForm] = useState(false)
  const { toast } = useToast()
  const { user, logout } = useAuth()

  // Simulate real-time notifications
  const showNotification = useCallback((type: "lead" | "agent" | "task") => {
    switch (type) {
      case "lead":
        toast({
          title: "New Lead Generated",
          description: "Sarah Johnson interested in 3BR Downtown condo - $450K budget",
        })
        break
      case "agent":
        toast({
          title: "Agent Status Update",
          description: "Lead Nurturing AI completed 5 follow-up emails successfully",
        })
        break
      case "task":
        toast({
          title: "Task Completed",
          description: "Document processing completed for David Wilson",
        })
        break
    }
  }, [toast])

  // Auto-trigger notifications for demo
  useEffect(() => {
    const interval = setInterval(() => {
      const notifications = ["lead", "agent", "task"]
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
      showNotification(randomNotification as "lead" | "agent" | "task")
    }, 45000) // Every 45 seconds

    return () => clearInterval(interval)
  }, [showNotification])

  const handleSearch = () => {
    toast({
      title: "Search Leads",
      description: "Opening advanced search interface...",
    })
    // In a real app, this would open a search modal
  }

  const handleFilter = () => {
    toast({
      title: "Filter Options",
      description: "Showing lead filtering options",
    })
    // In a real app, this would open filter controls
  }

  const handleAddLead = () => {
    // Switch to leads tab and trigger the add form
    setActiveTab("leads")
    // Small delay to ensure the tab has switched
    setTimeout(() => {
      // The KanbanBoard component will handle opening the form
      toast({
        title: "Add New Lead",
        description: "Opening lead creation form...",
      })
    }, 100)
  }

  const handleRefresh = () => {
    toast({
      title: "Refreshing Data",
      description: "Updating dashboard with latest information...",
    })
    // In a real app, this would refresh the data
  }

  const handleExportData = () => {
    setActiveTab("import-export")
    toast({
      title: "Export Data",
      description: "Navigating to export tools...",
    })
  }

  const handleViewReports = () => {
    setActiveTab("analytics")
    toast({
      title: "View Reports",
      description: "Opening advanced analytics dashboard...",
    })
  }

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  RealtorsPal AI
                </h1>
                <p className="text-slate-600">Smart Real Estate CRM Powered by Agentic AI</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Backend Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-green-700">
                Live Data
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSearch}
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilter}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => showNotification("agent")}
            >
              <Bell className="w-4 h-4 mr-2" />
              Alerts
              <Badge variant="secondary" className="ml-2">3</Badge>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="text-xs">
                      {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user?.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-slate-500">{user?.email}</p>
                    <Badge variant="secondary" className="w-fit text-xs">
                      {user?.role}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("agent-config")}>
                  <BrainCircuit className="w-4 h-4 mr-2" />
                  AI Configuration
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Data
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="overview">Dashboard</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="agents">AI Agents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="import-export">Data</TabsTrigger>
          <TabsTrigger value="agent-config">Agent Config</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <KanbanBoard />
            </div>
            <div>
              <AIAgentPanels />
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Frequently used tools and shortcuts
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={handleAddLead}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab("import-export")}
                >
                  <Upload className="w-6 h-6" />
                  Import Leads
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={handleViewReports}
                >
                  <BarChart3 className="w-6 h-6" />
                  View Reports
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab("agent-config")}
                >
                  <BrainCircuit className="w-6 h-6" />
                  Configure AI
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-6 h-6" />
                  System Setup
                </Button>
              </div>

              {/* Additional Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-1"
                  onClick={handleExportData}
                >
                  <Download className="w-5 h-5" />
                  <span className="text-xs">Export Data</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-1"
                  onClick={() => showNotification("lead")}
                >
                  <Eye className="w-5 h-5" />
                  <span className="text-xs">View Activity</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-1"
                  onClick={handleRefresh}
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="text-xs">Refresh All</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-1"
                  onClick={() => toast({
                    title: "Help & Support",
                    description: "Opening documentation and support resources...",
                  })}
                >
                  <User className="w-5 h-5" />
                  <span className="text-xs">Get Help</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leads">
          <KanbanBoard expanded={true} />
        </TabsContent>

        <TabsContent value="agents">
          <AIAgentPanels expanded={true} />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedAnalytics />
        </TabsContent>

        <TabsContent value="import-export">
          <ImportExportSystem />
        </TabsContent>

        <TabsContent value="agent-config">
          <AgentConfiguration />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  )
}
