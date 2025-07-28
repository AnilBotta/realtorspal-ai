"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  LineChart,
  Activity,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react"

export function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState("30d")
  const [selectedMetric, setSelectedMetric] = useState("conversion")

  // Mock data for analytics
  const conversionFunnel = [
    { stage: "Website Visitors", count: 5420, percentage: 100, color: "bg-blue-500" },
    { stage: "Lead Generated", count: 1247, percentage: 23, color: "bg-green-500" },
    { stage: "Contacted", count: 892, percentage: 16.5, color: "bg-yellow-500" },
    { stage: "Appointment Booked", count: 234, percentage: 4.3, color: "bg-orange-500" },
    { stage: "Onboarded", count: 156, percentage: 2.9, color: "bg-purple-500" },
    { stage: "Closed Deal", count: 89, percentage: 1.6, color: "bg-red-500" }
  ]

  const agentPerformance = [
    { name: "Orchestrator AI", tasks: 247, success: 98, efficiency: 96, revenue: 45200 },
    { name: "Lead Generator", tasks: 189, success: 85, efficiency: 92, revenue: 32100 },
    { name: "Nurturing AI", tasks: 156, success: 72, efficiency: 88, revenue: 28900 },
    { name: "Customer Service", tasks: 143, success: 91, efficiency: 94, revenue: 18700 },
    { name: "Onboarding Agent", tasks: 128, success: 94, efficiency: 89, revenue: 22400 }
  ]

  const roiMetrics = {
    totalInvestment: 25000,
    totalRevenue: 147300,
    roi: 489,
    costPerLead: 20.04,
    customerLifetimeValue: 15600,
    paybackPeriod: 2.3
  }

  const monthlyTrends = [
    { month: "Jan", leads: 980, revenue: 98000, conversion: 18.2 },
    { month: "Feb", leads: 1120, revenue: 112000, conversion: 19.8 },
    { month: "Mar", leads: 1350, revenue: 135000, conversion: 21.4 },
    { month: "Apr", leads: 1180, revenue: 118000, conversion: 20.1 },
    { month: "May", leads: 1420, revenue: 142000, conversion: 22.7 },
    { month: "Jun", leads: 1247, revenue: 147300, conversion: 23.4 }
  ]

  const leadSources = [
    { source: "Facebook Ads", count: 342, percentage: 27.4, cost: 8200, roi: 315 },
    { source: "Google Ads", count: 298, percentage: 23.9, cost: 7100, roi: 289 },
    { source: "LinkedIn", count: 187, percentage: 15.0, cost: 4200, roi: 245 },
    { source: "Instagram", count: 156, percentage: 12.5, cost: 2800, roi: 198 },
    { source: "Referrals", count: 134, percentage: 10.7, cost: 1200, roi: 567 },
    { source: "Website", count: 130, percentage: 10.4, cost: 1500, roi: 456 }
  ]

  const realTimeMetrics = {
    activeLeads: 89,
    agentsWorking: 5,
    tasksInProgress: 23,
    avgResponseTime: 2.3,
    systemUptime: 99.8,
    dailyGoalProgress: 78
  }

  const getConversionRate = (current: number, previous: number) => {
    if (previous === 0) return "0"
    return ((current / previous) * 100).toFixed(1)
  }

  const getTrendIcon = (current: number, previous: number) => {
    const rate = getConversionRate(current, previous)
    return parseFloat(rate) >= 100 ?
      <TrendingUp className="w-4 h-4 text-green-600" /> :
      <TrendingDown className="w-4 h-4 text-red-600" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Advanced Analytics</h1>
              <p className="text-slate-600">Deep insights into your real estate business performance</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Real-time Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-slate-600">Active Leads</span>
              </div>
              <div className="text-2xl font-bold">{realTimeMetrics.activeLeads}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-600">Agents Working</span>
              </div>
              <div className="text-2xl font-bold">{realTimeMetrics.agentsWorking}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-slate-600">Tasks Active</span>
              </div>
              <div className="text-2xl font-bold">{realTimeMetrics.tasksInProgress}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-slate-600">Response Time</span>
              </div>
              <div className="text-2xl font-bold">{realTimeMetrics.avgResponseTime}s</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-600">Uptime</span>
              </div>
              <div className="text-2xl font-bold">{realTimeMetrics.systemUptime}%</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-600" />
                <span className="text-sm text-slate-600">Daily Goal</span>
              </div>
              <div className="text-2xl font-bold">{realTimeMetrics.dailyGoalProgress}%</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="conversion" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/50 backdrop-blur-sm">
            <TabsTrigger value="conversion">Conversion Funnel</TabsTrigger>
            <TabsTrigger value="performance">Agent Performance</TabsTrigger>
            <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
            <TabsTrigger value="sources">Lead Sources</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* Conversion Funnel */}
          <TabsContent value="conversion">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Lead Conversion Funnel
                    </CardTitle>
                    <CardDescription>
                      Track leads through each stage of the sales process
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {conversionFunnel.map((stage, index) => (
                        <div key={stage.stage} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                              <span className="font-medium">{stage.stage}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="secondary">{stage.percentage}%</Badge>
                              <span className="text-lg font-bold">{stage.count.toLocaleString()}</span>
                            </div>
                          </div>
                          <Progress value={stage.percentage} className="h-3" />
                          {index < conversionFunnel.length - 1 && (
                            <div className="text-xs text-slate-600 ml-6">
                              Drop-off: {((stage.count - conversionFunnel[index + 1].count) / stage.count * 100).toFixed(1)}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                  <CardHeader>
                    <CardTitle>Conversion Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800">Top Performer</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Lead to Contact conversion increased by 15% this month
                      </p>
                    </div>

                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">Needs Attention</span>
                      </div>
                      <p className="text-sm text-yellow-700">
                        Appointment booking rate below target by 8%
                      </p>
                    </div>

                    <div className="space-y-2">
                      <span className="text-sm font-medium">Stage Performance</span>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Lead Quality Score</span>
                          <span className="font-medium">8.4/10</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Avg. Time in Funnel</span>
                          <span className="font-medium">12.3 days</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Best Converting Source</span>
                          <span className="font-medium">Referrals</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Agent Performance */}
          <TabsContent value="performance">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  AI Agent Performance Comparison
                </CardTitle>
                <CardDescription>
                  Analyze individual agent contributions and efficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agentPerformance.map((agent, index) => (
                    <div key={agent.name} className="p-4 border border-slate-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                            <span className="text-white text-sm font-bold">{index + 1}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{agent.name}</h3>
                            <p className="text-sm text-slate-600">{agent.tasks} tasks completed</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">${agent.revenue.toLocaleString()}</div>
                          <p className="text-sm text-slate-600">Revenue generated</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Success Rate</span>
                            <span>{agent.success}%</span>
                          </div>
                          <Progress value={agent.success} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Efficiency</span>
                            <span>{agent.efficiency}%</span>
                          </div>
                          <Progress value={agent.efficiency} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Revenue Impact</span>
                            <span>{Math.round((agent.revenue / 147300) * 100)}%</span>
                          </div>
                          <Progress value={(agent.revenue / 147300) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ROI Analysis */}
          <TabsContent value="roi">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    ROI Overview
                  </CardTitle>
                  <CardDescription>
                    Return on investment and financial metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-3xl font-bold text-green-700">{roiMetrics.roi}%</div>
                      <div className="text-sm text-green-600">ROI</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-3xl font-bold text-blue-700">${roiMetrics.totalRevenue.toLocaleString()}</div>
                      <div className="text-sm text-blue-600">Total Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="text-3xl font-bold text-purple-700">${roiMetrics.costPerLead}</div>
                      <div className="text-sm text-purple-600">Cost per Lead</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="text-3xl font-bold text-orange-700">{roiMetrics.paybackPeriod} mo</div>
                      <div className="text-sm text-orange-600">Payback Period</div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Investment</span>
                      <span className="font-semibold">${roiMetrics.totalInvestment.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Customer Lifetime Value</span>
                      <span className="font-semibold">${roiMetrics.customerLifetimeValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-slate-900 font-medium">Net Profit</span>
                      <span className="font-bold text-green-600">
                        ${(roiMetrics.totalRevenue - roiMetrics.totalInvestment).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>Monthly Revenue Trend</CardTitle>
                  <CardDescription>
                    Track revenue growth over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyTrends.map((month) => (
                      <div key={month.month} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium w-8">{month.month}</span>
                          <div>
                            <div className="text-sm font-semibold">${month.revenue.toLocaleString()}</div>
                            <div className="text-xs text-slate-600">{month.leads} leads</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{month.conversion}%</div>
                          <div className="text-xs text-slate-600">conversion</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Lead Sources */}
          <TabsContent value="sources">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Lead Source Analysis
                </CardTitle>
                <CardDescription>
                  Performance breakdown by lead generation channel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    {leadSources.map((source, index) => (
                      <div key={source.source} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{source.source}</span>
                          <Badge variant="secondary">{source.percentage}%</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <div className="text-lg font-bold">{source.count}</div>
                            <div className="text-slate-600">Leads</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">${source.cost}</div>
                            <div className="text-slate-600">Cost</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold">{source.roi}%</div>
                            <div className="text-slate-600">ROI</div>
                          </div>
                        </div>
                        <Progress value={source.percentage} className="mt-2 h-2" />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-64 h-64 rounded-full border-8 border-slate-200 flex items-center justify-center">
                      <PieChart className="w-16 h-16 text-slate-400" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends">
            <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>
                  Historical data and trend analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <LineChart className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600">Interactive charts and trend analysis coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
