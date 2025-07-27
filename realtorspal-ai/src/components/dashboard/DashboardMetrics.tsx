// src/components/dashboard/DashboardMetrics.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, Phone, TrendingUp, User } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  change?: string
}

const MetricCard = ({ title, value, icon, change }: MetricCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {change && (
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3 text-green-500" />
          <span>{change}</span>
        </p>
      )}
    </CardContent>
  </Card>
)

interface DashboardMetricsProps {
  isAdmin: boolean
}

export const DashboardMetrics = ({ isAdmin }: DashboardMetricsProps) => {
  const metrics = isAdmin
    ? [
        {
          title: "New Leads",
          value: 128,
          icon: <User className="h-4 w-4 text-muted-foreground" />,
          change: "+12.5%",
        },
        {
          title: "Appointments Booked",
          value: 42,
          icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
          change: "+8.2%",
        },
        {
          title: "Calls Made",
          value: 86,
          icon: <Phone className="h-4 w-4 text-muted-foreground" />,
          change: "+5.9%",
        },
        {
          title: "Conversion Rate",
          value: "12.5%",
          icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
          change: "+1.4%",
        },
      ]
    : []

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}

