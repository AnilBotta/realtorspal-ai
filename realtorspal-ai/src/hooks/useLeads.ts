import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/api'
import type { Lead } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'

interface UseLeadsReturn {
  leads: Record<Lead['stage'], Lead[]>
  isLoading: boolean
  error: string | null
  addLead: (lead: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>
  updateLead: (id: string, updates: Partial<Lead>) => Promise<boolean>
  updateLeadStage: (id: string, stage: Lead['stage']) => Promise<boolean>
  refetch: () => Promise<void>
  totalLeads: number
}

const emptyLeadGroups: Record<Lead['stage'], Lead[]> = {
  new: [],
  contacted: [],
  appointment: [],
  onboarded: [],
  closed: [],
}

// Demo/Admin seed
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

function groupLeadsByStage(list: Lead[]): Record<Lead['stage'], Lead[]> {
  const grouped: Record<Lead['stage'], Lead[]> = {
    new: [],
    contacted: [],
    appointment: [],
    onboarded: [],
    closed: [],
  }
  for (const lead of list) {
    grouped[lead.stage]?.push(lead)
  }
  return grouped
}

export function useLeads(): UseLeadsReturn {
  const { user } = useAuth()
  const isSandbox = user?.role === 'demo' || user?.role === 'admin'

  const [leads, setLeads] = useState<Record<Lead['stage'], Lead[]>>(emptyLeadGroups)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ensure sandbox demo data is only seeded once
  const initializedRef = useRef(false)

  const fetchLeads = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (isSandbox) {
        // Seed ONCE in sandbox; keep in-memory changes thereafter
        if (!initializedRef.current) {
          setLeads(groupLeadsByStage(DEMO_LEADS))
          initializedRef.current = true
        }
        return
      }

      // Real users: call backend
      const connected = await apiClient.testConnection()
      if (!connected) throw new Error('Backend not available')

      const response = await apiClient.getLeads()
      if (response.success) {
        setLeads(groupLeadsByStage(response.data.leads))
      } else {
        throw new Error(response.message || 'Failed to fetch leads')
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
      setLeads(emptyLeadGroups)
      setError(err instanceof Error ? err.message : 'Failed to load leads')
    } finally {
      setIsLoading(false)
    }
  }, [isSandbox])

  const addLead = useCallback(
    async (leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
      try {
        const { stage = 'new', priority = 'medium', ...rest } = leadData

        if (isSandbox) {
          const fake: Lead = {
            id: `D${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            stage,
            priority,
            ...rest,
          }
          const current = Object.values(leads).flat()
          setLeads(groupLeadsByStage([fake, ...current]))
          return true
        }

        const payload: Omit<Lead, 'id' | 'created_at' | 'updated_at'> = { stage, priority, ...rest }
        const response = await apiClient.createLead(payload)
        if (response.success) {
          await fetchLeads()
          return true
        }
        throw new Error(response.message || 'Failed to create lead')
      } catch (err) {
        console.error('Failed to add lead:', err)
        setError(err instanceof Error ? err.message : 'Failed to add lead')
        return false
      }
    },
    [isSandbox, leads, fetchLeads]
  )

  const updateLead = useCallback(
    async (id: string, updates: Partial<Lead>): Promise<boolean> => {
      try {
        if (isSandbox) {
          const current = Object.values(leads).flat()
          const next = current.map(l =>
            l.id === id ? { ...l, ...updates, updated_at: new Date().toISOString() } : l
          )
          setLeads(groupLeadsByStage(next))
          return true
        }

        const response = await apiClient.updateLead(id, updates)
        if (response.success) {
          await fetchLeads()
          return true
        }
        throw new Error(response.message || 'Failed to update lead')
      } catch (err) {
        console.error('Failed to update lead:', err)
        setError(err instanceof Error ? err.message : 'Failed to update lead')
        return false
      }
    },
    [isSandbox, leads, fetchLeads]
  )

  const updateLeadStage = useCallback(
    async (id: string, newStage: Lead['stage']): Promise<boolean> => {
      try {
        if (isSandbox) {
          const current = Object.values(leads).flat()
          const next = current.map(l =>
            l.id === id ? { ...l, stage: newStage, updated_at: new Date().toISOString() } : l
          )
          setLeads(groupLeadsByStage(next))
          return true
        }

        const response = await apiClient.updateLeadStage(id, newStage)
        if (response.success) {
          await fetchLeads()
          return true
        }
        throw new Error(response.message || 'Failed to update lead stage')
      } catch (err) {
        console.error('Failed to update lead stage:', err)
        setError(err instanceof Error ? err.message : 'Failed to update lead stage')
        return false
      }
    },
    [isSandbox, leads, fetchLeads]
  )

  const refetch = useCallback(async () => {
    // In sandbox, do NOT refetch (avoid resetting demo changes)
    if (isSandbox) return
    await fetchLeads()
  }, [fetchLeads, isSandbox])

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

