import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/lib/api'
import type { Lead } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

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
  closed: [],
}

// Demo-only seed (shown when showDemo === true)
const DEMO_LEADS: Lead[] = [
  {
    id: 'D1',
    name: 'John Carter',
    email: 'john@example.com',
    phone: '555-0101',
    property_interest: '3BR Condo - Downtown',
    budget_range: '$400K - $500K',
    location: 'Downtown',
    source: 'Website',
    priority: 'high',
    stage: 'new',
    notes: 'Wants parking',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'D2',
    name: 'Mia Nguyen',
    email: 'mia@example.com',
    phone: '555-0102',
    property_interest: 'Townhouse - Suburbs',
    budget_range: '$700K - $900K',
    location: 'Suburbs',
    source: 'Referral',
    priority: 'medium',
    stage: 'contacted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function groupLeadsByStage(leadsArray: Lead[]): Record<string, Lead[]> {
  const grouped: Record<string, Lead[]> = {
    new: [],
    contacted: [],
    appointment: [],
    onboarded: [],
    closed: [],
  }

  leadsArray.forEach((lead) => {
    if (grouped[lead.stage]) {
      grouped[lead.stage].push(lead)
    }
  })

  return grouped
}

export function useLeads(): UseLeadsReturn {
  const { user } = useAuth()
  // Admins ALSO see demo data
  const showDemo = user?.role === 'demo' || user?.role === 'admin'

  const [leads, setLeads] = useState<Record<string, Lead[]>>(emptyLeadGroups)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Demo/admin users: show local seed data
      if (showDemo) {
        setLeads(groupLeadsByStage(DEMO_LEADS))
        return
      }

      // Real users: call backend
      const connected = await apiClient.testConnection()
      if (!connected) {
        throw new Error('Backend not available')
      }

      const response = await apiClient.getLeads()
      if (response.success) {
        const groupedLeads = groupLeadsByStage(response.data.leads)
        setLeads(groupedLeads)
      } else {
        throw new Error(response.message || 'Failed to fetch leads')
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
      // Non-demo/admin users: empty state on failure
      setLeads(emptyLeadGroups)
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setIsLoading(false)
    }
  }, [showDemo])

  const addLead = useCallback(
    async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
      try {
        // Normalize once with safe defaults (prevents duplicate keys)
        const {
          stage = 'new',
          priority = 'medium',
          ...restLead
        } = leadData

        if (showDemo) {
          const fake: Lead = {
            id: `D${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...restLead,
            stage,
            priority,
          }
          const current = Object.values(leads).flat()
          setLeads(groupLeadsByStage([fake, ...current]))
          return true
        }

        // Send normalized payload to backend as well
        const payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = {
          ...restLead,
          stage,
          priority,
        }

        const response = await apiClient.createLead(payload)
        if (response.success) {
          await fetchLeads()
          return true
        } else {
          throw new Error(response.message || 'Failed to create lead')
        }
      } catch (err) {
        console.error('Failed to add lead:', err)
        setError(err instanceof Error ? err.message : 'Failed to add lead')
        return false
      }
    },
    [showDemo, leads, fetchLeads]
  )

  const updateLead = useCallback(
    async (id: string, updates: Partial<Lead>): Promise<boolean> => {
      try {
        if (showDemo) {
          const current = Object.values(leads).flat()
          const next = current.map((l) =>
            l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
          )
          setLeads(groupLeadsByStage(next))
          return true
        }

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
    },
    [showDemo, leads, fetchLeads]
  )

  const updateLeadStage = useCallback(
    async (id: string, newStage: Lead['stage']): Promise<boolean> => {
      try {
        if (showDemo) {
          const current = Object.values(leads).flat()
          const next = current.map((l) =>
            l.id === id ? { ...l, stage: newStage, updated_at: new Date().toISOString() } : l
          )
          setLeads(groupLeadsByStage(next))
          return true
        }

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
    },
    [showDemo, leads, fetchLeads]
  )

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
    totalLeads,
  }
}

