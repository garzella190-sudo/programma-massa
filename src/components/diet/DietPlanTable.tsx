'use client'

import { useMemo, useState } from 'react'
import { Check, Loader2, Pill, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { aggiungiRiga, aggiornaRiga, eliminaRiga } from '@/actions/alimentazione'
import { suggestFoodsWithAI } from '@/actions/ai'
import { cn } from '@/lib/utils'
import { FEATURES } from '@/lib/features'
import type { ToastType } from '@/components/ui/Toast'
import {
  componiVoce,
  righeVisualizzate,
  separaFase,
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

type CampoModifica = 'orario' | 'pasto' | 'quantita' | 'note'

/**
 * Tabella del piano: layout "scheda" leggibile (orario · fase · piatto · quantità · note),
 * compatto su desktop e impilato su mobile. Editing inline toccando il valore.
 */
export function DietPlanTable({ piano, integrazioni, onRefresh, onToast }: DietPlanTableProps) {
  const [inModifica, setInModifica] = useState<{ rowId: string; campo: CampoModifica } | null>(null)
  const [valore, setValore] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [suggerimenti, setSuggerimenti] = useState<string[]>([])
  const [suggerendo, setSuggerendo] = useState(false)
  const [rigaAi, setRigaAi] = useState<RigaAiContext | null>(null)

  const righe = useMemo(() => righeVisualizzate(piano, integrazioni), [piano, integrazioni])
  const isIntegrazione = piano.tipo === 'integrazione'
  const etichetta = isIntegrazione ? 'Integratore' : 'Pasto'

  const apri = (riga: RigaVisualizzata, campo: CampoModifica) => {
    if (riga.isIntegration) return
    setInModifica({ rowId: riga.id, campo })
    setValore(
      campo === 'pasto'
        ? separaFase(riga.voce).pasto
        : campo === 'note'
          ? riga.note ?? ''
          : campo === 'orario'
            ? riga.orario ?? ''
            : riga.quantita ?? '',
    )
    setSuggerimenti([])
  }

  const chiudi = () => {
    setInModifica(null)
    setSuggerimenti([])
  }

  const salva = async (riga: RigaVisualizzata) => {
    if (!inModifica || salvando) return
    setSalvando(true)

    const nuovo = valore.trim()
    const patch: Partial<Record<CampoRiga, string>> =
      inModifica.campo === 'pasto'
        ? { voce: componiVoce(separaFase(riga.voce).fase, nuovo) }
        : inModifica.campo === 'note'
          ? { note: nuovo }
          : inModifica.campo === 'orario'
            ? { orario: nuovo }
            : { quantita: nuovo }

    try {
      await aggiornaRiga(riga.id, patch)
      await onRefresh()
    } catch (error) {
      console.error(error)
      onToast('Errore salvataggio', 'error')
    } finally {
      setSalvando(false)
      chiudi()
    }
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
      onToast(error instanceof Error ? error.message : 'Errore IA', 'error')
    } finally {
      setSuggerendo(false)
    }
  }

  return (
    <div className="mt-3">
      {/* Intestazioni colonne: solo desktop, come la tabella originale */}
      <div className="hidden sm:flex items-center gap-2 px-2 pb-1.5 mb-1 border-b border-line">
        <div className="h-label w-[62px] shrink-0">Orario</div>
        <div className="h-label w-[100px] shrink-0">Fase</div>
        <div className="h-label flex-1 min-w-0">{etichetta}</div>
        <div className="h-label w-[96px] shrink-0 text-right">Quantità</div>
        <div className="w-[68px] shrink-0" />
      </div>

      {righe.length === 0 && (
        <p className="h-caption py-8 text-center">Nessuna voce: aggiungine una qui sotto.</p>
      )}

      {righe.map((riga) => {
        const { fase, pasto } = separaFase(riga.voce)
        const attivo = inModifica?.rowId === riga.id ? inModifica.campo : null
        const nota = (riga.note ?? '').trim()

        return (
          <div
            key={riga.id}
            className={cn(
              'flex items-start gap-2 px-2 py-2.5 border-b border-line/60 last:border-0',
              riga.isIntegration && 'bg-accent/10 rounded-[10px] my-1 border-b-0 border-l-2 border-l-accent',
            )}
          >
            {/* ORARIO */}
            <div className="w-[50px] sm:w-[62px] shrink-0 pt-0.5">
              {attivo === 'orario' ? (
                <input
                  autoFocus
                  value={valore}
                  onChange={(e) => setValore(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void salva(riga)
                    if (e.key === 'Escape') chiudi()
                  }}
                  placeholder="07:00"
                  className="h-field h-8 w-full px-1.5 text-[13px]"
                />
              ) : (
                <button
                  onClick={() => apri(riga, 'orario')}
                  disabled={riga.isIntegration}
                  className={cn(
                    'h-cell text-left tabular-nums',
                    riga.isIntegration ? 'text-accent' : 'text-ink-2 hover:text-ink',
                  )}
                >
                  {riga.orario || '--:--'}
                </button>
              )}
            </div>

            {/* FASE (desktop) */}
            <div className="hidden sm:block w-[100px] shrink-0 pt-0.5">
              {fase && (
                <span className="h-badge inline-flex w-fit items-center rounded-[5px] bg-accent/16 px-1.5 py-1 text-accent">
                  {fase}
                </span>
              )}
            </div>

            {/* CONTENUTO */}
            <div className="flex-1 min-w-0">
              <div className="sm:hidden mb-1">
                {fase && (
                  <span className="h-badge inline-flex w-fit items-center rounded-[5px] bg-accent/16 px-1.5 py-1 text-accent">
                    {fase}
                  </span>
                )}
              </div>

              {attivo === 'pasto' ? (
                <div className="relative">
                  <div className="flex items-center gap-1.5">
                    {fase && (
                      <span className="h-badge shrink-0 rounded-[5px] bg-field px-1.5 py-1 text-ink-3">
                        {fase}
                      </span>
                    )}
                    <input
                      autoFocus
                      value={valore}
                      onChange={(e) => {
                        setValore(e.target.value)
                        setSuggerimenti([])
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void salva(riga)
                        if (e.key === 'Escape') chiudi()
                      }}
                      placeholder={etichetta}
                      className="h-field h-9 flex-1 text-[15px] border-accent pr-10"
                    />
                    {FEATURES.chatDieta && (
                      <button
                        onClick={() => void suggerisci()}
                        disabled={suggerendo}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-accent disabled:opacity-40"
                        title="Suggerimenti IA"
                      >
                        {suggerendo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>

                  {FEATURES.chatDieta && suggerimenti.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 h-floating rounded-[12px] overflow-hidden animate-fade-in">
                      <p className="h-label px-3 py-2 border-b border-line">Suggerimenti IA</p>
                      {suggerimenti.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setValore(s)
                            setSuggerimenti([])
                          }}
                          className="w-full text-left px-3 py-2 h-cell text-ink hover:bg-field flex items-center gap-2"
                        >
                          <Sparkles className="w-3 h-3 text-accent shrink-0" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => apri(riga, 'pasto')}
                  disabled={riga.isIntegration}
                  className="block w-full text-left"
                >
                  <span className="flex items-start gap-1.5">
                    {riga.isIntegration && <Pill className="w-3.5 h-3.5 mt-1 shrink-0 text-accent" />}
                    <span
                      className={cn(
                        'h-card-title text-[16px] min-w-0',
                        pasto ? 'text-ink' : 'text-ink-3 font-normal',
                      )}
                    >
                      {pasto || `Aggiungi ${etichetta.toLowerCase()}`}
                    </span>
                  </span>
                </button>
              )}

              {/* QUANTITÀ (mobile) + NOTE */}
              <div className="mt-1 flex items-center gap-2 min-w-0">
                <button
                  onClick={() => apri(riga, 'quantita')}
                  disabled={riga.isIntegration}
                  className={cn(
                    'sm:hidden shrink-0 rounded-[6px] px-2 py-0.5 h-cell text-[13px]',
                    riga.quantita ? 'bg-field text-ink' : 'bg-field/50 text-ink-3',
                  )}
                >
                  {riga.quantita || '—'}
                </button>

                {attivo === 'note' ? (
                  <input
                    autoFocus
                    value={valore}
                    onChange={(e) => setValore(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void salva(riga)
                      if (e.key === 'Escape') chiudi()
                    }}
                    placeholder="Note (macro, indicazioni…)"
                    className="h-field h-8 flex-1 px-2 text-[13px]"
                  />
                ) : (
                  <button
                    onClick={() => apri(riga, 'note')}
                    disabled={riga.isIntegration}
                    className="text-left min-w-0 flex-1"
                  >
                    <span className={cn('h-caption', !nota && 'text-ink-3/70')}>
                      {nota || 'Aggiungi note'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* QUANTITÀ (desktop) */}
            <div className="hidden sm:block w-[96px] shrink-0 text-right pt-0.5">
              {attivo === 'quantita' ? (
                <input
                  autoFocus
                  value={valore}
                  onChange={(e) => setValore(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void salva(riga)
                    if (e.key === 'Escape') chiudi()
                  }}
                  placeholder="150g"
                  className="h-field h-8 w-full px-2 text-[13px] text-right"
                />
              ) : (
                <button
                  onClick={() => apri(riga, 'quantita')}
                  disabled={riga.isIntegration}
                  className={cn(
                    'h-cell rounded-[6px] px-2 py-1',
                    riga.quantita ? 'bg-field text-ink' : 'text-ink-3',
                  )}
                >
                  {riga.quantita || '—'}
                </button>
              )}
            </div>

            {/* AZIONI */}
            <div className="w-[60px] sm:w-[68px] shrink-0 flex items-center justify-end gap-0.5">
              {attivo ? (
                <>
                  <button
                    onClick={() => void salva(riga)}
                    disabled={salvando}
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] text-done hover:bg-field"
                    title="Salva (Invio)"
                  >
                    {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={chiudi}
                    className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-3 hover:bg-field"
                    title="Annulla (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  {FEATURES.chatDieta && (
                    <button
                      onClick={() =>
                        setRigaAi({
                          items: pasto || riga.voce,
                          qty: riga.quantita,
                          phase: fase || riga.orario,
                        })
                      }
                      className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-3 hover:text-accent hover:bg-field"
                      title="Chiedi all'AI"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  )}
                  {!riga.isIntegration && (
                    <button
                      onClick={() => void elimina(riga.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-[8px] text-ink-3 hover:text-danger hover:bg-field"
                      title="Elimina riga"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}

      <button onClick={() => void aggiungi()} className="h-btn h-btn-tonal w-full mt-3">
        <Plus className="w-4 h-4" /> Aggiungi {isIntegrazione ? 'integratore' : 'pasto'}
      </button>

      <DietRowAiModal isOpen={rigaAi !== null} riga={rigaAi} onClose={() => setRigaAi(null)} />
    </div>
  )
}
