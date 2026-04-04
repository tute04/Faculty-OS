import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Eye, EyeOff, CheckCircle2, Sparkles, ChevronRight, GraduationCap } from 'lucide-react'
import { cn } from '../lib/utils'

type Tab = 'login' | 'signup'
type Step = 1 | 2

export const Login = () => {
  const { signIn, signUp, updateProfile, user } = useAuth()
  const navigate = useNavigate()

  // Already logged in? Go to dashboard immediately
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user])
  const [tab, setTab] = useState<Tab>('login')
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form State
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [university, setUniversity] = useState('')
  const [career, setCareer] = useState('')
  const [yearOfStudy, setYearOfStudy] = useState(1)

  useEffect(() => {
    setError(null)
  }, [tab, step, email, password, confirmPass])

  const getPassStrength = (p: string) => {
    if (p.length === 0) return 0
    if (p.length < 6) return 1
    if (p.length < 10) return 2
    return 3
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return setError('Completá todos los campos')
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) {
        setError('Email o contraseña incorrectos')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPass) return setError('Completá todos los campos')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirmPass) return setError('Las contraseñas no coinciden')
    setStep(2)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!firstName || !lastName || !university || !career) return setError('Completá todos los campos')
    setLoading(true)
    try {
      const { error } = await signUp(email, password)
      if (error) {
        if (error.message?.includes('already registered')) {
          setError('Ya existe una cuenta con ese email.')
        } else {
          setError('Error al crear la cuenta. Intentá de nuevo.')
        }
        return
      }
      await updateProfile({ first_name: firstName, last_name: lastName, university, career, year_of_study: yearOfStudy })
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 3000)
    } catch (err) {
      setError('Error inesperado. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const tabVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }

  const universities = ["UTN FRC", "UTN FRB", "UTN FRM", "UNC", "UBA", "UNLP", "UNR", "UNSAM", "UNTREF", "UNL"]

  if (success) {
    return (
      <div className="min-h-screen w-full bg-[#0d0b08] flex items-center justify-center p-6 selection:bg-amber/30">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-[#121009] border border-[#2a2218] rounded-[24px] p-10 text-center shadow-2xl">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </motion.div>
          <h2 className="text-2xl font-bold text-[#f0e8d8] mb-2">¡Cuenta creada!</h2>
          <p className="text-text-muted mb-6">Revisá tu email para confirmar tu cuenta. Te estamos redirigiendo...</p>
          <div className="h-1 w-full bg-[#2a2218] rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2.5 }} className="h-full bg-amber" />
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#0d0b08] flex items-center justify-center p-6 selection:bg-amber/30 overflow-y-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-[420px] w-full bg-[#121009] border border-[#2a2218] rounded-[16px] p-8 md:p-10 shadow-2xl relative overflow-hidden">
        
        {/* Logo Section */}
        <header className="flex flex-col items-center mb-10 text-center">
          <div className="relative mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#f59e0b] shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <span className="text-white text-[20px] font-black leading-none mb-0.5">F</span>
            </div>
            <div className="absolute -top-1 -right-1 bg-amber text-black p-0.5 rounded-full shadow-lg">
              <Sparkles size={10} />
            </div>
          </div>
          <h1 className="text-[18px] font-medium tracking-[-0.3px] text-[#f0e8d8]">Faculty OS</h1>
        </header>

        {/* Tab Toggle */}
        <div className="flex bg-[#1a1712] p-1.5 rounded-full mb-8 border border-[#2a2218]/50">
          <button onClick={() => setTab('login')} className={cn("flex-1 py-2.5 text-xs font-bold rounded-full transition-all tracking-wide", tab === 'login' ? "bg-amber text-[#1a0f00] shadow-sm" : "text-text-muted hover:text-text-secondary")}>
            Iniciar sesión
          </button>
          <button onClick={() => { setTab('signup'); setStep(1); }} className={cn("flex-1 py-2.5 text-xs font-bold rounded-full transition-all tracking-wide", tab === 'signup' ? "bg-amber text-[#1a0f00] shadow-sm" : "text-text-muted hover:text-text-secondary")}>
            Crear cuenta
          </button>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'login' ? (
            <motion.form key="login-form" variants={tabVariants} initial="initial" animate="animate" exit="exit" onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber focus:ring-2 focus:ring-amber/10 transition-all outline-none" required />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest">Contraseña</label>
                  <button type="button" onClick={() => navigate('/reset-password')} className="text-[11px] font-bold text-amber hover:text-amber-soft">¿Olvidaste tu contraseña?</button>
                </div>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] pl-4 pr-12 text-[14px] text-white focus:border-amber focus:ring-2 focus:ring-amber/10 transition-all outline-none" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-amber transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-[12px] text-red-500 font-medium ml-1">{error}</p>}

              <button disabled={loading} className="w-full h-12 bg-amber text-[#1a0f00] font-black text-[14px] rounded-[10px] hover:bg-amber-soft transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin size-5" /> : "Entrar"}
              </button>

              <div className="flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-[#2a2218]/50" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#5a4e3a]">O entrar con</span>
                <div className="flex-1 h-px bg-[#2a2218]/50" />
              </div>

              <button
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const { error } = await supabase.auth.signInWithOAuth({
                    provider: 'google',
                    options: { redirectTo: `${window.location.origin}/dashboard` }
                  });
                  if (error) {
                    setError(error.message);
                    setLoading(false);
                  }
                }}
                className="w-full flex items-center justify-center gap-3 bg-[#1a1510] border border-[#2e2010] hover:border-amber rounded-[10px] p-[14px] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-sm font-medium text-[#d4c8a8]">Continuar con Google</span>
              </button>
            </motion.form>
          ) : (
            <motion.div key="signup-container" variants={tabVariants} initial="initial" animate="animate" exit="exit">
              {step === 1 ? (
                <form key="signup-step-1" onSubmit={handleNextStep} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber transition-all outline-none" required />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Contraseña</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber transition-all outline-none" required minLength={6} />
                    <div className="flex gap-1.5 mt-2 ml-1">
                      {[1, 2, 3].map(bar => (
                        <div key={bar} className={cn("h-1 flex-1 rounded-full bg-[#2a2218]", bar <= getPassStrength(password) && (getPassStrength(password) === 1 ? "bg-red-500" : getPassStrength(password) === 2 ? "bg-amber" : "bg-green-500"))} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5 mb-2">
                    <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Confirmar contraseña</label>
                    <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber transition-all outline-none" required />
                  </div>

                  {error && (
                    <div className="flex flex-col gap-1 ml-1 mb-2">
                       <p className="text-[12px] text-red-500 font-medium">{error}</p>
                       {error.includes('Ya existe') && <button onClick={() => setTab('login')} className="text-amber text-[12px] font-bold text-left hover:underline">Iniciar sesión</button>}
                    </div>
                  )}

                  <button className="w-full h-12 bg-amber text-[#1a0f00] font-black text-[14px] rounded-[10px] hover:bg-amber-soft transition-all shadow-lg flex items-center justify-center gap-2">
                    Siguiente <ChevronRight size={16} />
                  </button>

                  <div className="flex items-center gap-4 my-4">
                    <div className="flex-1 h-px bg-[#2a2218]/50" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#5a4e3a]">O crear con</span>
                    <div className="flex-1 h-px bg-[#2a2218]/50" />
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      setLoading(true);
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: { redirectTo: `${window.location.origin}/dashboard` }
                      });
                      if (error) {
                        setError(error.message);
                        setLoading(false);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-[#1a1510] border border-[#2e2010] hover:border-amber rounded-[10px] p-[14px] transition-all"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-sm font-medium text-[#d4c8a8]">Continuar con Google</span>
                  </button>
                </form>
              ) : (
                <form key="signup-step-2" onSubmit={handleSignUp} className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Nombre</label>
                      <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber transition-all outline-none" required placeholder="Mateo" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Apellido</label>
                      <input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber transition-all outline-none" required placeholder="Pérez" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Universidad</label>
                    <input list="universities" value={university} onChange={e => setUniversity(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber transition-all outline-none" required placeholder="UTN FRC" />
                    <datalist id="universities">
                      {universities.map(u => <option key={u} value={u} />)}
                    </datalist>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Carrera</label>
                    <input value={career} onChange={e => setCareer(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] px-4 text-[14px] text-white focus:border-amber transition-all outline-none" required placeholder="Ingeniería Industrial" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1 mb-2 block">Año que cursás</label>
                    <div className="flex bg-[#1a1712] p-1 rounded-xl border border-[#2a2218]/50">
                      {[1, 2, 3, 4, 5, 6].map(y => (
                        <button key={y} type="button" onClick={() => setYearOfStudy(y)} className={cn("flex-1 py-1.5 text-[12px] font-bold rounded-lg transition-all", yearOfStudy === y ? "bg-amber text-[#1a0f00]" : "text-text-muted hover:text-text-secondary")}>
                          {y}°
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-[12px] text-red-500 font-medium ml-1">{error}</p>}

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStep(1)} className="w-20 h-12 bg-[#1a1712] border border-[#2a2218] text-[#f0e8d8] font-bold text-[14px] rounded-[10px] hover:bg-[#2a2218] transition-all">
                      Atrás
                    </button>
                    <button disabled={loading} className="flex-1 h-12 bg-amber text-[#1a0f00] font-black text-[14px] rounded-[10px] hover:bg-amber-soft transition-all shadow-lg flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin size-5" /> : "Crear mi cuenta →"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-10 pt-8 border-t border-[#2a2218]/30 flex flex-col items-center gap-1.5 text-center">
          <p className="text-[11px] text-[#3a3028] font-medium uppercase tracking-[0.05em]">
            Tus datos son privados. Solo vos podés verlos.
          </p>
        </footer>
      </motion.div>
    </div>
  )
}
