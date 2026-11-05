'use client'

import { Pill } from 'lucide-react'
import { separaFase, type PianoAlimentazione, type RigaPiano } from '@/types/diet'

interface DietDocumentProps {
  piano: PianoAlimentazione
  integrazione?: PianoAlimentazione | null
}

function ordina(righe: RigaPiano[] | undefined): RigaPiano[] {
  return [...(righe ?? [])].sort((a, b) => (a.orario || '').localeCompare(b.orario || ''))
}

function Riga({ riga, integrazione = false }: { riga: RigaPiano; integrazione?: boolean }) {
  const { fase, pasto } = separaFase(riga.voce)
  const nota = (riga.note ?? '').trim()

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-line/60 last:border-0">
      <span className="w-[46px] shrink-0 pt-0.5 h-cell tabular-nums text-ink-2">
        {riga.orario || '—'}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {fase && (
            <span className="h-badge inline-flex items-center rounded-[5px] bg-accent/16 px-1.5 py-1 text-accent">
              {fase}
            </span>
          )}
          {integrazione && <Pill className="w-3.5 h-3.5 text-accent shrink-0" />}
          <span className="h-card-title text-[16px] text-ink">{pasto || '—'}</span>
        </div>
        {nota && <p className="h-caption mt-1 leading-snug">{nota}</p>}
      </div>

      {riga.quantita && (
        <span className="shrink-0 h-cell text-[13px] rounded-[6px] bg-field px-2 py-1 text-ink">
          {riga.quantita}
        </span>
      )}
    </div>
  )
}

/**
 * Versione di sola lettura del piano: unica pagina scorrevole, nessuna interazione.
 * Pensata per essere letta (e stampata) come un documento.
 */
export function DietDocument({ piano, integrazione = null }: DietDocumentProps) {
  const righe = ordina(piano.righe)
  const righeIntegrazione = integrazione ? ordina(integrazione.righe) : []
  const data = new Date(piano.creato_at).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <article className="h-card p-4 sm:p-6">
      <header className="pb-3 mb-2 border-b border-line">
        <p className="h-label">Documento di lettura</p>
        <h2 className="h-section mt-1">{piano.nome}</h2>
        <p className="h-caption mt-1">
          {righe.length} {righe.length === 1 ? 'voce' : 'voci'} · creato il {data}
        </p>
      </header>

      {righe.length === 0 ? (
        <p className="h-caption py-8 text-center">Nessuna voce in questo piano.</p>
      ) : (
        righe.map((riga) => <Riga key={riga.id} riga={riga} />)
      )}

      {integrazione && righeIntegrazione.length > 0 && (
        <section className="mt-6">
          <header className="pb-2 mb-1 border-b border-line">
            <p className="h-label text-accent">Integrazione abbinata</p>
            <h3 className="h-card-title mt-1">{integrazione.nome}</h3>
          </header>
          {righeIntegrazione.map((riga) => (
            <Riga key={riga.id} riga={riga} integrazione />
          ))}
        </section>
      )}
    </article>
  )
}
