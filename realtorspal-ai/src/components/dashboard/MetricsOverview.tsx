"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useDashboard } from "@/hooks/useDashboard"
import { useAuth } from "@/contexts/AuthContext"
import {
  Users,
  Calendar,
  TrendingUp,
  Phone,
  Mail,
  DollarSign,
  Target,
  Clock,
  ArrowUpIcon,
  ArrowDownIcon,
  Loader2,
  AlertCircle,
  Database
} from "lucide-react"

export function MetricsOverview() {
  const { metrics, isLoading, error, refetch } = useDashboard()
  const { backendConnected } = useAuth()

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading dashboard metrics...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-slate-600">
            <AlertCircle className="w-8 h-8" />
            <span>Failed to load metrics</span>
            <button onClick={refetch} className="text-blue-600 hover:underline">
              Try again
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const metricsConfig = [
    {
      title: "Total Leads",
      value: metrics.totalLeads.toLocaleString(),
      change: "+12.5%",
      changeType: "increase",
      icon: Users,
      description: "This month"
    },
    {
      title: "Active Conversations",
      value: metrics.activeConversations.toString(),
      change: "+8.2%",
      changeType: "increase",
      icon: Phone,
      description: "Currently engaged"
    },
    {
      title: "Appointments Scheduled",
      value: metrics.appointmentsScheduled.toString(),
      change: "+15.7%",
      changeType: "increase",
      icon: Calendar,
      description: "This week"
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate}%`,
      change: "-2.1%",
      changeType: "decrease",
      icon: Target,
      description: "Lead to client"
    },
    {
      title: "Revenue Generated",
      value: `${metrics.revenueGenerated.toLocaleString()}`,
      change: "+28.3%",
      changeType: "increase",
      icon: DollarSign,
      description: "This quarter"
    },
    {
      title: "Response Time",
      value: `${metrics.responseTime} min`,
      change: "-45.2%",
      changeType: "increase",
      icon: Clock,
      description: "Average AI response"
    }
  ]

  const engagementMetrics = [
    { label: "Email Open Rate", value: 68, target: 70 },
    { label: "SMS Click Rate", value: 45, target: 40 },
    { label: "Call Connection Rate", value: 82, target: 80 },
    { label: "Document Completion", value: 91, target: 85 }
  ]

  return (
    <div className="space-y-6">
      {/* Error Indicator */}
      {error && !metrics && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <Database className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">
            Unable to load metrics data
          </span>
          <button onClick={refetch} className="text-red-600 hover:underline text-sm ml-auto">
            Retry
          </button>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricsConfig.map((metric, index) => {
          const Icon = metric.icon
          return (
            <Card key={index} className="relative overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Icon className="w-5 h-5 text-slate-600" />
                  <Badge
                    variant={metric.changeType === "increase" ? "default" : "secondary"}
                    className={`text-xs ${
                      metric.changeType === "increase"
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {metric.changeType === "increase" ? (
                      <ArrowUpIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownIcon className="w-3 h-3 mr-1" />
                    )}
                    {metric.change}
                  </Badge>
                </div>
                <CardTitle className="text-2xl font-bold">{metric.value}</CardTitle>
                <CardDescription className="text-sm">{metric.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">{metric.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Engagement Metrics */}
      <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Engagement Performance
          </CardTitle>
          <CardDescription>
            Real-time performance metrics across all communication channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {engagementMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{metric.label}</span>
                  <span className="text-slate-600">{metric.value}%</span>
                </div>
                <Progress
                  value={metric.value}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Target: {metric.target}%</span>
                  <span className={metric.value >= metric.target ? "text-green-600" : "text-orange-600"}>
                    {metric.value >= metric.target ? "✓ On track" : "⚠ Below target"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
