import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Lock, CheckCircle2 } from 'lucide-react'

export const UpdatePassword = () => {
  const { updatePassword, session } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If no session, they shouldn't be here (Supabase handles the recovery session via URL hash)
    // But we check just in case.
  }, [session])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || !confirmPass) return setError('Completá todos los campos')
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres')
    if (password !== confirmPass) return setError('Las contraseñas no coinciden')
    
    setLoading(true)
    setError(null)
    
    const { error } = await updatePassword(password)
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2500)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-base flex items-center justify-center p-6 selection:bg-amber/30">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[420px] w-full bg-surface border border-border rounded-[24px] p-10 shadow-2xl relative">
        <header className="mb-10 text-center">
           <h1 className="text-2xl font-bold text-[#f0e8d8] tracking-tight">Nueva contraseña</h1>
           <p className="text-text-muted mt-2 text-sm leading-relaxed">Elegí una clave segura para entrar a Faculty OS.</p>
        </header>

        {success ? (
          <div className="text-center py-4">
             <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-green-500" />
             </div>
             <h3 className="text-lg font-bold text-[#f0e8d8] mb-1">¡Contraseña guardada!</h3>
             <p className="text-text-muted text-sm mt-1.5">Te estamos redirigiendo al dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
             <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Nueva contraseña</label>
                <div className="relative">
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full h-11 bg-elevated border border-border rounded-[10px] px-4 text-[14px] text-text-primary focus:border-amber transition-all outline-none" required minLength={6} placeholder="••••••••" />
                </div>
             </div>
             <div className="space-y-1.5 mb-2">
                <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Confirmar contraseña</label>
                <div className="relative">
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} className="w-full h-11 bg-elevated border border-border rounded-[10px] px-4 text-[14px] text-text-primary focus:border-amber transition-all outline-none" required minLength={6} placeholder="••••••••" />
                </div>
             </div>

             {error && <p className="text-[12px] text-red-500 font-medium ml-1">{error}</p>}

             <button disabled={loading} className="w-full h-12 bg-amber text-[#1a0f00] font-black text-[14px] rounded-[10px] hover:bg-amber-soft transition-all shadow-lg flex items-center justify-center gap-2 mt-4 active:scale-95">
                {loading ? <Loader2 className="animate-spin size-5" /> : (
                  <>
                    Guardar contraseña <Lock size={16} />
                  </>
                )}
             </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
