"use client"

import { TrendingUp } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { fetchDashboardMetrics } from "@/lib/api/dashboard" // ✅ fix path

export default function MetricsOverview() {
  const [metrics, setMetrics] = useState<{
    newLeads: number
    appointmentsBooked: number
    callsMade: number
    conversionRate: number
  } | null>(null)

  const { user } = useAuth()
  const isAdmin = user?.email === "realtorspaladmin@gmail.com"

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetchDashboardMetrics()
        setMetrics(res)
      } catch (err) {
        console.error("Error loading dashboard metrics:", err)
      }
    }
    fetchData()
  }, [])

  const cards = [
    {
      title: "New Leads",
      value: metrics?.newLeads ?? "--",
      change: "+12%",
    },
    {
      title: "Appointments Booked",
      value: metrics?.appointmentsBooked ?? "--",
      change: "+8%",
    },
    {
      title: "Calls Made",
      value: metrics?.callsMade ?? "--",
      change: "+5%",
    },
    {
      title: "Conversion Rate",
      value: metrics?.conversionRate ? `${metrics.conversionRate}%` : "--",
      change: "+2.5%",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {isAdmin && (
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">{card.change}</span> from last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

