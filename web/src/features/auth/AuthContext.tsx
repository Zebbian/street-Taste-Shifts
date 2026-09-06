import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, onAuthStateChange, signInWithPassword, signOut as supabaseSignOut } from '../../lib/supabaseAuth'
import { apiClient } from '../../lib/apiClient'
import type { User } from '../../types/api'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadUser() {
    try {
      const { user } = await apiClient.get<{ user: User }>('/api/users/me')
      setUser(user)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    let active = true

    getSession().then(async (s) => {
      if (!active) return
      setSession(s)
      if (s) await loadUser()
      setLoading(false)
    })

    const unsubscribe = onAuthStateChange(async (s) => {
      setSession(s)
      if (s) {
        await loadUser()
      } else {
        setUser(null)
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithPassword(email, password)
  }

  async function signOut() {
    await supabaseSignOut()
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
