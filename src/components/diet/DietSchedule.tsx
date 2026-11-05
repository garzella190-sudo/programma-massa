'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  BookOpen,
  Loader2,
  MessageSquare,
  Pencil,
  Pill,
  Plus,
  RotateCcw,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import {
  creaPiano,
  creaPianoIA,
  getPiani,
  migraPianoMassa,
  ripristinaPianoMassa,
} from '@/actions/alimentazione'
import { generateDietPlanWithAI } from '@/actions/ai'
import { Toast, useToast } from '@/components/ui/Toast'
import { FEATURES } from '@/lib/features'
import { cn } from '@/lib/utils'
import type { PianoAlimentazione, TipoPiano } from '@/types/diet'
import { DietAssistant } from './DietAssistant'
import { DietDocument } from './DietDocument'
import { DietPlanCard } from './DietPlanCard'
import { ExportPdfButton } from './ExportPdfButton'

type Vista = 'documento' | 'modifica'

export default function DietSchedule() {
  const [tipo, setTipo] = useState<TipoPiano>('alimentazione')
  const [vista, setVista] = useState<Vista>('documento')
  const [piani, setPiani] = useState<PianoAlimentazione[]>([])
  const [integrazioni, setIntegrazioni] = useState<PianoAlimentazione[]>([])
  const [loading, setLoading] = useState(true)
  const [espansoId, setEspansoId] = useState<string | null>(null)
  const [assistenteAperto, setAssistenteAperto] = useState(false)
  const [generandoIa, setGenerandoIa] = useState(false)
  const [ripristinando, setRipristinando] = useState(false)
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
      setVista('modifica')
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
      showToast(error instanceof Error ? error.message : 'Errore generazione piano IA', 'error')
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

  /** Ricrea il piano originale dai dati inclusi nell'app (nessuna dipendenza dal DB storico). */
  const ripristinaDati = async () => {
    if (ripristinando) return
    setRipristinando(true)
    try {
      const creati = await ripristinaPianoMassa()
      await carica(true)
      showToast(
        creati.length > 0 ? 'Piano Massa ripristinato' : 'I piani esistono già',
        creati.length > 0 ? 'success' : 'info',
      )
    } catch (error) {
      console.error(error)
      showToast('Errore nel ripristino del piano', 'error')
    } finally {
      setRipristinando(false)
    }
  }

  const Icona = tipo === 'alimentazione' ? UtensilsCrossed : Pill
  const pianoCorrente = piani.find((p) => p.id === espansoId) ?? piani[0]
  const integrazioneDi = (piano: PianoAlimentazione) =>
    piano.integrazione_abbinata_id
      ? integrazioni.find((i) => i.id === piano.integrazione_abbinata_id) ?? null
      : null

  return (
    <div className="min-h-screen bg-canvas pb-nav">
      <div className="max-w-3xl mx-auto px-4 pt-6">
        {/* Header */}
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="h-label">Piani nutrizionali</p>
            <h1 className="h-title mt-1 flex items-center gap-2">
              Dieta
              <Icona className="w-6 h-6 text-accent" />
            </h1>
          </div>

          {/* PDF sempre raggiungibile: apertura in lettura + download */}
          {pianoCorrente && (
            <div className="flex items-center gap-2 shrink-0 pt-1">
              <ExportPdfButton
                piano={pianoCorrente}
                modalita="apri"
                withLabel
                label="Leggi PDF"
                onToast={showToast}
              />
              <ExportPdfButton piano={pianoCorrente} modalita="scarica" onToast={showToast} />
            </div>
          )}
        </header>

        {/* Tipo piano */}
        <div className="h-segmented mb-2">
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

        {/* Vista: documento di lettura oppure modifica */}
        <div className="h-segmented mb-3">
          <button
            onClick={() => setVista('documento')}
            className={cn('h-segmented-item flex items-center justify-center gap-1.5', vista === 'documento' && 'h-segmented-item-active')}
          >
            <BookOpen className="w-3.5 h-3.5" /> Documento
          </button>
          <button
            onClick={() => setVista('modifica')}
            className={cn('h-segmented-item flex items-center justify-center gap-1.5', vista === 'modifica' && 'h-segmented-item-active')}
          >
            <Pencil className="w-3.5 h-3.5" /> Modifica
          </button>
        </div>

        {/* Azioni */}
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => void creaNuovoPiano()}
            className="h-btn h-btn-primary flex-1 min-w-[140px]"
          >
            <Plus className="w-4 h-4" />
            Nuovo piano
          </button>

          {FEATURES.generaPianoIA && (
            <button onClick={() => void generaConIa()} disabled={generandoIa} className="h-btn h-btn-tonal">
              {generandoIa ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Genera con IA
            </button>
          )}

          {FEATURES.chatDieta && (
            <button
              onClick={() => setAssistenteAperto((v) => !v)}
              className="h-btn h-btn-outline"
            >
              <MessageSquare className="w-4 h-4" />
              Chiedi
            </button>
          )}
        </div>

        {FEATURES.chatDieta && assistenteAperto && (
          <DietAssistant tipo={tipo} piani={piani} onClose={() => setAssistenteAperto(false)} />
        )}

        {/* Contenuto */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink-3">
            <Loader2 className="w-7 h-7 animate-spin text-accent mb-3" />
            <p className="h-caption">Caricamento…</p>
          </div>
        ) : piani.length === 0 ? (
          <div className="h-card border-dashed p-8 text-center">
            <Icona className="w-8 h-8 text-ink-3 mx-auto mb-3" />
            <p className="h-card-title mb-1">Nessun piano presente</p>
            <p className="h-caption mb-4">
              Ripristina il Piano Massa originale (14 voci già incluse) oppure crea un piano nuovo.
            </p>
            <button
              onClick={() => void ripristinaDati()}
              disabled={ripristinando}
              className="h-btn h-btn-primary w-full"
            >
              {ripristinando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Ripristina Piano Massa
            </button>
            <button onClick={() => void migraDatiStorici()} className="h-btn h-btn-neutral w-full mt-2">
              <ArrowDownToLine className="w-4 h-4" /> Migra da dati storici
            </button>
          </div>
        ) : vista === 'documento' ? (
          /* Documento di sola lettura: alimentazione + integrazione abbinata */
          <div className="space-y-4">
            {piani.map((piano) => (
              <DietDocument
                key={piano.id}
                piano={piano}
                integrazione={tipo === 'alimentazione' ? integrazioneDi(piano) : null}
              />
            ))}
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
