import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useLeads } from '@/hooks/useLeads'

interface UseDashboardReturn {
  metrics: DashboardMetricsFlat | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

type DashboardMetricsFlat = {
  totalLeads: number
  activeConversations: number
  appointmentsScheduled: number
  conversionRate: number   // percent 0–100
  revenueGenerated: number // $
  responseTime: number     // minutes
}

const emptyMetrics: DashboardMetricsFlat = {
  totalLeads: 0,
  activeConversations: 0,
  appointmentsScheduled: 0,
  conversionRate: 0,
  revenueGenerated: 0,
  responseTime: 0,
}

// --- helpers to parse revenue from budget strings like "$400K - $500K"
function parseBudgetToAvg(budget: string | undefined): number {
  if (!budget) return 0
  // examples: "$400K - $500K", "$700K-$900K", "$1.2M - $1.6M"
  const nums = budget.match(/([\d.]+)\s*([kKmM]?)/g)
  if (!nums || nums.length === 0) return 0

  const toNumber = (token: string): number => {
    const m = token.match(/([\d.]+)\s*([kKmM]?)/)
    if (!m) return 0
    const value = parseFloat(m[1] ?? '0')
    const unit = (m[2] ?? '').toLowerCase()
    if (unit === 'm') return value * 1_000_000
    if (unit === 'k') return value * 1_000
    return value
  }

  const values = nums.map(toNumber).filter(n => Number.isFinite(n))
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.round(avg)
}

// type guards (keep TS happy without any)
type GetDashboardMetricsFn = () => Promise<{ success: boolean; data?: unknown; message?: string }>
function hasGetDashboardMetrics(client: unknown): client is { getDashboardMetrics: GetDashboardMetricsFn } {
  if (typeof client !== 'object' || client === null) return false
  return typeof (client as Record<string, unknown>)['getDashboardMetrics'] === 'function'
}

type GetAnalyticsFn = () => Promise<{ success: boolean; data?: unknown; message?: string }>
function hasGetAnalytics(client: unknown): client is { getAnalytics: GetAnalyticsFn } {
  if (typeof client !== 'object' || client === null) return false
  return typeof (client as Record<string, unknown>)['getAnalytics'] === 'function'
}

// normalize various backend shapes into flat metrics
function toFlatMetrics(input: unknown): DashboardMetricsFlat {
  if (typeof input !== 'object' || input === null) return emptyMetrics
  const o = input as Record<string, unknown>

  if (
    'totalLeads' in o ||
    'activeConversations' in o ||
    'appointmentsScheduled' in o
  ) {
    return {
      totalLeads: typeof o.totalLeads === 'number' ? o.totalLeads : 0,
      activeConversations: typeof o.activeConversations === 'number' ? o.activeConversations : 0,
      appointmentsScheduled: typeof o.appointmentsScheduled === 'number' ? o.appointmentsScheduled : 0,
      conversionRate: typeof o.conversionRate === 'number' ? o.conversionRate : 0,
      revenueGenerated: typeof o.revenueGenerated === 'number' ? o.revenueGenerated : 0,
      responseTime: typeof o.responseTime === 'number' ? o.responseTime : 0,
    }
  }

  const totals = (o['totals'] as Record<string, unknown> | undefined) ?? {}
  const convRaw = o['conversionRate']
  const conversionRate =
    typeof convRaw === 'number' ? (convRaw > 1 ? Math.round(convRaw) : Math.round(convRaw * 100)) : 0

  return {
    totalLeads: typeof totals['leads'] === 'number' ? (totals['leads'] as number) : 0,
    activeConversations: typeof totals['conversations'] === 'number' ? (totals['conversations'] as number) : 0,
    appointmentsScheduled: typeof totals['appointments'] === 'number' ? (totals['appointments'] as number) : 0,
    conversionRate,
    revenueGenerated: typeof o['revenue'] === 'number' ? (o['revenue'] as number) : 0,
    responseTime: typeof o['avgResponseMinutes'] === 'number' ? (o['avgResponseMinutes'] as number) : 0,
  }
}

export function useDashboard(): UseDashboardReturn {
  const { user } = useAuth()
  const isSandbox = user?.role === 'demo' || user?.role === 'admin'

  // Pull live local leads (for admin/demo metrics)
  const { leads } = useLeads()

  const [metrics, setMetrics] = useState<DashboardMetricsFlat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const computeSandboxMetrics = useCallback((): DashboardMetricsFlat => {
    const all = [
      ...leads.new,
      ...leads.contacted,
      ...leads.appointment,
      ...leads.onboarded,
      ...leads.closed,
    ]
    const totalLeads = all.length
    const activeConversations = leads.contacted.length + leads.appointment.length
    const appointmentsScheduled = leads.appointment.length
    const closed = leads.closed.length
    const conversionRate = totalLeads > 0 ? Math.round((closed / totalLeads) * 100) : 0

    // Estimate revenue from closed leads' budgets (average of range)
    const revenueGenerated = leads.closed.reduce((sum, l) => sum + parseBudgetToAvg(l.budget_range), 0)

    // Keep a small, plausible responseTime
    const responseTime = 3

    return {
      totalLeads,
      activeConversations,
      appointmentsScheduled,
      conversionRate,
      revenueGenerated,
      responseTime,
    }
  }, [leads])

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (isSandbox) {
        setMetrics(computeSandboxMetrics())
        return
      }

      const connected = await apiClient.testConnection()
      if (!connected) throw new Error('Backend not available')

      if (hasGetDashboardMetrics(apiClient)) {
        const res = await apiClient.getDashboardMetrics()
        if (res?.success && res?.data) {
          setMetrics(toFlatMetrics(res.data))
        } else {
          throw new Error(res?.message || 'Failed to fetch metrics')
        }
      } else if (hasGetAnalytics(apiClient)) {
        const client = apiClient as { getAnalytics: GetAnalyticsFn }
        const res = await client.getAnalytics()
        if (res?.success && res?.data) {
          setMetrics(toFlatMetrics(res.data))
        } else {
          throw new Error(res?.message || 'Analytics not available')
        }
      } else {
        throw new Error('getDashboardMetrics/getAnalytics not available on apiClient')
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      setMetrics(emptyMetrics)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [isSandbox, computeSandboxMetrics])

  const refetch = useCallback(async () => {
    await fetchMetrics()
  }, [fetchMetrics])

  // Initial + whenever leads change (so admin/demo dashboard stays live)
  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics, leads])

  return { metrics, isLoading, error, refetch }
}

