import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import type { Lead } from '@/lib/api'

interface UseLeadsReturn {
  leads: Record<string, Lead[]>
  isLoading: boolean
  error: string | null
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<boolean>
  updateLeadStage: (id: string, stage: Lead['stage']) => Promise<boolean>
  refetch: () => Promise<void>
  totalLeads: number
}

// Empty state initialization
const emptyLeadGroups: Record<string, Lead[]> = {
  new: [],
  contacted: [],
  appointment: [],
  onboarded: [],
  closed: []
}

function groupLeadsByStage(leadsArray: Lead[]): Record<string, Lead[]> {
  const grouped: Record<string, Lead[]> = {
    new: [],
    contacted: [],
    appointment: [],
    onboarded: [],
    closed: []
  }

  leadsArray.forEach(lead => {
    if (grouped[lead.stage]) {
      grouped[lead.stage].push(lead)
    }
  })

  return grouped
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Record<string, Lead[]>>(emptyLeadGroups)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Test backend connection first
      const connectionTest = await apiClient.testConnection()
      if (!connectionTest) {
        throw new Error('Backend not available')
      }

      // Try to fetch from backend
      const response = await apiClient.getLeads()
      if (response.success) {
        const groupedLeads = groupLeadsByStage(response.data.leads)
        setLeads(groupedLeads)
      } else {
        throw new Error(response.message || 'Failed to fetch leads')
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
      // For new users or connection issues, show empty state instead of demo data
      setLeads(emptyLeadGroups)
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addLead = useCallback(async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      // Always try to use the backend
      const response = await apiClient.createLead(leadData)
      if (response.success) {
        await fetchLeads() // Refresh the leads
        return true
      } else {
        throw new Error(response.message || 'Failed to create lead')
      }
    } catch (err) {
      console.error('Failed to add lead:', err)
      setError(err instanceof Error ? err.message : 'Failed to add lead')
      return false
    }
  }, [fetchLeads])

  const updateLead = useCallback(async (id: string, updates: Partial<Lead>): Promise<boolean> => {
    try {
      const response = await apiClient.updateLead(id, updates)
      if (response.success) {
        await fetchLeads()
        return true
      } else {
        throw new Error(response.message || 'Failed to update lead')
      }
    } catch (err) {
      console.error('Failed to update lead:', err)
      setError(err instanceof Error ? err.message : 'Failed to update lead')
      return false
    }
  }, [fetchLeads])

  const updateLeadStage = useCallback(async (id: string, newStage: Lead['stage']): Promise<boolean> => {
    try {
      const response = await apiClient.updateLeadStage(id, newStage)
      if (response.success) {
        await fetchLeads()
        return true
      } else {
        throw new Error(response.message || 'Failed to update lead stage')
      }
    } catch (err) {
      console.error('Failed to update lead stage:', err)
      setError(err instanceof Error ? err.message : 'Failed to update lead stage')
      return false
    }
  }, [fetchLeads])

  const refetch = useCallback(async () => {
    await fetchLeads()
  }, [fetchLeads])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const totalLeads = Object.values(leads).flat().length

  return {
    leads,
    isLoading,
    error,
    addLead,
    updateLead,
    updateLeadStage,
    refetch,
    totalLeads
  }
}
