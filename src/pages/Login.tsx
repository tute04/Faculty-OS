import React, { useState } from 'react'
import { useAuth } from '../lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, GraduationCap, ArrowRight } from 'lucide-react'

export const Login = () => {
  const { signInWithGoogle, signInWithEmail, signInWithPassword, signUpWithPassword, resetPassword } = useAuth()
  
  // Modos: 'magic' | 'password' | 'signup'
  const [mode, setMode] = useState<'magic' | 'password' | 'signup'>('magic')
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    
    try {
      if (mode === 'magic') {
        const { error } = await signInWithEmail(email)
        if (error) throw error
        setMessage({ text: 'Checkeá tu mail, te mandamos un link mágico para entrar.', type: 'success' })
      } 
      else if (mode === 'signup') {
        if (!name) throw new Error('Por favor, decinos como te llamás.')
        const { error } = await signUpWithPassword(email, password, name)
        if (error) throw error
        setMessage({ text: '¡Cuenta creada! Confirmá tu email o intentá entrar.', type: 'success' })
      } 
      else {
        const { error } = await signInWithPassword(email, password)
        if (error) throw error
      }
    } catch (error: any) {
      let errorMsg = error.message
      if (errorMsg === 'User already registered') errorMsg = 'Este email ya existe. Si no tenés contraseña, usá el acceso "Sin Pass".'
      if (errorMsg === 'Invalid login credentials') errorMsg = 'Email o contraseña incorrectos.'
      setMessage({ text: errorMsg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async () => {
    if (!email) {
      setMessage({ text: 'Poné tu email primero para que sepamos a quién mandarle el link.', type: 'error' })
      return
    }
    setLoading(true)
    try {
      const { error } = await resetPassword(email)
      if (error) throw error
      setMessage({ text: 'Te mandamos un mail para que elijas tu contraseña nueva. ¡Revisalo!', type: 'success' })
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#090909] text-[#e1e1e1] selection:bg-amber/30 selection:text-amber">
      <div className="w-full max-w-[400px] px-6">
        
        {/* Header Central */}
        <header className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#1a1a1a] border border-white/5 shadow-inner"
          >
            <GraduationCap className="h-7 w-7 text-amber" />
          </motion.div>
          
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">
            Faculty OS
          </h1>
          <p className="text-sm text-[#888]">
            Tu entorno de estudio, simplificado.
          </p>
        </header>

        {/* Card de Auth */}
        <div className="bg-[#111111] border border-white/[0.05] rounded-[24px] p-8 shadow-2xl">
          
          {/* Selector de modo sutil */}
          <div className="grid grid-cols-3 bg-[#0a0a0a] rounded-xl p-1 mb-6 border border-white/[0.03]">
            {[
              { id: 'magic', label: 'Sin Pass' },
              { id: 'password', label: 'Con Pass' },
              { id: 'signup', label: 'Crear' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id as any); setMessage(null); }}
                className={`py-2 text-[11px] font-bold transition-all rounded-lg uppercase tracking-wider ${
                  mode === m.id ? 'bg-[#222] text-white shadow-sm' : 'text-[#444] hover:text-[#777]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {mode === 'signup' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="block text-[10px] font-bold text-[#444] uppercase tracking-widest mb-1.5 ml-1">Tu nombre</label>
                  <input 
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Mateo"
                    className="w-full h-11 bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-4 text-sm focus:border-amber/50 transition-colors outline-none"
                    required={mode === 'signup'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="block text-[10px] font-bold text-[#444] uppercase tracking-widest mb-1.5 ml-1">Email</label>
              <input 
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="hola@uniflo.com"
                className="w-full h-11 bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-4 text-sm focus:border-amber/50 transition-colors outline-none"
                required
              />
            </div>

            <AnimatePresence mode="popLayout">
              {mode !== 'magic' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <label className="block text-[10px] font-bold text-[#444] uppercase tracking-widest mb-1.5 ml-1">Contraseña</label>
                  <input 
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 bg-[#0a0a0a] border border-white/[0.05] rounded-xl px-4 text-sm focus:border-amber/50 transition-colors outline-none"
                    required={mode !== 'magic'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <button
              disabled={loading}
              className="w-full h-11 bg-[#eee] hover:bg-white text-black font-bold text-sm rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="animate-spin size-4" /> : (
                <>
                  <span>{mode === 'magic' ? 'Entrar directo' : mode === 'signup' ? 'Crear mi cuenta' : 'Ingresar'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <AnimatePresence>
            {mode === 'password' && (
              <motion.button 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                type="button"
                onClick={handleSetPassword}
                className="mt-4 text-[11px] font-bold text-amber hover:text-amber-soft w-full text-center uppercase tracking-tighter"
              >
                ¿Ya tenés materias pero no tenés clave? Click acá.
              </motion.button>
            )}
          </AnimatePresence>

          {message && (
            <div className={`mt-5 p-3 rounded-lg text-xs font-medium border ${
              message.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-amber/5 border-amber/20 text-amber'
            }`}>
              {message.text}
            </div>
          )}

          {/* Social login sutil */}
          <div className="mt-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-px flex-1 bg-white/[0.05]" />
              <span className="text-[10px] uppercase font-bold text-[#333] tracking-[0.2em]">O</span>
              <div className="h-px flex-1 bg-white/[0.05]" />
            </div>

            <button 
              onClick={signInWithGoogle}
              className="w-full h-11 border border-white/[0.05] rounded-xl flex items-center justify-center gap-3 text-sm font-semibold hover:bg-white/[0.03] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
