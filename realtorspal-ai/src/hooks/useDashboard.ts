import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface UseDashboardReturn {
  metrics: DashboardMetricsFlat | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Flat shape used by MetricsOverview
type DashboardMetricsFlat = {
  totalLeads: number
  activeConversations: number
  appointmentsScheduled: number
  conversionRate: number // percent 0–100
  revenueGenerated: number
  responseTime: number   // minutes
}

// Empty state for non-demo users when backend has no data / is down
const emptyMetrics: DashboardMetricsFlat = {
  totalLeads: 0,
  activeConversations: 0,
  appointmentsScheduled: 0,
  conversionRate: 0,
  revenueGenerated: 0,
  responseTime: 0,
}

// Demo seed (shown for admin + demo)
const demoMetrics: DashboardMetricsFlat = {
  totalLeads: 128,
  activeConversations: 6,
  appointmentsScheduled: 11,
  conversionRate: 23, // percent
  revenueGenerated: 18450,
  responseTime: 3,
}

// Type guards (no `any`)
type GetDashboardMetricsFn = () => Promise<{ success: boolean; data?: unknown; message?: string }>
function hasGetDashboardMetrics(client: unknown): client is { getDashboardMetrics: GetDashboardMetricsFn } {
  if (typeof client !== 'object' || client === null) return false
  const c = client as Record<string, unknown>
  return typeof c['getDashboardMetrics'] === 'function'
}

type GetAnalyticsFn = () => Promise<{ success: boolean; data?: unknown; message?: string }>
function hasGetAnalytics(client: unknown): client is { getAnalytics: GetAnalyticsFn } {
  if (typeof client !== 'object' || client === null) return false
  const c = client as Record<string, unknown>
  return typeof c['getAnalytics'] === 'function'
}

// Normalize various backend shapes into the flat shape expected by the component
function toFlatMetrics(input: unknown): DashboardMetricsFlat {
  if (typeof input !== 'object' || input === null) return emptyMetrics
  const o = input as Record<string, unknown>

  // If backend already returns flat fields, use them
  const flatLike =
    'totalLeads' in o ||
    'activeConversations' in o ||
    'appointmentsScheduled' in o ||
    'revenueGenerated' in o ||
    'responseTime' in o

  if (flatLike) {
    return {
      totalLeads: typeof o.totalLeads === 'number' ? o.totalLeads : 0,
      activeConversations: typeof o.activeConversations === 'number' ? o.activeConversations : 0,
      appointmentsScheduled: typeof o.appointmentsScheduled === 'number' ? o.appointmentsScheduled : 0,
      conversionRate: typeof o.conversionRate === 'number' ? o.conversionRate : 0, // assume percent
      revenueGenerated: typeof o.revenueGenerated === 'number' ? o.revenueGenerated : 0,
      responseTime: typeof o.responseTime === 'number' ? o.responseTime : 0,
    }
  }

  // If backend returns analytics-style nested data, map it
  const totals = (o['totals'] as Record<string, unknown> | undefined) ?? {}

  const convRateRaw = o['conversionRate']
  const conversionRate =
    typeof convRateRaw === 'number' ? (convRateRaw > 1 ? Math.round(convRateRaw) : Math.round(convRateRaw * 100)) : 0

  return {
    totalLeads: typeof totals['leads'] === 'number' ? (totals['leads'] as number) : 0,
    activeConversations: typeof totals['conversations'] === 'number' ? (totals['conversations'] as number) : 0,
    appointmentsScheduled: typeof totals['appointments'] === 'number' ? (totals['appointments'] as number) : 0,
    conversionRate, // percent (0–100)
    revenueGenerated: typeof o['revenue'] === 'number' ? (o['revenue'] as number) : 0,
    responseTime: typeof o['avgResponseMinutes'] === 'number' ? (o['avgResponseMinutes'] as number) : 0,
  }
}

export function useDashboard(): UseDashboardReturn {
  const { user } = useAuth()
  const showDemo = user?.role === 'demo' || user?.role === 'admin'

  const [metrics, setMetrics] = useState<DashboardMetricsFlat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (showDemo) {
        setMetrics(demoMetrics)
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
        // 👇 Cast to a local, properly-typed variable before calling
        const clientWithAnalytics = apiClient as { getAnalytics: GetAnalyticsFn }
        const res = await clientWithAnalytics.getAnalytics()
        if (res?.success && res?.data) {
          setMetrics(toFlatMetrics(res.data))
        } else {
          throw new Error(res?.message || 'Analytics not available on apiClient')
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
  }, [showDemo])

  const refetch = useCallback(async () => {
    await fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return { metrics, isLoading, error, refetch }
}

