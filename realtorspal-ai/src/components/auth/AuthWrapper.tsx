"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { LoginForm } from "./LoginForm"
import { SignupForm } from "./SignupForm"
import { Dashboard } from "../dashboard/Dashboard"
import { Card, CardContent } from "@/components/ui/card"
import { Bot } from "lucide-react"

export function AuthWrapper() {
  const { user, isLoading } = useAuth()
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-slate-200/50">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4 animate-pulse">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-700 mb-2">RealtorsPal AI</h2>
            <p className="text-slate-600 text-center">Loading your dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return authMode === 'login' ? (
      <LoginForm onSwitchToSignup={() => setAuthMode('signup')} />
    ) : (
      <SignupForm onSwitchToLogin={() => setAuthMode('login')} />
    )
  }

  return <Dashboard />
}
