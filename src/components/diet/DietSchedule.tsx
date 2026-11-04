'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowDownToLine, Loader2, MessageSquare, Pill, Plus, Sparkles, UtensilsCrossed } from 'lucide-react'
import { creaPiano, creaPianoIA, getPiani, migraPianoMassa } from '@/actions/alimentazione'
import { generateDietPlanWithAI } from '@/actions/ai'
import { Toast, useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import type { PianoAlimentazione, TipoPiano } from '@/types/diet'
import { DietAssistant } from './DietAssistant'
import { DietPlanCard } from './DietPlanCard'

export default function DietSchedule() {
  const [tipo, setTipo] = useState<TipoPiano>('alimentazione')
  const [piani, setPiani] = useState<PianoAlimentazione[]>([])
  const [integrazioni, setIntegrazioni] = useState<PianoAlimentazione[]>([])
  const [loading, setLoading] = useState(true)
  const [espansoId, setEspansoId] = useState<string | null>(null)
  const [assistenteAperto, setAssistenteAperto] = useState(false)
  const [generandoIa, setGenerandoIa] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const carica = useCallback(
    async (silenzioso = false) => {
      if (!silenzioso) setLoading(true)
      try {
        const [lista, listaIntegrazioni] = await Promise.all([
          getPiani(tipo),
          tipo === 'alimentazione' ? getPiani('integrazione') : Promise.resolve([]),
        ])
        setPiani(lista)
        if (tipo === 'alimentazione') setIntegrazioni(listaIntegrazioni)
      } catch (error) {
        console.error(error)
        showToast('Errore caricamento piani', 'error')
      } finally {
        if (!silenzioso) setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tipo],
  )

  useEffect(() => {
    void carica()
  }, [carica])

  const ricarica = useCallback(() => carica(true), [carica])

  const creaNuovoPiano = async () => {
    try {
      const nome = tipo === 'alimentazione' ? 'Nuovo piano alimentare' : 'Nuovo piano integrativo'
      const piano = await creaPiano(nome, tipo)
      await carica(true)
      setEspansoId(piano.id)
      showToast('Piano creato', 'success')
    } catch (error) {
      console.error(error)
      showToast('Errore creazione piano', 'error')
    }
  }

  const generaConIa = async () => {
    if (generandoIa) return
    setGenerandoIa(true)
    try {
      const csv = await generateDietPlanWithAI(tipo, '')
      const nome = `Piano AI · ${new Date().toLocaleDateString('it-IT')}`
      const piano = await creaPianoIA(nome, tipo, csv)
      await carica(true)
      setEspansoId(piano.id)
      showToast('Piano generato dall\u2019IA', 'success')
    } catch (error) {
      console.error(error)
      showToast('Errore generazione piano IA', 'error')
    } finally {
      setGenerandoIa(false)
    }
  }

  const migraDatiStorici = async () => {
    try {
      await migraPianoMassa()
      await carica(true)
      showToast('Piano Massa migrato', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Errore migrazione', 'error')
    }
  }

  const Icona = tipo === 'alimentazione' ? UtensilsCrossed : Pill

  return (
    <div className="min-h-screen bg-canvas pb-nav">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Header */}
        <header className="mb-4">
          <p className="h-label">Piani nutrizionali</p>
          <h1 className="h-title mt-1 flex items-center gap-2">
            Dieta
            <Icona className="w-6 h-6 text-accent" />
          </h1>
        </header>

        {/* Segmented */}
        <div className="h-segmented mb-3">
          {(['alimentazione', 'integrazione'] as const).map((valore) => (
            <button
              key={valore}
              onClick={() => {
                setTipo(valore)
                setEspansoId(null)
              }}
              className={cn('h-segmented-item', tipo === valore && 'h-segmented-item-active')}
            >
              {valore === 'alimentazione' ? 'Alimentazione' : 'Integrazione'}
            </button>
          ))}
        </div>

        {/* Azioni */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button onClick={() => void creaNuovoPiano()} className="h-btn h-btn-primary flex-1 min-w-[150px]">
            <Plus className="w-4 h-4" />
            Nuovo piano
          </button>
          <button onClick={() => void generaConIa()} disabled={generandoIa} className="h-btn h-btn-tonal">
            {generandoIa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Genera con IA
          </button>
          <button onClick={() => setAssistenteAperto((v) => !v)} className="h-btn h-btn-outline">
            <MessageSquare className="w-4 h-4" />
            Chiedi
          </button>
        </div>

        {assistenteAperto && (
          <DietAssistant tipo={tipo} piani={piani} onClose={() => setAssistenteAperto(false)} />
        )}

        {/* Lista piani */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-3">
            <Loader2 className="w-7 h-7 animate-spin text-accent mb-3" />
            <p className="h-caption">Caricamento…</p>
          </div>
        ) : piani.length === 0 ? (
          <div className="h-card border-dashed p-8 text-center">
            <Icona className="w-8 h-8 text-ink-3 mx-auto mb-3" />
            <p className="h-card-title mb-1">Nessun piano presente</p>
            <p className="h-caption">Crea un nuovo piano oppure migra i dati del Piano Massa.</p>
            <button onClick={() => void migraDatiStorici()} className="h-btn h-btn-neutral mt-4">
              <ArrowDownToLine className="w-4 h-4" /> Migra Piano Massa
            </button>
          </div>
        ) : (
          <div>
            {piani.map((piano) => (
              <DietPlanCard
                key={piano.id}
                piano={piano}
                integrazioni={integrazioni}
                espanso={espansoId === piano.id}
                onToggle={() => setEspansoId((corrente) => (corrente === piano.id ? null : piano.id))}
                onRefresh={ricarica}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </div>

      <Toast message={toast.message} type={toast.type} isVisible={toast.isVisible} onClose={hideToast} />
    </div>
  )
}
