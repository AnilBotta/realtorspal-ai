import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { DashboardMetrics } from '@/lib/api'

interface UseDashboardReturn {
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Empty state for new users
const emptyMetrics: DashboardMetrics = {
  totalLeads: 0,
  activeConversations: 0,
  appointmentsScheduled: 0,
  conversionRate: 0,
  revenueGenerated: 0,
  responseTime: 0
}

export function useDashboard(): UseDashboardReturn {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Test backend connection first
      const connectionTest = await apiClient.testConnection()
      if (!connectionTest) {
        throw new Error('Backend not available')
      }

      // Fetch real user metrics
      const response = await apiClient.getDashboardMetrics()
      if (response.success) {
        setMetrics(response.data)
      } else {
        throw new Error(response.message || 'Failed to fetch metrics')
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      // For new users or connection issues, show empty state instead of demo data
      setMetrics(emptyMetrics)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    await fetchMetrics()
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  return {
    metrics,
    isLoading,
    error,
    refetch
  }
}
