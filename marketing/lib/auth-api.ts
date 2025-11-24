// API base URL - Dynamically determine based on environment
const getAPIUrl = () => {
  // If explicitly set, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL
    // Ensure it ends with /api if not already present
    return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`
  }
  
  // In browser, check if we're on localhost or preview
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    // If on localhost, use local backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8001/api'
    }
    
    // If on preview environment, use preview backend
    if (hostname.includes('preview.emergentagent.com')) {
      return `${window.location.protocol}//${hostname}/api`
    }
    
    // If on Vercel deployment, use the deployed backend
    if (hostname.includes('vercel.app')) {
      // User should set NEXT_PUBLIC_API_URL in Vercel environment variables
      // For now, use the preview backend as fallback
      return 'https://realtor-dashboard-3.preview.emergentagent.com/api'
    }
  }
  
  // Default fallback
  return 'https://realtor-dashboard-3.preview.emergentagent.com/api'
}

const API_URL = getAPIUrl()

export interface User {
  id: string
  email: string
  name: string
}

export interface AuthResponse {
  user: User
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  first_name?: string
  last_name?: string
  company?: string
}

class AuthAPI {
  async signup(data: SignupData): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Signup failed' }))
      throw new Error(error.detail || 'Signup failed')
    }

    return response.json()
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }))
      throw new Error(error.detail || 'Login failed')
    }

    return response.json()
  }

  async logout(): Promise<void> {
    const token = localStorage.getItem('access_token')
    if (!token) return

    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    })
  }

  async getCurrentUser(token: string): Promise<User> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to get user')
    }

    return response.json()
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    return response.json()
  }
}

export const authAPI = new AuthAPI()