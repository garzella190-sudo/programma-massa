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

export interface ColonnaRiga {
  key: CampoRiga
  label: string
  /** Classi Tailwind di larghezza (tabella in flex) */
  width: string
}

export const COLONNE_ALIMENTAZIONE: ColonnaRiga[] = [
  { key: 'orario', label: 'Orario', width: 'w-[68px]' },
  { key: 'voce', label: 'Pasto / Fase', width: 'flex-1 min-w-[150px]' },
  { key: 'quantita', label: 'Quantità', width: 'w-[104px]' },
  { key: 'note', label: 'Note', width: 'w-[150px]' },
]

export const COLONNE_INTEGRAZIONE: ColonnaRiga[] = [
  { key: 'orario', label: 'Orario', width: 'w-[68px]' },
  { key: 'voce', label: 'Integratore', width: 'flex-1 min-w-[150px]' },
  { key: 'quantita', label: 'Quantità (mg/CPR)', width: 'w-[150px]' },
  { key: 'note', label: 'Note', width: 'w-[130px]' },
]

export function colonnePer(tipo: TipoPiano): ColonnaRiga[] {
  return tipo === 'alimentazione' ? COLONNE_ALIMENTAZIONE : COLONNE_INTEGRAZIONE
}

/** Riga mostrata in tabella: può essere la riga di un piano o di un'integrazione abbinata. */
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
