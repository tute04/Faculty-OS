import React, { useState } from 'react'
import { useAuth } from '../lib/auth'

export const Login = () => {
  const { signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    const { error } = await signInWithEmail(email)
    setLoading(false)
    if (error) {
      setMessage('Error al enviar el link. Revisá tu mail.')
    } else {
      setMessage('¡Link enviado! Revisá tu casilla de correo.')
    }
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#0d0b08]">
      <div className="flex w-[400px] flex-col items-center bg-surface border border-border rounded-2xl p-10 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber to-orange text-[#17130b] font-bold text-2xl shadow-lg shadow-amber/20">
            F
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mt-4 tracking-tight">Faculty OS</h1>
          <p className="text-sm text-text-muted">Tu sistema académico inteligente</p>
        </div>
        
        <form onSubmit={handleEmailLogin} className="w-full space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-text-faint uppercase tracking-wider ml-1">Email</label>
            <input 
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-elevated border border-border rounded-[10px] p-[14px] text-[15px] text-text-primary placeholder:text-text-muted outline-none focus:border-amber/50 transition-all focus:ring-1 focus:ring-amber/20"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-[10px] bg-amber p-[14px] text-[#17130b] font-semibold text-[15px] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 shadow-lg shadow-amber/10"
          >
            {loading ? 'Enviando...' : 'Entrar con Email'}
          </button>
        </form>

        {message && (
          <p className={message.includes('Error') ? "mt-4 text-xs text-red-400" : "mt-4 text-xs text-amber"}>
            {message}
          </p>
        )}

        <div className="flex items-center w-full my-6 gap-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] text-text-faint uppercase tracking-widest font-medium">o</span>
          <div className="flex-1 h-px bg-border" />
        </div>
        
        <button
          onClick={signInWithGoogle}
          className="flex w-full items-center justify-center gap-3 rounded-[10px] bg-elevated border border-border p-[14px] text-text-primary transition-colors hover:bg-hover hover:border-amber/50 active:scale-[0.98]"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="font-medium text-[15px]">Google</span>
        </button>
        
        <p className="mt-8 text-[11px] text-text-faint text-center">
          Tus datos son privados y solo vos podés verlos
        </p>
      </div>
    </div>
  )
}
