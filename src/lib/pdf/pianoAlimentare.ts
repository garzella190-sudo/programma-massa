// lib/pdf/pianoAlimentare.ts
// Genera un PDF A4 del piano alimentare / di integrazione, nello stile Hevy
// (header blu, tabella compatta, numeri tabulari, file leggero da stampare).

import { separaFase, type PianoAlimentazione, type RigaPiano } from '@/types/diet'
import { slugPiano } from '@/lib/slug'

const MM = { pageW: 210, pageH: 297, margin: 16, footer: 20 }
const CONTENT_W = MM.pageW - MM.margin * 2

// Palette stampa (chiara, coerente con l'accent Hevy)
const C = {
  accent: [30, 111, 255] as const,
  accentSoft: [237, 243, 255] as const,
  ink: [17, 21, 28] as const,
  ink2: [94, 102, 117] as const,
  ink3: [140, 148, 160] as const,
  line: [222, 228, 238] as const,
  head: [241, 244, 250] as const,
  white: [255, 255, 255] as const,
}

type RigaPdf = {
  orario: string
  fase: string
  voce: string
  quantita: string
  note: string
}

type Colonna = { key: keyof RigaPdf; label: string; w: number }

const COLONNE_ALIMENTAZIONE: Colonna[] = [
  { key: 'orario', label: 'ORARIO', w: 20 },
  { key: 'fase', label: 'FASE', w: 28 },
  { key: 'voce', label: 'PASTO', w: 50 },
  { key: 'quantita', label: 'QUANTITÀ', w: 32 },
  { key: 'note', label: 'NOTE', w: 48 },
]

const COLONNE_INTEGRAZIONE: Colonna[] = [
  { key: 'orario', label: 'ORARIO', w: 20 },
  { key: 'fase', label: 'FASE', w: 28 },
  { key: 'voce', label: 'INTEGRATORE', w: 50 },
  { key: 'quantita', label: 'QUANTITÀ', w: 32 },
  { key: 'note', label: 'NOTE', w: 48 },
]

/** Separa la fase dal nome del pasto e normalizza i campi per il rendering. */
function perPdf(righe: RigaPiano[]): RigaPdf[] {
  return righe.map((riga) => {
    const { fase, pasto } = separaFase(riga.voce)
    return {
      orario: riga.orario,
      fase,
      voce: pasto,
      quantita: riga.quantita,
      note: riga.note,
    }
  })
}

function dataIt(data: Date): string {
  return data.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
}

/** Testo "pulito": rimuove caratteri non Latin-1 che i font standard di PDF non sanno disegnare. */
function pulisci(testo: string | null | undefined): string {
  return (testo ?? '')
    .replace(/[×✕]/g, 'x')
    .replace(/[—–]/g, '-')
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[\u2022\u25CF]/g, '-')
    .replace(/[\u00A0]/g, ' ')
    .trim()
}

export interface EsportaPianoOpzioni {
  data?: Date
  integrazione?: PianoAlimentazione | null
}

/**
 * Costruisce il documento PDF del piano (senza salvarlo).
 * Utile per test e per un eventuale invio server-side.
 */
