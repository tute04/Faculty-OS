import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { User, Session, AuthError } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  university?: string
  career?: string
  year_of_study?: number
  updated_at?: string
}

interface AuthContext {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>
  updateProfile: (data: Partial<Profile>) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContext | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({ id: userId, email: currentUser?.email })
            .select()
            .single()
          if (!insertError && newProfile) setProfile(newProfile)
        } else {
          console.error('Auth: fetchProfile error:', error)
        }
      } else if (data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Auth: fetchProfile unexpected error:', err)
    }
  }

  useEffect(() => {
    let mounted = true
    
    // Safety timeout: don't stay loading forever if Supabase hangs
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth initialization timed out. Forcing UI to load.')
        setLoading(false)
      }
    }, 6000)

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) await fetchProfile(session.user.id, session.user)
      } catch (err) {
        console.error('Auth: Initialization failed:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          clearTimeout(safetyTimeout)
        }
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'INITIAL_SESSION') return

      if (event === 'SIGNED_OUT') {
        setSession(null)
        setUser(null)
        setProfile(null)
        setLoading(false)
        clearTimeout(safetyTimeout)
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      try {
        if (session?.user) {
          await fetchProfile(session.user.id, session.user)
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('Auth: Profile fetch on state change failed:', err)
      } finally {
        if (mounted) {
          setLoading(false)
          clearTimeout(safetyTimeout)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    // Tell Supabase to sign out, then force redirect regardless of outcome
    supabase.auth.signOut().catch(console.error)
    localStorage.clear()
    sessionStorage.clear()
    window.location.replace('/login')
  }

  const resetPassword = async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`
    })
  }

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password })
    return { error }
  }

  const updateProfile = async (updates: Partial<Profile>): Promise<{ error: any }> => {
    if (!user) return { error: new Error('No user') }
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, ...updates, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .select()
      .single()
    if (error) {
      console.error('Auth: updateProfile error:', error)
      return { error }
    }
    if (data) setProfile(data)
    return { error: null }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile,
      loading, 
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      refreshProfile
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
