'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2, Pill, Plus, Sparkles, Trash2 } from 'lucide-react'
import { aggiungiRiga, aggiornaRiga, eliminaRiga } from '@/actions/alimentazione'
import { suggestFoodsWithAI } from '@/actions/ai'
import { cn } from '@/lib/utils'
import type { ToastType } from '@/components/ui/Toast'
import {
  colonnePer,
  righeVisualizzate,
  type CampoRiga,
  type PianoAlimentazione,
  type RigaVisualizzata,
} from '@/types/diet'
import { DietRowAiModal, type RigaAiContext } from './DietRowAiModal'

interface DietPlanTableProps {
  piano: PianoAlimentazione
  integrazioni: PianoAlimentazione[]
  onRefresh: () => void | Promise<void>
  onToast: (message: string, type: ToastType) => void
}

export function DietPlanTable({ piano, integrazioni, onRefresh, onToast }: DietPlanTableProps) {
  const [editing, setEditing] = useState<{ rowId: string; field: CampoRiga } | null>(null)
  const [valore, setValore] = useState('')
  const [suggerimenti, setSuggerimenti] = useState<string[]>([])
  const [suggerendo, setSuggerendo] = useState(false)
  const [rigaAi, setRigaAi] = useState<RigaAiContext | null>(null)

  const colonne = colonnePer(piano.tipo)
  const righe = useMemo(() => righeVisualizzate(piano, integrazioni), [piano, integrazioni])

  const apriModifica = (riga: RigaVisualizzata, field: CampoRiga) => {
    setEditing({ rowId: riga.id, field })
    setValore(riga[field] ?? '')
    setSuggerimenti([])
  }

  const chiudiModifica = () => {
    setEditing(null)
    setSuggerimenti([])
  }

  const salva = async () => {
    if (!editing) return
    const { rowId, field } = editing
    try {
      await aggiornaRiga(rowId, { [field]: valore })
      await onRefresh()
    } catch (error) {
      console.error(error)
      onToast('Errore salvataggio', 'error')
    }
    chiudiModifica()
  }

  const elimina = async (rowId: string) => {
    try {
      await eliminaRiga(rowId)
      await onRefresh()
      onToast('Riga eliminata', 'success')
    } catch (error) {
      console.error(error)
      onToast('Errore eliminazione', 'error')
    }
  }

  const aggiungi = async () => {
    try {
      await aggiungiRiga(piano.id, {
        orario: '',
        voce: '',
        quantita: '',
        note: '',
        ordine: piano.righe?.length ?? 0,
      })
      await onRefresh()
    } catch (error) {
      console.error(error)
      onToast('Errore aggiunta riga', 'error')
    }
  }

  const suggerisci = async () => {
    if (!valore.trim()) return
    setSuggerendo(true)
    try {
      setSuggerimenti(await suggestFoodsWithAI(valore))
    } catch (error) {
      console.error(error)
    } finally {
      setSuggerendo(false)
    }
  }

  const apriAi = (riga: RigaVisualizzata) =>
    setRigaAi({ items: riga.voce, qty: riga.quantita, phase: riga.orario })

  return (
    <div className="mt-3">
      <div className="overflow-x-auto no-scrollbar -mx-3.5 px-3.5">
        <div className="min-w-[600px]">
          {/* Header colonne */}
          <div className="flex items-center gap-2 px-2 pb-1.5 mb-1 border-b border-line">
            {colonne.map((col) => (
              <div key={col.key} className={cn('h-label shrink-0', col.width)}>
                {col.label}
              </div>
            ))}
            <div className="w-[72px] shrink-0" />
          </div>

          {/* Righe */}
          {righe.length === 0 && (
            <p className="h-caption py-6 text-center">Nessuna voce: aggiungine una qui sotto.</p>
          )}

          {righe.map((riga) => {
            if (riga.isIntegration) {
              return (
                <div
                  key={`int-${riga.id}`}
                  className="flex items-center gap-2 px-2 py-2 rounded-[10px] bg-accent/10 border-l-2 border-accent my-1"
                >
                  {colonne.map((col) => (
                    <div key={col.key} className={cn('min-w-0 shrink-0', col.width)}>
                      {col.key === 'voce' ? (
                        <div className="flex items-center gap-1.5 text-accent">
                          <Pill className="w-3.5 h-3.5 shrink-0" />
                          <span className="h-cell truncate">{riga.voce || 'Integrazione'}</span>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            'h-cell truncate block',
                            col.key === 'orario' ? 'text-accent' : 'text-ink-2',
                          )}
                        >
                          {riga[col.key] || '—'}
                        </span>
                      )}
                    </div>
                  ))}
                  <div className="w-[72px] shrink-0 flex items-center justify-end">
                    <button onClick={() => apriAi(riga)} className="h-icon-btn" title="Chiedi all'AI">
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <div key={riga.id} className="h-row group/row">
                {colonne.map((col) => {
                  const inModifica = editing?.rowId === riga.id && editing.field === col.key
                  return (
                    <div key={col.key} className={cn('min-w-0 shrink-0', col.width)}>
                      {inModifica ? (
                        <div className="relative">
                          <input
                            autoFocus
                            value={valore}
                            onChange={(e) => {
                              setValore(e.target.value)
                              setSuggerimenti([])
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') void salva()
                              if (e.key === 'Escape') chiudiModifica()
                            }}
                            className="h-field h-9 py-1 px-2 text-[15px] border-accent"
                          />

                          {col.key === 'voce' && (
                            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void suggerisci()
                                }}
                                disabled={suggerendo}
                                className="p-1.5 rounded-[6px] text-accent hover:bg-field disabled:opacity-40"
                                title="Suggerimenti IA"
                              >
                                {suggerendo ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  void salva()
                                }}
                                className="p-1.5 rounded-[6px] text-done hover:bg-field"
                                title="Salva"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          {suggerimenti.length > 0 && col.key === 'voce' && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 h-floating rounded-[12px] overflow-hidden animate-fade-in">
                              <p className="h-label px-3 py-2 border-b border-line">Suggerimenti IA</p>
                              {suggerimenti.map((suggerimento, i) => (
                                <button
                                  key={i}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setValore(suggerimento)
                                    setSuggerimenti([])
                                  }}
                                  className="w-full text-left px-3 py-2 h-cell text-ink hover:bg-field flex items-center gap-2"
                                >
                                  <Sparkles className="w-3 h-3 text-accent shrink-0" />
                                  {suggerimento}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => apriModifica(riga, col.key)}
                          className={cn(
                            'w-full text-left px-2 h-9 rounded-[8px] flex items-center truncate transition-colors',
                            riga[col.key]
                              ? 'h-cell text-ink hover:bg-field'
                              : 'text-[15px] text-ink-3 bg-field/50 hover:bg-field',
                          )}
                        >
                          {riga[col.key] || '—'}
                        </button>
                      )}
                    </div>
                  )
                })}

                <div className="w-[72px] shrink-0 flex items-center justify-end">
                  <button onClick={() => apriAi(riga)} className="h-icon-btn" title="Chiedi all'AI">
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => void elimina(riga.id)}
                    className="h-icon-btn hover:text-danger"
                    title="Elimina riga"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <button onClick={() => void aggiungi()} className="h-btn h-btn-tonal w-full mt-3">
        <Plus className="w-4 h-4" /> Aggiungi riga
      </button>

      <DietRowAiModal isOpen={rigaAi !== null} riga={rigaAi} onClose={() => setRigaAi(null)} />
    </div>
  )
}
