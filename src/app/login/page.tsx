'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
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
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#f4f4f4] dark:bg-[#09090b] transition-colors duration-500 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 dark:bg-blue-800/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-8 md:p-10 shadow-2xl border border-zinc-200 dark:border-zinc-800">
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-[22px] flex items-center justify-center shadow-lg shadow-blue-500/20 mb-6 group hover:scale-105 transition-transform duration-300">
              <Activity className="w-8 h-8 text-white animate-pulse" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 mb-2">
              Allenamenti <span className="text-blue-600 dark:text-blue-500 italic">Manu</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-[240px]">
              {mode === 'signin' ? 'Bentornato! Accedi al tuo piano personalizzato.' : 'Crea il tuo account per iniziare.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 dark:text-zinc-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email
              </label>
              <div className="relative group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[16px] px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-400 dark:text-zinc-500 ml-1 uppercase tracking-widest flex items-center gap-2">
                <Lock className="w-3 h-3" /> Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-zinc-100 dark:bg-zinc-800/50 border-none rounded-[16px] px-5 py-4 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-blue-500 transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-[16px] bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3 animate-fade-in">
                <span className="shrink-0 w-2 h-2 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-4 rounded-[16px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-3 animate-fade-in">
                <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-4 rounded-[16px] shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {mode === 'signin' ? 'Accedi' : 'Registrati'}
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <button
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm font-semibold text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
            >
              {mode === 'signin' ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-zinc-400 dark:text-zinc-600 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
          Made with Passion for the 93kg Goal
        </p>
      </div>
    </div>
  )
}
