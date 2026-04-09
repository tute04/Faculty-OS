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
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)

  const loading = authLoading || profileLoading

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
          
        }
      } else if (data) {
        setProfile(data)
      }
    } catch (err) {
      
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      
      try {
        
        const { data: { session }, error } = await supabase.auth.getSession()
        

        if (error) throw error
        
        if (mounted) {
          setSession(session ? { ...session } : null)
          setUser(session?.user ?? null)
        }

        if (session?.user && mounted) {
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          
          if (mounted && profile) setProfile(profile)
        }
      } catch (err) {
        
      } finally {
        
        if (mounted) {
          setAuthLoading(false)
          setProfileLoading(false)
        }
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        
        if (!mounted || event === 'INITIAL_SESSION') return
        
        setSession(currentSession ? { ...currentSession } : null)
        setUser(currentSession?.user ?? null)
        
        try {
          if (event === 'SIGNED_OUT') {
            setProfile(null)
          } else if (currentSession?.user && event === 'SIGNED_IN') {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentSession.user.id)
              .single()
            if (profile) setProfile(profile)
          }
        } catch (err) {
          
        }
      }
    )

    // FALLBACK DE SEGURIDAD EXTREMA: Si nada resuelve en 3.5s, liberamos la UI.
    const emergencyTimeout = setTimeout(() => {
      
      if (mounted) {
        setAuthLoading(false)
        setProfileLoading(false)
      }
    }, 3500)

    return () => {
      mounted = false
      clearTimeout(emergencyTimeout)
      subscription.unsubscribe()
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
