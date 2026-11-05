// types/diet.ts
// Tipi del modulo Alimentazione / Integrazione (tabelle: piani_alimentazione, righe_piano)

export type TipoPiano = 'alimentazione' | 'integrazione'

export interface RigaPiano {
  id: string
  piano_id: string
  orario: string
  voce: string
  quantita: string
  note: string
  ordine: number
}

export interface PianoAlimentazione {
  id: string
  nome: string
  tipo: TipoPiano
  creato_at: string
  integrazione_abbinata_id?: string | null
  righe: RigaPiano[]
}

/** Campi editabili di una riga */
export const CAMPI_RIGA = ['orario', 'voce', 'quantita', 'note'] as const
export type CampoRiga = (typeof CAMPI_RIGA)[number]

/**
 * Nel DB la fase è salvata come prefisso della voce: "Colazione — Yogurt e Muesli".
 * Restituisce le due parti separate, per mostrarle come badge + titolo leggibile.
 */
export function separaFase(voce: string | null | undefined): { fase: string; pasto: string } {
  const testo = (voce ?? '').trim()
  const match = testo.match(/^(.+?)\s*[—–]\s*(.+)$/)
  if (!match) return { fase: '', pasto: testo }
  return { fase: match[1].trim(), pasto: match[2].trim() }
}

/** Compone la voce salvata nel DB a partire da fase + pasto. */
export function componiVoce(fase: string, pasto: string): string {
  const f = fase.trim()
  const p = pasto.trim()
  return f ? `${f} — ${p}` : p
}

/** Riga mostrata in tabella: può venire dal piano o dall'integrazione abbinata. */
export interface RigaVisualizzata extends RigaPiano {
  isIntegration?: boolean
}

export function righeVisualizzate(
  piano: PianoAlimentazione,
  integrazioni: PianoAlimentazione[],
): RigaVisualizzata[] {
  const righe: RigaVisualizzata[] = [...(piano.righe ?? [])]

  if (piano.tipo === 'alimentazione' && piano.integrazione_abbinata_id) {
    const abbinata = integrazioni.find((i) => i.id === piano.integrazione_abbinata_id)
    if (abbinata?.righe) {
      righe.push(...abbinata.righe.map((r) => ({ ...r, isIntegration: true })))
    }
  }

  return righe.sort((a, b) => (a.orario || '').localeCompare(b.orario || ''))
}
