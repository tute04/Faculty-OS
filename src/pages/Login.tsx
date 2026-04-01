import React, { useState } from 'react'
import { useAuth } from '../lib/auth'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User as UserIcon, Loader2, Sparkles, GraduationCap, ChevronRight, ArrowLeft } from 'lucide-react'

export const Login = () => {
  const { signInWithGoogle, signInWithPassword, signUpWithPassword } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    try {
      if (isSignUp) {
        if (!name) throw new Error('Por favor, ingresá tu nombre')
        const { error } = await signUpWithPassword(email, password, name)
        if (error) throw error
        setMessage('¡Cuenta creada! Ya podés ingresar.')
        setIsSignUp(false)
      } else {
        const { error } = await signInWithPassword(email, password)
        if (error) throw error
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message || 'Ocurrió un problema'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#0d0b08] font-sans selection:bg-amber/30 selection:text-amber">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-amber/5 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -50, 0],
            y: [0, 120, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-orange/5 blur-[120px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-[460px] px-6"
      >
        <div className="relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.02] p-8 shadow-2xl backdrop-blur-2xl sm:p-12">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div className="flex flex-col items-center gap-6 mb-10 text-center">
            <motion.div 
              layoutId="logo"
              className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber to-orange-500 shadow-xl shadow-amber/20"
            >
              <GraduationCap className="h-8 w-8 text-[#17130b]" strokeWidth={2.5} />
              <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-lg bg-white p-1 shadow-sm">
                 <Sparkles className="h-4 w-4 text-amber" />
              </div>
            </motion.div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Faculty <span className="text-amber">OS</span>
              </h1>
              <p className="text-[15px] font-medium text-text-muted/80">
                {isSignUp ? 'Crea tu cuenta personalizada' : 'Tu centro de comando académico'}
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  className="space-y-2 overflow-hidden"
                >
                  <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-text-muted/60">
                    Tu Nombre
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-text-muted group-focus-within:text-amber transition-colors">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <input 
                      type="text"
                      placeholder="¿Como te llamamos?"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-[56px] w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-12 pr-4 text-[15px] text-white placeholder:text-text-muted/40 outline-none transition-all focus:border-amber/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-amber/5"
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-text-muted/60">
                Email
              </label>
              <div className="group relative">
                <div className="absolute inset-y-0 left-4 flex items-center text-text-muted group-focus-within:text-amber transition-colors">
                  <Mail className="h-5 w-5" />
                </div>
                <input 
                  type="email"
                  placeholder="ejempl@universidad.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[56px] w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-12 pr-4 text-[15px] text-white placeholder:text-text-muted/40 outline-none transition-all focus:border-amber/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-amber/5"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="ml-1 text-[11px] font-bold uppercase tracking-widest text-text-muted/60">
                Contraseña
              </label>
              <div className="group relative">
                <div className="absolute inset-y-0 left-4 flex items-center text-text-muted group-focus-within:text-amber transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input 
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[56px] w-full rounded-2xl border border-white/5 bg-white/[0.03] pl-12 pr-4 text-[15px] text-white placeholder:text-text-muted/40 outline-none transition-all focus:border-amber/40 focus:bg-white/[0.05] focus:ring-4 focus:ring-amber/5"
                  required
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="relative mt-2 h-[56px] w-full overflow-hidden rounded-2xl bg-amber text-[15px] font-bold text-[#17130b] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <span>{isSignUp ? 'Crear Cuenta' : 'Entrar al Dashboard'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </div>
            </button>
          </form>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 rounded-xl border p-3 text-center text-xs font-medium ${
                  message.includes('Error') 
                    ? "border-red-500/20 bg-red-500/5 text-red-400" 
                    : "border-amber/20 bg-amber/5 text-amber"
                }`}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col gap-4">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="group flex items-center justify-center gap-2 text-[13px] font-semibold text-text-muted/60 transition-colors hover:text-amber"
            >
              {isSignUp ? (
                <>
                  <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  <span>¿Ya tenés cuenta? Inicia sesión</span>
                </>
              ) : (
                <span>¿No tenés cuenta? Registrate gratis</span>
              )}
            </button>

            {!isSignUp && (
              <>
                <div className="flex items-center gap-4 px-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted/40">o</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                
                <button
                  onClick={signInWithGoogle}
                  className="group flex h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] text-[15px] font-semibold text-white transition-all hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98]"
                >
                  <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  <span>Continuar con Google</span>
                </button>
              </>
            )}
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-[11px] font-medium leading-relaxed text-text-muted/40">
              Control de privacidad activado. <br />
              Tus datos están encriptados y son solo tuyos.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