export async function generaPianoPdf(
  piano: PianoAlimentazione,
  { data = new Date(), integrazione = null }: EsportaPianoOpzioni = {},
): Promise<import('jspdf').jsPDF> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })

  const isIntegrazione = piano.tipo === 'integrazione'
  const colonne = isIntegrazione ? COLONNE_INTEGRAZIONE : COLONNE_ALIMENTAZIONE
  const contentRight = MM.pageW - MM.margin
  let y = 0

  const setFill = (c: readonly [number, number, number]) => doc.setFillColor(c[0], c[1], c[2])
  const setInk = (c: readonly [number, number, number]) => doc.setTextColor(c[0], c[1], c[2])
  const setStroke = (c: readonly [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2])

  // ── Footer (disegnato a fine documento, su ogni pagina) ─
  const disegnaFooter = (numeroPagina: number, totalePagine: number) => {
    setStroke(C.line)
    doc.setLineWidth(0.2)
    doc.line(MM.margin, MM.pageH - MM.footer + 4, contentRight, MM.pageH - MM.footer + 4)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    setInk(C.ink3)
    doc.text('Allenamenti Manu', MM.margin, MM.pageH - MM.footer + 9)
    doc.text(`pag. ${numeroPagina} / ${totalePagine}`, contentRight, MM.pageH - MM.footer + 9, {
      align: 'right',
    })
  }

  // ── Header di pagina 1 ─────────────────────────────────
  setFill(C.accent)
  doc.rect(0, 0, MM.pageW, 7, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  setInk(C.white)
  doc.text('ALLENAMENTI MANU', MM.margin, 4.7)
  doc.text(isIntegrazione ? 'INTEGRAZIONE' : 'ALIMENTAZIONE', contentRight, 4.7, { align: 'right' })

  y = 20
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(19)
  setInk(C.ink)
  const titolo = doc.splitTextToSize(pulisci(piano.nome) || 'Piano', CONTENT_W) as string[]
  doc.text(titolo, MM.margin, y)
  y += titolo.length * 7.4

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  setInk(C.ink2)
  const nVoci = piano.righe?.length ?? 0
  const meta = `${dataIt(data)}   ·   ${nVoci} ${nVoci === 1 ? 'voce' : 'voci'}`
  doc.text(meta, MM.margin, y)
  y += 6

  // ── Tabella ────────────────────────────────────────────
  const disegnaIntestazione = (colonneCorrenti: Colonna[] = colonne) => {
    setFill(C.head)
    doc.rect(MM.margin, y, CONTENT_W, 6.4, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.8)
    setInk(C.ink2)
    let x = MM.margin + 2
    for (const col of colonneCorrenti) {
      doc.text(col.label, x, y + 4.1)
      x += col.w
    }
    y += 6.4
  }

  const nuovaPagina = (colonneCorrenti: Colonna[]) => {
    doc.addPage()
    y = MM.margin
    disegnaIntestazione(colonneCorrenti)
  }

  const disegnaRighe = (righePiano: RigaPiano[], tint: [number, number, number] | null, colonneRiga: Colonna[]) => {
    const righe = perPdf(righePiano)

    if (righe.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8.5)
      setInk(C.ink3)
      doc.text('Nessuna voce', MM.margin + 2, y + 6)
      y += 10
      return
    }

    const ultimaColonna = colonneRiga.length - 1

    for (const riga of righe) {
      // Il testo va misurato con la stessa dimensione con cui verrà disegnato
      const celle = colonneRiga.map((col, i) => {
        const isFase = col.key === 'fase'
        doc.setFont('helvetica', i === 0 || isFase ? 'bold' : 'normal')
        doc.setFontSize(isFase ? 6.6 : i === ultimaColonna ? 7.8 : 8.6)
        return doc.splitTextToSize(pulisci(riga[col.key]), col.w - 4) as string[]
      })
      const righeMax = Math.max(1, ...celle.map((c) => c.length))
      const altezza = righeMax * 3.7 + 3.4

      if (y + altezza > MM.pageH - MM.footer) nuovaPagina(colonneRiga)

      if (tint) {
        setFill(tint)
        doc.rect(MM.margin, y, CONTENT_W, altezza, 'F')
      }

      let x = MM.margin + 2
      colonneRiga.forEach((col, i) => {
        const isFase = col.key === 'fase'
        doc.setFont('helvetica', i === 0 || isFase ? 'bold' : 'normal')
        doc.setFontSize(isFase ? 6.6 : i === ultimaColonna ? 7.8 : 8.6)
        setInk(isFase ? C.accent : i === 0 ? C.ink : i === ultimaColonna ? C.ink2 : C.ink)

        doc.text(celle[i].length > 0 ? celle[i] : ['-'], x, y + 4.6)
        x += col.w
      })

      y += altezza
      setStroke(C.line)
      doc.setLineWidth(0.15)
      doc.line(MM.margin, y, contentRight, y)
    }
  }

  disegnaIntestazione()
  disegnaRighe(piano.righe ?? [], null, colonne)

  // ── Integrazione abbinata ──────────────────────────────
  const integrazioneDaMostrare =
    !isIntegrazione && integrazione && (integrazione.righe?.length ?? 0) > 0 ? integrazione : null

  if (integrazioneDaMostrare) {
    if (y + 24 > MM.pageH - MM.footer) nuovaPagina(COLONNE_INTEGRAZIONE)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    setInk(C.accent)
    doc.text('INTEGRAZIONE ABBINATA', MM.margin, y)
    y += 4.6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.2)
    setInk(C.ink2)
    doc.text(pulisci(integrazioneDaMostrare.nome), MM.margin, y)
    y += 5.4

    const colonneInteg = COLONNE_INTEGRAZIONE
    disegnaIntestazione(colonneInteg)

    disegnaRighe(
      integrazioneDaMostrare.righe ?? [],
      [C.accentSoft[0], C.accentSoft[1], C.accentSoft[2]],
      colonneInteg,
    )
  }

  // ── Chiusura ───────────────────────────────────────────
  const totale = doc.getNumberOfPages()
  for (let p = 1; p <= totale; p += 1) {
    doc.setPage(p)
    disegnaFooter(p, totale)
  }

  return doc
}

/**
 * Restituisce il nome file suggerito per il PDF di un piano.
 */
export function nomeFilePiano(piano: PianoAlimentazione): string {
  return `${slugPiano(piano.nome)}.pdf`
}
