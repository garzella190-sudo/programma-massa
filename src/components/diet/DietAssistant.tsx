'use client'

import { useState } from 'react'
import { Loader2, Send, Sparkles, X } from 'lucide-react'
import { callGemini } from '@/actions/ai'
import type { PianoAlimentazione, TipoPiano } from '@/types/diet'

interface DietAssistantProps {
  tipo: TipoPiano
  piani: PianoAlimentazione[]
  onClose: () => void
}

/** Pannello "Chiedi all'AI" contestualizzato sui piani caricati. */
export function DietAssistant({ tipo, piani, onClose }: DietAssistantProps) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const chiedi = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setResponse('')
    try {
      const contesto =
        piani.length > 0
          ? piani
              .map(
                (piano) =>
                  `- ${piano.nome}: ${piano.righe?.map((r) => `${r.orario} ${r.voce} (${r.quantita})`).join(', ')}`,
              )
              .join('\n')
          : 'Nessun piano salvato.'

      const premessa =
        tipo === 'alimentazione'
          ? `L'utente sta visualizzando questi piani alimentari:\n${contesto}\n\nCerca informazioni o alternative nutrizionali.`
          : `L'utente sta visualizzando questi piani di integrazione:\n${contesto}\n\nCerca informazioni sugli integratori.`

      setResponse(await callGemini(`${premessa}\n\nDomanda dell'utente: ${query}`))
    } catch (error) {
      setResponse(error instanceof Error ? `Errore: ${error.message}` : 'Errore inatteso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-card p-3 mb-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="h-card-title">
            Assistente {tipo === 'alimentazione' ? 'nutrizione' : 'integratori'}
          </span>
        </div>
        <button onClick={onClose} className="h-icon-btn" aria-label="Chiudi assistente">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && chiedi()}
          placeholder={
            tipo === 'alimentazione'
              ? 'Es: quante proteine per 93kg?'
              : 'Es: quando prendere la creatina?'
          }
          className="h-field flex-1"
        />
        <button onClick={chiedi} disabled={loading} className="h-btn h-btn-primary px-4" aria-label="Invia">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {response && (
        <div className="mt-3 rounded-[10px] bg-field px-3 py-2.5">
          <p className="text-[14px] leading-[1.55] text-ink whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  )
}
