'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Sparkles, Activity } from 'lucide-react'
import { signIn, signUp } from '@/actions/auth'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)

    try {
      if (mode === 'signin') {
        const result = await signIn(formData)
        if (result && result.error) {
          setError(result.error)
        }
        // Redirect is handled by server action on success
      } else {
        const origin = window.location.origin
        const result = await signUp(formData, origin)
        if (result.error) {
          setError(result.error)
        } else if (result.success) {
          setSuccess(result.success)
        }
      }
    } catch (err: any) {
      setError(err.message || "Si è verificato un errore durante l'autenticazione.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo + titolo */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-[16px] bg-accent flex items-center justify-center mb-5">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="h-title">Allenamenti Manu</h1>
          <p className="h-caption mt-2 max-w-[260px]">
            {mode === 'signin' ? 'Bentornato! Accedi al tuo piano personalizzato.' : 'Crea il tuo account per iniziare.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="h-field-label">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="h-field"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="h-field-label">Password</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-field pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-icon-btn"
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] bg-danger/16 border border-danger/30 text-danger text-[13px] font-semibold animate-fade-in">
              <span className="shrink-0 w-2 h-2 rounded-full bg-danger" />
              <span className="min-w-0">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-[10px] bg-done/16 border border-done/30 text-done text-[13px] font-semibold animate-fade-in">
              <span className="shrink-0 w-2 h-2 rounded-full bg-done" />
              <span className="min-w-0">{success}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-btn h-btn-primary w-full"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {mode === 'signin' ? 'Accedi' : 'Registrati'}
              </>
            )}
          </button>
        </form>

        <div className="h-divider mt-7 mb-5" />

        <div className="text-center">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-[14px] font-semibold text-accent py-2.5 px-3"
          >
            {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
          </button>
        </div>

        <p className="mt-6 h-caption text-center text-ink-3">
          Made with Passion for the 93kg Goal
        </p>
      </div>
    </div>
  )
}
