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

// Demo data for admin user
const demoLeads: Lead[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+1 (555) 123-4567',
    property_interest: '3BR Condo',
    budget_range: '$450K - $500K',
    location: 'Downtown',
    source: 'Facebook Ad',
    priority: 'high',
    stage: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Mike Chen',
    email: 'mike.chen@email.com',
    phone: '+1 (555) 987-6543',
    property_interest: '2BR Apartment',
    budget_range: '$300K - $350K',
    location: 'Midtown',
    source: 'LinkedIn',
    priority: 'medium',
    stage: 'new',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Emily Davis',
    email: 'emily.d@email.com',
    phone: '+1 (555) 456-7890',
    property_interest: '4BR House',
    budget_range: '$650K - $750K',
    location: 'Suburbs',
    source: 'Referral',
    priority: 'high',
    stage: 'contacted',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'David Wilson',
    email: 'david.w@email.com',
    phone: '+1 (555) 321-0987',
    property_interest: 'Luxury Penthouse',
    budget_range: '$1M+',
    location: 'Downtown',
    source: 'Google Ads',
    priority: 'high',
    stage: 'appointment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Lisa Rodriguez',
    email: 'lisa.r@email.com',
    phone: '+1 (555) 654-3210',
    property_interest: '2BR Condo',
    budget_range: '$400K - $450K',
    location: 'Waterfront',
    source: 'Website',
    priority: 'medium',
    stage: 'onboarded',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    name: 'Robert Kim',
    email: 'robert.k@email.com',
    phone: '+1 (555) 789-0123',
    property_interest: '3BR Townhouse',
    budget_range: '$525K',
    location: 'Historic District',
    source: 'Referral',
    priority: 'low',
    stage: 'closed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

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

      // Get current user to check if admin
      const userResponse = await apiClient.getCurrentUser()
      const isAdmin = userResponse.success && userResponse.data.email === 'admin@realtorspal.ai'

      if (isAdmin) {
        // Show demo leads for admin
        const groupedDemoLeads = groupLeadsByStage(demoLeads)
        setLeads(groupedDemoLeads)
      } else {
        // Show real leads for regular users
        const response = await apiClient.getLeads()
        if (response.success) {
          const groupedLeads = groupLeadsByStage(response.data.leads)
          setLeads(groupedLeads)
        } else {
          throw new Error(response.message || 'Failed to fetch leads')
        }
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err)
      // For new users or connection issues, show empty state
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
