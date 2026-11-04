'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Save, X, Dumbbell, ArrowUp, ArrowDown, Loader2 } from 'lucide-react'
import { creaScheda } from '@/actions/workout'
import { Toast, useToast } from '@/components/ui/Toast'
import Select from '@/components/ui/Select'
import { ExercisePickerModal } from './ExercisePickerModal'
import { EsercizioCatalogo } from '@/types/workout'

const RECOVERY_OPTIONS = [
  { id: 30, label: '30s' },
  { id: 45, label: '45s' },
  { id: 60, label: '1m' },
  { id: 90, label: '1m 30s' },
  { id: 120, label: '2m' },
  { id: 150, label: '2m 30s' },
  { id: 180, label: '3m' },
]

const SETS_OPTIONS = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, label: `${i + 1} Serie` }))
const REPS_OPTIONS = [
  { id: '8', label: '8 Reps' },
  { id: '10', label: '10 Reps' },
  { id: '12', label: '12 Reps' },
  { id: '8-12', label: '8-12 Reps' },
  { id: '10-12', label: '10-12 Reps' },
  { id: 'Max', label: 'A cedimento' },
]

interface SelectedExercise {
  id: string; // Temporary UI ID
  esercizio: EsercizioCatalogo;
  serie_target: number;
  reps_target: string;
  recupero_target: number;
}

let nextId = 0;
const genId = () => `planex-${Date.now()}-${nextId++}`;

interface NewPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewPlanModal({ isOpen, onClose, onSuccess }: NewPlanModalProps) {
  const [nomeScheda, setNomeScheda] = useState('')
  const [esercizi, setEsercizi] = useState<SelectedExercise[]>([])
  const [loading, setLoading] = useState(false)
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  
  const { toast, showToast, hideToast } = useToast()
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      setNomeScheda('')
      setEsercizi([])
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleAddExerciseClick = () => {
    setIsPickerOpen(true)
  }

  const handleExerciseSelect = (ex: EsercizioCatalogo) => {
    const newEx: SelectedExercise = {
      id: genId(),
      esercizio: ex,
      serie_target: 3,
      reps_target: '10',
      recupero_target: 60
    }
    setEsercizi(prev => [...prev, newEx])
    showToast(`${ex.nome} aggiunto`, 'success')
  }

  const removeExercise = (id: string) => {
    setEsercizi(prev => prev.filter(e => e.id !== id))
  }

