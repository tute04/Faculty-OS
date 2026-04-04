import React, { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ArrowLeft, Send, Mail, CheckCircle2 } from 'lucide-react'

export const ResetPassword = () => {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return setError('Ingresá tu email')
    setLoading(true)
    setError(null)
    
    const { error } = await resetPassword(email)
    if (error) {
      setError('No pudimos enviar el email. Revisá si es correcto.')
      setLoading(true)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full bg-[#0d0b08] flex items-center justify-center p-6 selection:bg-amber/30">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-[420px] w-full bg-[#121009] border border-[#2a2218] rounded-[24px] p-8 md:p-10 shadow-2xl relative">
        <header className="mb-8">
           <Link to="/login" className="inline-flex items-center gap-2 text-text-muted hover:text-amber text-xs font-bold uppercase tracking-widest transition-colors mb-6">
             <ArrowLeft size={14} /> Volver al login
           </Link>
           <h1 className="text-2xl font-bold text-[#f0e8d8] tracking-tight">Recuperar contraseña</h1>
           <p className="text-text-muted text-sm mt-1.5">Te enviaremos un link para elegir una nueva.</p>
        </header>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.form key="reset-form" exit={{ opacity: 0, x: -20 }} onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-text-faint uppercase tracking-widest ml-1">Email</label>
                  <div className="relative">
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full h-11 bg-[#1a1712] border border-[#2a2218] rounded-[10px] pl-4 pr-12 text-[14px] text-white focus:border-amber transition-all outline-none" required placeholder="hola@ejemplo.com" />
                    <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted opacity-50" />
                  </div>
               </div>

               {error && <p className="text-[12px] text-red-500 font-medium ml-1">{error}</p>}

               <button disabled={loading} className="w-full h-12 bg-amber text-[#1a0f00] font-black text-[14px] rounded-[10px] hover:bg-amber-soft transition-all shadow-lg flex items-center justify-center gap-2 mt-2">
                 {loading ? <Loader2 className="animate-spin size-5" /> : (
                   <>
                     Enviar link <Send size={16} />
                   </>
                 )}
               </button>
            </motion.form>
          ) : (
            <motion.div key="success-msg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="text-center py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-[#f0e8d8] mb-3">Email enviado</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-6">
                Te enviamos un email con el link para resetear tu contraseña. ¡Revisá tu casilla!
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-amber hover:underline text-sm font-bold">
                 Volver al login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
