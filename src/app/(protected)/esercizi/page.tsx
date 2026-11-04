'use client'

import { useState, useEffect } from 'react'
import { getEserciziCatalogo, getStoricoEsercizio, creaEsercizioCatalogo } from '@/actions/workout'
import { EsercizioCatalogo } from '@/types/workout'
import { Dumbbell, Search, Loader2, ArrowLeft, Calendar, Plus, X, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, Toast } from '@/components/ui/Toast'

const GRUPPI_MUSCOLARI = [
  'Tutti', 'Petto', 'Dorso', 'Gambe', 'Spalle', 'Bicipiti', 'Tricipiti', 'Addome', 'Cardio'
]

export default function EserciziPage() {
  const [exercises, setExercises] = useState<EsercizioCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('Tutti')

  // Storico esercizio selezionato
  const [selectedEx, setSelectedEx] = useState<EsercizioCatalogo | null>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Creazione esercizio
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newMuscle, setNewMuscle] = useState('Petto')
  const [newEquipment, setNewEquipment] = useState('Manubri')
  const [creating, setCreating] = useState(false)

  const { toast, showToast, hideToast } = useToast()

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      const data = await getEserciziCatalogo()
      setExercises(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Carica lo storico per un esercizio
  const handleViewHistory = async (ex: EsercizioCatalogo) => {
    setSelectedEx(ex)
    setLoadingHistory(true)
    try {
      const data = await getStoricoEsercizio(ex.id)
      setHistory(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return

    setCreating(true)
    try {
      const newEx = await creaEsercizioCatalogo(newName.trim(), newMuscle, newEquipment)
      if (newEx) {
        showToast("Esercizio creato con successo!", "success")
        setShowCreate(false)
        setNewName('')
        fetchExercises()
      }
    } catch (err) {
      console.error(err)
      showToast("Errore durante la creazione", "error")
    } finally {
      setCreating(false)
    }
  }

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMuscle = selectedMuscle === 'Tutti' || ex.gruppo_muscolare === selectedMuscle
    return matchesSearch && matchesMuscle
  })

  // Raggruppa storico per sessione di allenamento (data)
  const groupedHistory = history.reduce((acc: any, curr: any) => {
    const date = new Date(curr.allenamento?.inizio_at).toLocaleDateString('it-IT', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(curr)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-canvas pb-nav">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        {!selectedEx ? (
          /* CATALOGO LISTA */
          <div>
            <header className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <p className="h-label">Catalogo</p>
                <h1 className="h-title mt-1 truncate">Esercizi</h1>
              </div>

              <button
                onClick={() => setShowCreate(true)}
                className="h-icon-btn text-accent shrink-0"
                aria-label="Nuovo esercizio"
                title="Nuovo esercizio"
              >
                <Plus className="w-5 h-5" />
              </button>
            </header>

            {/* Cerca + filtri (sticky sotto l'header) */}
            <div className="sticky top-0 z-10 -mx-4 px-4 pt-1 pb-3 bg-canvas">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cerca esercizio…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-field pl-9 min-h-[44px]"
                />
              </div>

              {/* Filtri muscolo */}
              <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
                {GRUPPI_MUSCOLARI.map((muscle) => (
                  <button
                    key={muscle}
                    onClick={() => setSelectedMuscle(muscle)}
                    className={cn(
                      'whitespace-nowrap shrink-0 px-3 py-2 transition-colors',
                      selectedMuscle === muscle ? 'h-chip-accent' : 'h-chip active:bg-raised'
                    )}
                  >
                    {muscle}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista Esercizi */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-ink-2">
                <Loader2 className="w-7 h-7 animate-spin text-accent mb-3" />
                <p className="h-caption">Caricamento…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="h-card border-dashed p-8 text-center">
                <Dumbbell className="w-8 h-8 text-ink-3 mx-auto mb-3" />
                <p className="h-card-title mb-1">Nessun esercizio trovato</p>
                <p className="h-caption">Prova a cambiare la ricerca o il filtro muscolare.</p>
              </div>
            ) : (
              <>
                <p className="h-label px-1 mb-2 tnum">
                  {filtered.length} {filtered.length === 1 ? 'esercizio' : 'esercizi'}
                </p>
                <div className="h-card overflow-hidden">
                  {filtered.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleViewHistory(ex)}
                      className="h-row w-full text-left active:bg-field transition-colors"
                    >
                      <div className="w-9 h-9 shrink-0 rounded-[8px] bg-accent-soft text-accent flex items-center justify-center">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="h-card-title truncate">{ex.nome}</p>
                        <p className="h-caption truncate">
                          {ex.gruppo_muscolare} · {ex.attrezzatura}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 shrink-0 text-ink-3" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* SCHERMATA DETTAGLIO / STORICO ESERCIZIO */
          <div className="animate-fade-in">
            {/* Header Storico */}
            <header className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedEx(null)}
                className="h-icon-btn shrink-0 bg-card border border-line"
                aria-label="Torna al catalogo"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="h-label truncate">
                  {selectedEx.gruppo_muscolare} · {selectedEx.attrezzatura}
                </p>
                <h1 className="h-title mt-1 truncate">{selectedEx.nome}</h1>
              </div>
            </header>

            {/* Dettagli Storico */}
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center py-20 text-ink-2">
                <Loader2 className="w-7 h-7 animate-spin text-accent mb-3" />
                <p className="h-caption">Caricamento storico…</p>
              </div>
            ) : Object.keys(groupedHistory).length === 0 ? (
              <div className="h-card border-dashed p-8 text-center">
                <Calendar className="w-8 h-8 text-ink-3 mx-auto mb-3" />
                <p className="h-card-title mb-1">Nessuno storico</p>
                <p className="h-caption">Non hai ancora loggato questo esercizio.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.keys(groupedHistory).map((date) => (
                  <div key={date} className="h-card overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-line">
                      <Calendar className="w-4 h-4 shrink-0 text-accent" />
                      <span className="h-label normal-case tracking-normal truncate">{date}</span>
                    </div>

                    {groupedHistory[date].map((s: any, idx: number) => (
                      <div key={s.id} className="h-row justify-between">
                        <span className="h-caption">
                          Serie <span className="tnum">{idx + 1}</span>{' '}
                          <span className="text-ink-3">({s.tipo})</span>
                        </span>
                        <span className="h-metric">
                          {s.peso} <span className="h-caption">kg</span> × {s.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Creazione Esercizio */}
        {showCreate && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="h-scrim" onClick={() => setShowCreate(false)} />

            <div className="relative z-50 w-full max-w-sm bg-card border border-line rounded-[20px] p-4 animate-fade-in max-h-[88vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="h-label">Catalogo</p>
                  <h2 className="h-section mt-1">Nuovo esercizio</h2>
                </div>
                <button
                  onClick={() => setShowCreate(false)}
                  className="h-icon-btn shrink-0"
                  aria-label="Chiudi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateExercise} className="space-y-3">
                <div>
                  <label className="h-field-label">Nome esercizio</label>
                  <input
                    type="text"
                    required
                    placeholder="es. Curl Concentrato"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-field"
                  />
                </div>

                <div>
                  <label className="h-field-label">Gruppo muscolare</label>
                  <select
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value)}
                    className="h-field"
                  >
                    {GRUPPI_MUSCOLARI.filter(m => m !== 'Tutti').map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="h-field-label">Attrezzatura</label>
                  <select
                    value={newEquipment}
                    onChange={(e) => setNewEquipment(e.target.value)}
                    className="h-field"
                  >
                    <option value="Manubri">Manubri</option>
                    <option value="Bilanciere">Bilanciere</option>
                    <option value="Cavi">Cavi</option>
                    <option value="Macchina">Macchina</option>
                    <option value="Corpo libero">Corpo libero</option>
                  </select>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="h-btn h-btn-neutral flex-1"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="h-btn h-btn-primary flex-1"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crea esercizio'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  )
}
