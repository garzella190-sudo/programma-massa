'use client'

import { useState, useEffect } from 'react'
import { User, Save, Loader2, Calendar, Clock, Trash2, LogOut } from 'lucide-react'
import { getProfile, updateProfile, Profile } from '@/actions/profile'
import { getStoricoAllenamenti, eliminaAllenamento } from '@/actions/workout'
import { Toast, useToast } from '@/components/ui/Toast'
import { ConfirmBubble } from '@/components/ui/ConfirmBubble'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

export default function ProfiloPage() {
  const [activeTab, setActiveTab] = useState<'diario' | 'biometria'>('diario')
  const [profile, setProfile] = useState<Profile>({
    altezza: 180,
    peso: 80,
    esperienza: 'Intermedio',
    consumo_calorico: 2500,
    obiettivi: ''
  })
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const { toast, showToast, hideToast } = useToast()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const profData = await getProfile()
      if (profData) {
        setProfile({
          altezza: profData.altezza,
          peso: profData.peso,
          esperienza: profData.esperienza,
          consumo_calorico: profData.consumo_calorico,
          obiettivi: profData.obiettivi
        })
      }
      
      const historyData = await getStoricoAllenamenti()
      setHistory(historyData)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const res = await updateProfile(profile)
    if (res.success) {
      showToast("Biometria salvata!", "success")
    } else {
      showToast("Errore salvataggio", "error")
    }
    setSaving(false)
  }

  const handleDeleteWorkout = async (id: string) => {
    try {
      const res = await eliminaAllenamento(id)
      if (res.success) {
        showToast("Allenamento rimosso dallo storico", "success")
        setHistory(prev => prev.filter(w => w.id !== id))
      } else {
        showToast(res.error || "Errore rimozione", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Errore di rete", "error")
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  // Calcola volume totale per un allenamento
  const calculateVolume = (serieList: any[]) => {
    return serieList.reduce((acc, curr) => acc + (Number(curr.peso || 0) * Number(curr.reps || 0)), 0)
  }

  // Calcola durata in minuti
  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start).getTime()
    const e = new Date(end).getTime()
    const diffMin = Math.round((e - s) / 60000)
    return diffMin > 0 ? `${diffMin} min` : '1 min'
  }

  // Raggruppa serie per esercizio
  const getEserciziRaggruppati = (serieList: any[]) => {
    const map: Record<string, { nome: string; serie: any[] }> = {}
    serieList.forEach(s => {
      const exName = s.esercizio?.nome || 'Esercizio'
      if (!map[exName]) {
        map[exName] = { nome: exName, serie: [] }
      }
      map[exName].serie.push(s)
    })
    return Object.values(map)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="h-caption">Caricamento…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas pb-nav">
      <div className="max-w-3xl mx-auto px-4 pt-6">

        {/* Header identità */}
        <header className="mb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-12 h-12 rounded-full bg-raised border border-line flex items-center justify-center">
                <User className="w-6 h-6 text-accent" />
              </div>
              <h1 className="h-title min-w-0">Profilo &amp; Diario</h1>
            </div>

            <button
              onClick={handleLogout}
              className="h-icon-btn shrink-0 hover:text-danger"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
          <p className="h-caption mt-2">Storico allenamenti e parametri personali</p>
        </header>

        {/* Tabs switcher */}
        <div className="h-segmented mb-4">
          <button
            onClick={() => setActiveTab('diario')}
            className={cn(
              'h-segmented-item min-h-[44px]',
              activeTab === 'diario' && 'h-segmented-item-active'
            )}
          >
            Diario allenamenti
          </button>
          <button
            onClick={() => setActiveTab('biometria')}
            className={cn(
              'h-segmented-item min-h-[44px]',
              activeTab === 'biometria' && 'h-segmented-item-active'
            )}
          >
            Dati biometrici
          </button>
        </div>

        {/* TAB CONTENUTO */}
        {activeTab === 'diario' ? (
          /* DIARIO (STORICO WORKOUTS) */
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="h-card border-dashed p-8 text-center">
                <Calendar className="w-8 h-8 text-ink-3 mx-auto mb-3" />
                <p className="h-card-title mb-1">Nessun allenamento registrato</p>
                <p className="h-caption max-w-xs mx-auto">
                  Inizia il tuo primo allenamento nella scheda Allenamento per popolarne la cronologia.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((w) => {
                  const volume = calculateVolume(w.serie || [])
                  const duration = calculateDuration(w.inizio_at, w.fine_at)
                  const esercizi = getEserciziRaggruppati(w.serie || [])

                  return (
                    <div key={w.id} className="h-card p-3.5 space-y-3">
                      
                      {/* Titolo e Data */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="h-card-title truncate">{w.nome}</h3>
                          <div className="flex items-center gap-1.5 mt-1 h-caption">
                            <span className="tnum">
                              {new Date(w.inizio_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-ink-3">•</span>
                            <span className="flex items-center gap-1 tnum">
                              <Clock className="w-3 h-3 text-ink-3" /> {duration}
                            </span>
                          </div>
                        </div>

                        <ConfirmBubble
                          title="Elimina Allenamento"
                          message="Sei sicuro di voler eliminare definitivamente questa sessione?"
                          onConfirm={() => handleDeleteWorkout(w.id)}
                          trigger={
                            <button className="h-icon-btn hover:text-danger" title="Elimina allenamento" aria-label="Elimina allenamento">
                              <Trash2 size={16} />
                            </button>
                          }
                        />
                      </div>

                      {/* Note */}
                      {w.note && (
                        <p className="h-caption italic bg-field/60 border border-line/60 rounded-[8px] px-3 py-2">
                          {w.note}
                        </p>
                      )}

                      {/* Statistiche rapide — Metric Stat */}
                      <div className="grid grid-cols-2 gap-3 py-2.5 border-y border-line">
                        <div>
                          <span className="h-label block">Volume totale</span>
                          <span className="h-metric tnum block mt-1">
                            {volume} <span className="text-[13px] font-semibold text-ink-2">kg</span>
                          </span>
                        </div>
                        <div>
                          <span className="h-label block">Serie totali</span>
                          <span className="h-metric tnum block mt-1">{w.serie?.length || 0}</span>
                        </div>
                      </div>

                      {/* Esercizi */}
                      <div className="space-y-2">
                        {esercizi.map((ex, exIdx) => (
                          <div key={exIdx} className="space-y-1.5">
                            <span className="h-label block">{ex.nome}</span>
                            <div className="flex flex-wrap gap-1.5">
                              {ex.serie.map((s, sIdx) => (
                                <span
                                  key={s.id}
                                  className={cn(
                                    'h-chip tnum',
                                    s.tipo === 'Failure' && 'bg-danger/16 text-danger',
                                    s.tipo === 'Drop' && 'bg-accent-soft text-accent'
                                  )}
                                >
                                  {sIdx + 1}. {s.peso}kg x {s.reps}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* BIOMETRIA (DATI UTENTE) */
          <div className="space-y-3">
            {/* Metric stats */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="h-card p-3">
                <p className="h-label">Altezza</p>
                <p className="h-metric tnum mt-1">
                  {profile.altezza} <span className="text-[13px] font-semibold text-ink-2">cm</span>
                </p>
              </div>
              <div className="h-card p-3">
                <p className="h-label">Peso</p>
                <p className="h-metric tnum mt-1">
                  {profile.peso} <span className="text-[13px] font-semibold text-ink-2">kg</span>
                </p>
              </div>
              <div className="h-card p-3">
                <p className="h-label">Esperienza</p>
                <p className="h-metric mt-1 truncate">{profile.esperienza}</p>
              </div>
              <div className="h-card p-3">
                <p className="h-label">Calorie target</p>
                <p className="h-metric tnum mt-1">
                  {profile.consumo_calorico} <span className="text-[13px] font-semibold text-ink-2">kcal</span>
                </p>
              </div>
            </div>

            {/* Form biometria */}
            <div className="h-card p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Altezza */}
                <div>
                  <label htmlFor="profilo-altezza" className="h-field-label">Altezza (cm)</label>
                  <input
                    id="profilo-altezza"
                    type="number"
                    value={profile.altezza}
                    onChange={(e) => setProfile({...profile, altezza: Number(e.target.value)})}
                    className="h-field tnum"
                  />
                </div>

                {/* Peso */}
                <div>
                  <label htmlFor="profilo-peso" className="h-field-label">Peso (kg)</label>
                  <input
                    id="profilo-peso"
                    type="number"
                    value={profile.peso}
                    onChange={(e) => setProfile({...profile, peso: Number(e.target.value)})}
                    className="h-field tnum"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Consumo Calorico */}
                <div>
                  <label htmlFor="profilo-calorie" className="h-field-label">Calorie target</label>
                  <input
                    id="profilo-calorie"
                    type="number"
                    value={profile.consumo_calorico}
                    onChange={(e) => setProfile({...profile, consumo_calorico: Number(e.target.value)})}
                    className="h-field tnum"
                  />
                </div>

                {/* Esperienza */}
                <div>
                  <label htmlFor="profilo-esperienza" className="h-field-label">Esperienza</label>
                  <select
                    id="profilo-esperienza"
                    value={profile.esperienza}
                    onChange={(e) => setProfile({...profile, esperienza: e.target.value})}
                    className="h-field appearance-none"
                  >
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzato">Avanzato</option>
                  </select>
                </div>
              </div>

              {/* Obiettivi */}
              <div>
                <label htmlFor="profilo-obiettivi" className="h-field-label">Obiettivi &amp; note</label>
                <textarea
                  id="profilo-obiettivi"
                  value={profile.obiettivi}
                  onChange={(e) => setProfile({...profile, obiettivi: e.target.value})}
                  placeholder="Aumento massa, miglioramento panca..."
                  rows={3}
                  className="h-field resize-none"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="h-btn h-btn-primary w-full"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Salva profilo
              </button>
            </div>
          </div>
        )}

      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  )
}