  const updateExercise = (id: string, fields: Partial<SelectedExercise>) => {
    setEsercizi(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e))
  }

  const moveUp = (idx: number) => {
    if (idx <= 0) return
    const newExs = [...esercizi]
    const temp = newExs[idx]
    newExs[idx] = newExs[idx - 1]
    newExs[idx - 1] = temp
    setEsercizi(newExs)
  }

  const moveDown = (idx: number) => {
    if (idx >= esercizi.length - 1) return
    const newExs = [...esercizi]
    const temp = newExs[idx]
    newExs[idx] = newExs[idx + 1]
    newExs[idx + 1] = temp
    setEsercizi(newExs)
  }

  const handleSave = async () => {
    if (!nomeScheda.trim()) {
      showToast("Inserisci un nome per la scheda", "error")
      return
    }
    if (esercizi.length === 0) {
      showToast("Aggiungi almeno un esercizio", "error")
      return
    }

    setLoading(true)
    try {
      const payload = esercizi.map(e => ({
        esercizio_id: e.esercizio.id,
        serie_target: e.serie_target,
        reps_target: e.reps_target,
        recupero_target: e.recupero_target
      }))

      const res = await creaScheda(nomeScheda.trim(), payload)
      if (res.success) {
        onSuccess()
        onClose()
      } else {
        showToast(res.error || "Errore salvataggio", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Errore di rete", "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-end md:items-center md:p-4 bg-black/55 backdrop-blur-[2px] animate-fade-in">
      <div className="bg-canvas w-full h-full md:h-auto md:max-h-[90vh] md:max-w-2xl flex flex-col md:rounded-[20px] md:border md:border-line md:shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center gap-3 px-4 py-3 border-b border-line shrink-0 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-9 h-9 rounded-[10px] bg-accent/16 text-accent flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5" />
            </span>
            <h2 className="h-section truncate">Nuova Routine</h2>
          </div>
          <button onClick={onClose} className="h-icon-btn shrink-0" aria-label="Chiudi">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div ref={contentRef} className="px-4 py-4 space-y-5 overflow-y-auto flex-1 pb-32">
          {/* Nome */}
          <div>
            <label className="h-field-label">Nome Routine</label>
            <input
              type="text"
              placeholder="es. Spinta A, Fullbody..."
              value={nomeScheda}
              onChange={(e) => setNomeScheda(e.target.value)}
              className="h-field"
            />
          </div>

          {/* Lista Esercizi */}
          <div className="space-y-3">
            <label className="h-label block">
              Esercizi configurati <span className="tnum">({esercizi.length})</span>
            </label>

            {esercizi.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-line bg-card/60 py-10 px-6 text-center">
                <Dumbbell className="w-8 h-8 text-ink-3 mx-auto mb-3" />
                <p className="h-caption">Aggiungi esercizi alla tua routine</p>
              </div>
            ) : (
              <div className="space-y-3">
                {esercizi.map((ex, idx) => (
                  <div key={ex.id} className="h-card p-3 space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="shrink-0 w-6 h-6 rounded-[8px] bg-raised text-ink-2 text-[12px] font-bold flex items-center justify-center tnum">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h4 className="h-card-title truncate">{ex.esercizio.nome}</h4>
                          <span className="h-label text-accent">{ex.esercizio.gruppo_muscolare}</span>
                        </div>
                      </div>

                      {/* Ordine e Cancella */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {idx > 0 && (
                          <button onClick={() => moveUp(idx)} className="h-icon-btn" title="Sposta su">
                            <ArrowUp size={16} />
                          </button>
                        )}
                        {idx < esercizi.length - 1 && (
                          <button onClick={() => moveDown(idx)} className="h-icon-btn" title="Sposta giù">
                            <ArrowDown size={16} />
                          </button>
                        )}
                        <button onClick={() => removeExercise(ex.id)} className="h-icon-btn text-danger" title="Rimuovi">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Inputs in linea */}
                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-line/60">
                      <div>
                        <label className="h-field-label">Serie</label>
                        <Select 
                          options={SETS_OPTIONS}
                          value={ex.serie_target}
                          onChange={(val) => updateExercise(ex.id, { serie_target: Number(val) })}
                        />
                      </div>
                      <div>
                        <label className="h-field-label">Ripetizioni</label>
                        <Select 
                          options={REPS_OPTIONS}
                          value={ex.reps_target}
                          onChange={(val) => updateExercise(ex.id, { reps_target: String(val) })}
                        />
                      </div>
                      <div>
                        <label className="h-field-label">Recupero</label>
                        <Select 
                          options={RECOVERY_OPTIONS}
                          value={ex.recupero_target}
                          onChange={(val) => updateExercise(ex.id, { recupero_target: Number(val) })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAddExerciseClick}
              className="h-btn h-btn-outline w-full border-dashed"
            >
              <Plus className="w-4 h-4" /> Aggiungi esercizio
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-line shrink-0 bg-card sticky bottom-0">
          <button
            onClick={handleSave}
            disabled={loading}
            className="h-btn h-btn-primary w-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            {loading ? 'Salvataggio...' : 'Crea Routine'}
          </button>
        </div>
      </div>

      <ExercisePickerModal 
        isOpen={isPickerOpen} 
        onClose={() => setIsPickerOpen(false)} 
        onSelect={handleExerciseSelect}
      />

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  )
}
