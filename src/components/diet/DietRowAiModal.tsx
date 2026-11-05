'use client'

import { useState } from 'react'
import { Loader2, Sparkles, X, RefreshCw, BookOpen } from 'lucide-react'
import { callGemini } from '@/actions/ai'

export interface RigaAiContext {
  items: string
  qty: string
  phase: string
}

interface DietRowAiModalProps {
  isOpen: boolean
  onClose: () => void
  riga: RigaAiContext | null
}

export function DietRowAiModal({ isOpen, onClose, riga }: DietRowAiModalProps) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')

  if (!isOpen || !riga) return null

  const chiedi = async (tipo: 'alternative' | 'spiega') => {
    setLoading(true)
    setResponse('')
    try {
      const prompt =
        tipo === 'alternative'
          ? `Proponi 2 alternative alimentari di pari livello nutrizionale (macro e calorie) a: "${riga.items}" (Quantità: ${riga.qty}) per la fase "${riga.phase}". Devono essere compatibili con un piano di massa muscolare.`
          : `Analizza la componente biochimica e sportiva di: "${riga.items}" (Quantità: ${riga.qty}) nella fase "${riga.phase}". Spiega l'utilità nel programma di ipertrofia e massa muscolare.`
      setResponse(await callGemini(prompt))
    } catch (error) {
      console.error(error)
      setResponse(error instanceof Error ? error.message : "Errore durante la comunicazione con l'IA.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative w-full sm:max-w-lg h-sheet sm:rounded-sheet animate-sheet-in flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="h-card-title">Assistente AI</span>
          </div>
          <button onClick={onClose} className="h-icon-btn" aria-label="Chiudi">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 overflow-y-auto flex-1">
          <div className="rounded-[10px] bg-field px-3 py-2.5 mb-3">
            <p className="h-label mb-1">In analisi</p>
            <p className="h-cell text-ink">
              {riga.items} <span className="text-ink-3">({riga.qty})</span>
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-ink-2">
              <Loader2 className="w-7 h-7 mb-3 text-accent animate-spin" />
              <p className="h-caption">Elaborazione in corso…</p>
            </div>
          ) : response ? (
            <p className="h-body whitespace-pre-wrap">{response}</p>
          ) : (
            <div className="flex flex-col gap-2 py-2">
              <p className="h-caption text-center mb-1">Cosa vuoi sapere su questo elemento?</p>
              <button onClick={() => chiedi('alternative')} className="h-btn h-btn-tonal w-full">
                <RefreshCw className="w-4 h-4" /> Alternative
              </button>
              <button onClick={() => chiedi('spiega')} className="h-btn h-btn-neutral w-full">
                <BookOpen className="w-4 h-4" /> Spiega i benefici
              </button>
            </div>
          )}
        </div>

        {response && !loading && (
          <div className="px-4 py-3 border-t border-line">
            <button onClick={() => setResponse('')} className="h-btn h-btn-ghost w-full">
              Indietro
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
