import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: window.localStorage,
      storageKey: 'faculty-os-token-v5', 
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: (name, acquireTimeout, fn) => {
        // BYPASS DEFINITIVO: Firma correcta del LockFunc en @supabase/auth-js para evitar bucles de Web Locks en Vite
        return fn()
      }
    }
  }
)
