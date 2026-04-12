'use client'

import { useState, useEffect } from 'react'
import { User, Ruler, Scale, Flame, Award, Save, Loader2, ChevronLeft } from 'lucide-react'
import { getProfile, updateProfile, Profile } from '@/actions/profile'
import { Toast, useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfiloPage() {
  const [profile, setProfile] = useState<Profile>({
    altezza: 180,
    peso: 80,
    esperienza: 'Intermedio',
    consumo_calorico: 2500,
    obiettivi: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const { toast, showToast, hideToast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetch = async () => {
      const data = await getProfile()
      if (data) {
        setProfile({
          altezza: data.altezza,
          peso: data.peso,
          esperienza: data.esperienza,
          consumo_calorico: data.consumo_calorico,
          obiettivi: data.obiettivi
        })
      }
      setLoading(false)
    }
    fetch()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await updateProfile(profile)
    if (res.success) {
      showToast("Profilo aggiornato con successo!", "success")
    } else {
      showToast("Errore durante l'aggiornamento", "error")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 pb-32 bg-[#f4f4f4] dark:bg-[#09090b] transition-colors duration-500">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link 
            href="/schede"
            className="p-3 rounded-2xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all shadow-sm border border-zinc-200 dark:border-zinc-800"
          >
            <ChevronLeft className="w-6 h-6 text-zinc-500" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3 lowercase">
              Pagina <span className="text-blue-600 dark:text-blue-500">Utente</span>
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium lowercase">Dati biometrici per l'ottimizzazione IA</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 md:p-10 shadow-xl shadow-zinc-200/50 dark:shadow-black/20 border border-white dark:border-zinc-800">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Altezza */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                Altezza (cm)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={profile.altezza}
                  onChange={(e) => setProfile({...profile, altezza: Number(e.target.value)})}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-xl font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Peso */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                Peso Corporeo (kg)
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={profile.peso}
                  onChange={(e) => setProfile({...profile, peso: Number(e.target.value)})}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-xl font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Consumo Calorico */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                Consumo Calorico Medio
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={profile.consumo_calorico}
                  onChange={(e) => setProfile({...profile, consumo_calorico: Number(e.target.value)})}
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-xl font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>
            </div>

            {/* Esperienza */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                Livello Esperienza
              </label>
              <select 
                value={profile.esperienza}
                onChange={(e) => setProfile({...profile, esperienza: e.target.value})}
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-4 text-lg font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none"
              >
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzato">Avanzato</option>
              </select>
            </div>
          </div>

          {/* Obiettivi */}
          <div className="mt-8 space-y-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
              Obiettivi & Note
            </label>
            <textarea 
              value={profile.obiettivi}
              onChange={(e) => setProfile({...profile, obiettivi: e.target.value})}
              placeholder="E.g. Aumento massa, miglioramento forza panca..."
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-[24px] px-5 py-4 min-h-[120px] font-bold text-zinc-800 dark:text-zinc-100 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Salvataggio...' : 'Salva Profilo'}
          </button>

        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-[28px] border border-blue-100 dark:border-blue-900/20">
          <p className="text-blue-700 dark:text-blue-400 text-sm font-bold leading-relaxed">
            I tuoi dati vengono utilizzati dall'Advanced Fitness Architect per calcolare intensità, volume e parametri tecnici dei workout generati con l'IA.
          </p>
        </div>

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  )
}
