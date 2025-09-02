"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import type { User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  backendConnected: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [backendConnected, setBackendConnected] = useState(false)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Detect backend availability
        const connected = await apiClient.testConnection()
        setBackendConnected(connected)

        // Restore session
        const savedUser = localStorage.getItem('realtorspal_user')
        const token = localStorage.getItem('auth_token')

        if (savedUser && token && connected) {
          try {
            const response = await apiClient.getCurrentUser()
            if (response.success) {
              setUser(response.data)
            } else {
              setUser(JSON.parse(savedUser))
            }
          } catch {
            setUser(JSON.parse(savedUser))
          }
        } else if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
      } catch (error) {
        console.warn('Auth initialization failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    // Try real backend first
    try {
      if (backendConnected) {
        const response = await apiClient.login(email, password)
        if (response.success) {
          const userData: User = {
            ...response.data.user,
            avatar:
              response.data.user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(response.data.user.name)}&background=6366f1&color=fff`,
          }
          setUser(userData)
          localStorage.setItem('realtorspal_user', JSON.stringify(userData))
          setIsLoading(false)
          return true
        }
      }
    } catch (error) {
      console.warn('Backend login failed, checking explicit demo/admin fallback:', error)
    }

    // Explicit demo login
    if (email === 'demo@realtorspal.ai' && password === 'demo123') {
      const demoUser: User = {
        id: 'demo-1',
        email,
        name: 'RealtorsPal Demo',
        role: 'demo',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('Demo')}&background=6366f1&color=fff`,
      }
      setUser(demoUser)
      localStorage.setItem('realtorspal_user', JSON.stringify(demoUser))
      setIsLoading(false)
      return true
    }

    // Optional admin fallback
    if (email === 'admin@realtorspal.ai' && password === 'password123') {
      const demoAdmin: User = {
        id: 'admin-1',
        email,
        name: 'RealtorsPal Admin',
        role: 'admin',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent('Admin')}&background=6366f1&color=fff`,
      }
      setUser(demoAdmin)
      localStorage.setItem('realtorspal_user', JSON.stringify(demoAdmin))
      setIsLoading(false)
      return true
    }

    setIsLoading(false)
    return false
  }

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      if (backendConnected) {
        const response = await apiClient.register(email, password, name)
        if (response.success) {
          const userData: User = {
            ...response.data.user,
            avatar:
              response.data.user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
          }
          setUser(userData)
          localStorage.setItem('realtorspal_user', JSON.stringify(userData))
          setIsLoading(false)
          return true
        }
      }
    } catch (error) {
      console.warn('Backend signup failed:', error)
    }

    // No demo/agent auto-signup fallback
    setIsLoading(false)
    return false
  }

  const logout = async () => {
    try {
      if (backendConnected) {
        await apiClient.logout()
      }
    } catch (error) {
      console.warn('Backend logout failed:', error)
    }

    setUser(null)
    localStorage.removeItem('realtorspal_user')
    localStorage.removeItem('auth_token')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, backendConnected }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

