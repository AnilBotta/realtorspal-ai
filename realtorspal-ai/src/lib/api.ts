// API Client for RealtorsPal AI Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'agent' | 'viewer' | 'demo' // ← added 'demo'
  avatar?: string
  created_at?: string
}

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  property_interest: string
  budget_range: string
  location: string
  source: string
  priority: 'high' | 'medium' | 'low'
  stage: 'new' | 'contacted' | 'appointment' | 'onboarded' | 'closed'
  notes?: string
  assigned_agent_id?: string
  created_at: string
  updated_at: string
}

interface Activity {
  id: string
  lead_id: string
  user_id: string
  type: 'call' | 'email' | 'sms' | 'note' | 'meeting'
  description: string
  created_at: string
}

interface DashboardMetrics {
  totalLeads: number
  activeConversations: number
  appointmentsScheduled: number
  conversionRate: number
  revenueGenerated: number
  responseTime: number
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_BASE_URL
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    }

    // Tag demo users so backend can sandbox/no-op if desired
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('realtorspal_user')
        if (saved) {
          const u = JSON.parse(saved) as Partial<User>
          if (u?.role === 'demo') {
            headers['X-Demo-User'] = 'true'
          }
        }
      }
    } catch {
      // ignore tagging errors
    }

    const config: RequestInit = { ...options, headers }

    try {
      const response = await fetch(url, config)

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Test backend connection
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/health`)
      return response.ok
    } catch {
      return false
    }
  }

  // Authentication
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (response.success && response.data.token) {
      this.token = response.data.token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token)
      }
    }
    return response
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string }>> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
    if (response.success && response.data.token) {
      this.token = response.data.token
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', response.data.token)
      }
    }
    return response
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/me')
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors
    }
    this.token = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('realtorspal_user')
    }
  }

  // Lead Management
  async getLeads(params?: {
    stage?: string
    priority?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<ApiResponse<{ leads: Lead[]; total: number; page: number }>> {
    const queryParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString())
        }
      })
    }
    const endpoint = `/api/leads${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request<{ leads: Lead[]; total: number; page: number }>(endpoint)
  }

  async getLead(id: string): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/api/leads/${id}`)
  }

  async createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    })
  }

  async updateLead(id: string, leadData: Partial<Lead>): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/api/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    })
  }

  async deleteLead(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/leads/${id}`, {
      method: 'DELETE',
    })
  }

  async updateLeadStage(id: string, stage: Lead['stage']): Promise<ApiResponse<Lead>> {
    return this.request<Lead>(`/api/leads/${id}/stage`, {
      method: 'PUT',
      body: JSON.stringify({ stage }),
    })
  }

  // Analytics
  async getDashboardMetrics(): Promise<ApiResponse<DashboardMetrics>> {
    return this.request<DashboardMetrics>('/api/analytics/dashboard')
  }

  // Voice Calls
  async initiateCall(leadId: string, phoneNumber: string): Promise<ApiResponse<{ callId: string; status: string }>> {
    return this.request<{ callId: string; status: string }>('/api/calls/initiate', {
      method: 'POST',
      body: JSON.stringify({ leadId, phoneNumber }),
    })
  }

  async getCallStatus(callId: string): Promise<ApiResponse<{ status: string; duration?: number }>> {
    return this.request<{ status: string; duration?: number }>(`/api/calls/${callId}/status`)
  }

  async endCall(callId: string): Promise<ApiResponse<{ duration: number; status: string }>> {
    return this.request<{ duration: number; status: string }>(`/api/calls/${callId}/end`, {
      method: 'POST',
    })
  }

  // Settings
  async testApiConnection(service: string): Promise<ApiResponse<{ status: string; message: string }>> {
    return this.request(`/api/settings/test-connection`, {
      method: 'POST',
      body: JSON.stringify({ service }),
    })
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient()

// Export types for use in components
export type { User, Lead, Activity, DashboardMetrics, ApiResponse }

