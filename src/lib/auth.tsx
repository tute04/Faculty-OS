import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User, Session, AuthResponse, AuthError } from '@supabase/supabase-js'

interface AuthContext {
  user: User | null
  session: Session | null
  loading: boolean
  recoveryMode: boolean
  setRecoveryMode: (mode: boolean) => void
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: AuthError | null }>
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>
  signUpWithPassword: (email: string, password: string, name: string) => Promise<AuthResponse>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: { name?: string, password?: string }) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
  }

  const signInWithEmail = async (email: string) => {
    return await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })
  }

  const signInWithPassword = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password })
  }

  const signUpWithPassword = async (email: string, password: string, name: string) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin 
      }
    })
  }

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard`
    })
  }

  const updateProfile = async (updates: { name?: string, password?: string }) => {
    const { data, error } = await supabase.auth.updateUser({
      password: updates.password,
      data: updates.name ? { full_name: updates.name } : undefined
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      recoveryMode,
      setRecoveryMode,
      signInWithGoogle, 
      signInWithEmail, 
      signInWithPassword,
      signUpWithPassword,
      resetPassword,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
