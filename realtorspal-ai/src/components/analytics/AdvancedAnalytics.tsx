"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BadgeCheck, AlertTriangle } from "lucide-react"

interface AdvancedAnalyticsProps {
  isAdmin?: boolean
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ isAdmin }) => {
  const stats = isAdmin
    ? {
        activeLeads: 89,
        agentsWorking: 5,
        tasksActive: 23,
        responseTime: "2.3s",
        uptime: "99.8%",
        dailyGoal: "78%",
        conversionNotes: {
          top: "Lead to Contact conversion increased by 15% this month",
          warning: "Appointment booking rate below target by 8%",
        },
        funnel: {
          visitors: 5420,
          leads: 1247,
        },
      }
    : {
        activeLeads: "—",
        agentsWorking: "—",
        tasksActive: "—",
        responseTime: "—",
        uptime: "—",
        dailyGoal: "—",
        conversionNotes: null,
        funnel: null,
      }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-sm text-muted-foreground">Active Leads</div>
            <div className="text-2xl font-bold">{stats.activeLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-sm text-muted-foreground">Agents Working</div>
            <div className="text-2xl font-bold">{stats.agentsWorking}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-sm text-muted-foreground">Tasks Active</div>
            <div className="text-2xl font-bold">{stats.tasksActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-sm text-muted-foreground">Response Time</div>
            <div className="text-2xl font-bold">{stats.responseTime}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-sm text-muted-foreground">Uptime</div>
            <div className="text-2xl font-bold">{stats.uptime}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 text-center">
            <div className="text-sm text-muted-foreground">Daily Goal</div>
            <div className="text-2xl font-bold">{stats.dailyGoal}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="funnel">
        <TabsList className="mb-4">
          <TabsTrigger value="funnel">Conversion Funnel</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
          <TabsTrigger value="sources">Lead Sources</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="funnel">
          {isAdmin && stats.funnel ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lead Conversion Funnel</CardTitle>
                  <div className="text-sm text-muted-foreground">Track leads through each stage of the sales process</div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Website Visitors</span>
                      <span>{stats.funnel.visitors}</span>
                    </div>
                    <div className="h-2 rounded bg-gray-200 overflow-hidden">
                      <div className="h-full w-full bg-black" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Drop-off: 77.0%</div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Lead Generated</span>
                      <span>{stats.funnel.leads}</span>
                    </div>
                    <div className="h-2 rounded bg-gray-200 overflow-hidden">
                      <div className="h-full w-2/5 bg-green-600" />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Drop-off: 28.5%</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Conversion Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-md border border-green-300 bg-green-50 text-green-800 flex items-center gap-2 text-sm">
                    <BadgeCheck className="w-4 h-4" />
                    {stats.conversionNotes?.top}
                  </div>
                  <div className="p-3 rounded-md border border-yellow-300 bg-yellow-50 text-yellow-800 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {stats.conversionNotes?.warning}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-sm text-muted-foreground italic py-12">
              Analytics will appear here once data is available.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

