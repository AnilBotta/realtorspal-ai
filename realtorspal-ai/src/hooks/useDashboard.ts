import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { DashboardMetrics } from '@/lib/api'

interface UseDashboardReturn {
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// Demo data for admin user
const demoMetrics: DashboardMetrics = {
  totalLeads: 1247,
  activeConversations: 89,
  appointmentsScheduled: 34,
  conversionRate: 23.4,
  revenueGenerated: 127450,
  responseTime: 2.3
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

      // Get current user to check if admin
      const userResponse = await apiClient.getCurrentUser()
      const isAdmin = userResponse.success && userResponse.data.email === 'admin@realtorspal.ai'

      if (isAdmin) {
        // Show demo data for admin
        setMetrics(demoMetrics)
      } else {
        // Show real data for regular users
        const response = await apiClient.getDashboardMetrics()
        if (response.success) {
          setMetrics(response.data)
        } else {
          throw new Error(response.message || 'Failed to fetch metrics')
        }
      }
    } catch (err) {
      console.error('Failed to fetch metrics:', err)
      // For new users or connection issues, show empty state
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
