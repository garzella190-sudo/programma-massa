'use client'

import { useState, useEffect } from 'react'
import { X, Search, Plus, Dumbbell, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EsercizioCatalogo } from '@/types/workout'
import { getEserciziCatalogo, creaEsercizioCatalogo } from '@/actions/workout'

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: EsercizioCatalogo) => void;
}

const GRUPPI_MUSCOLARI = [
  'Tutti', 'Petto', 'Dorso', 'Gambe', 'Spalle', 'Bicipiti', 'Tricipiti', 'Addome', 'Cardio'
]

export function ExercisePickerModal({ isOpen, onClose, onSelect }: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<EsercizioCatalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscle, setSelectedMuscle] = useState('Tutti')

  // Custom exercise creation state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newExName, setNewExName] = useState('')
  const [newExMuscle, setNewExMuscle] = useState('Petto')
  const [newExEquipment, setNewExEquipment] = useState('Manubri')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      fetchExercises()
    } else {
      document.body.style.overflow = ''
      setShowCreateForm(false)
      setNewExName('')
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

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

  if (!isOpen) return null

  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.nome.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMuscle = selectedMuscle === 'Tutti' || ex.gruppo_muscolare === selectedMuscle
    return matchesSearch && matchesMuscle
  })

  const handleSelect = (ex: EsercizioCatalogo) => {
    onSelect(ex)
    onClose()
  }

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newExName.trim()) return

    try {
      setCreating(true)
      const newEx = await creaEsercizioCatalogo(newExName.trim(), newExMuscle, newExEquipment)
      if (newEx) {
        onSelect(newEx)
        onClose()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
      <div className="h-scrim" onClick={onClose} />

      <div className="relative z-50 w-full sm:max-w-lg h-sheet sm:rounded-sheet animate-sheet-in flex flex-col max-h-[92vh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-line">
          <div className="min-w-0">
            <p className="h-label">Catalogo</p>
            <h2 className="h-card-title mt-1 truncate">Scegli esercizio</h2>
          </div>
          <button onClick={onClose} className="h-icon-btn shrink-0" aria-label="Chiudi">
            <X className="w-5 h-5" />
          </button>
        </div>

        {showCreateForm ? (
          /* FORM CREAZIONE */
          <form onSubmit={handleCreateExercise} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            <div>
              <p className="h-label mb-1">Nuovo esercizio personalizzato</p>
              <p className="h-caption">Verrà salvato nel catalogo e aggiunto alla scheda.</p>
            </div>

            <div>
              <label className="h-field-label">Nome esercizio</label>
              <input
                type="text"
                required
                placeholder="es. Affondi in avanzamento"
                value={newExName}
                onChange={(e) => setNewExName(e.target.value)}
                className="h-field"
              />
            </div>

            <div>
              <label className="h-field-label">Gruppo muscolare</label>
              <select
                value={newExMuscle}
                onChange={(e) => setNewExMuscle(e.target.value)}
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
                value={newExEquipment}
                onChange={(e) => setNewExEquipment(e.target.value)}
                className="h-field"
              >
                <option value="Manubri">Manubri</option>
                <option value="Bilanciere">Bilanciere</option>
                <option value="Cavi">Cavi</option>
                <option value="Macchina">Macchina</option>
                <option value="Corpo libero">Corpo libero</option>
                <option value="Elastico">Elastico</option>
                <option value="Kettlebell">Kettlebell</option>
              </select>
            </div>

            <div className="pt-2 pb-1 flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="h-btn h-btn-neutral flex-1"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={creating}
                className="h-btn h-btn-primary flex-1"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salva e aggiungi'}
              </button>
            </div>
          </form>
        ) : (
          /* SELEZIONE E RICERCA */
          <>
            {/* Search and Filters */}
            <div className="px-4 pt-3 pb-2 space-y-2 border-b border-line">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-3 pointer-events-none" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Cerca esercizio…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-field pl-9 min-h-[44px]"
                />
              </div>

              {/* Muscle Filters */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
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

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-ink-2">
                  <Loader2 className="w-7 h-7 animate-spin text-accent mb-3" />
                  <p className="h-caption">Caricamento catalogo…</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Dumbbell className="w-8 h-8 text-ink-3 mx-auto mb-3" />
                  <p className="h-card-title mb-1">Nessun risultato</p>
                  <p className="h-caption mb-4">Nessun esercizio corrisponde alla ricerca.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setNewExName(searchTerm)
                      setShowCreateForm(true)
                    }}
                    className="h-btn h-btn-tonal w-full"
                  >
                    <Plus className="w-4 h-4" />
                    {`Aggiungi "${searchTerm || 'Nuovo'}" al catalogo`}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="h-label px-4 pt-3 pb-2 tnum">
                    {filtered.length} {filtered.length === 1 ? 'esercizio' : 'esercizi'}
                  </p>
                  {filtered.map((ex) => (
                    <button
                      key={ex.id}
                      onClick={() => handleSelect(ex)}
                      className="h-row w-full px-4 text-left active:bg-field transition-colors"
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
                      <Plus className="w-4 h-4 shrink-0 text-ink-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-line flex gap-2 bg-card">
              <button
                onClick={() => setShowCreateForm(true)}
                className="h-btn h-btn-tonal flex-1"
              >
                <Plus className="w-4 h-4" />
                Crea nuovo
              </button>
              <button
                onClick={onClose}
                className="h-btn h-btn-neutral flex-1"
              >
                Chiudi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
