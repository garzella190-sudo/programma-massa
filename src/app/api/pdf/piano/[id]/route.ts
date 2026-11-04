import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generaPianoPdf } from '@/lib/pdf/pianoAlimentare'
import { slugPiano } from '@/lib/slug'
import type { PianoAlimentazione } from '@/types/diet'

export const dynamic = 'force-dynamic'

/**
 * GET /api/pdf/piano/[id]
 * Genera il PDF del piano alimentare (o di integrazione) dell'utente.
 * jsPDF gira lato server: nessun peso aggiuntivo nel bundle client.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('piani_alimentazione')
      .select('*, righe:righe_piano(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ error: 'Piano non trovato' }, { status: 404 })
    }

    const piano = data as PianoAlimentazione
    piano.righe = [...(piano.righe ?? [])].sort((a, b) => a.ordine - b.ordine)

    // Piano di integrazione abbinato (mostrato in coda al PDF alimentare)
    let integrazione: PianoAlimentazione | null = null
    if (piano.tipo === 'alimentazione' && piano.integrazione_abbinata_id) {
      const { data: integr } = await supabase
        .from('piani_alimentazione')
        .select('*, righe:righe_piano(*)')
        .eq('id', piano.integrazione_abbinata_id)
        .eq('user_id', user.id)
        .maybeSingle()

      if (integr) {
        integrazione = integr as PianoAlimentazione
        integrazione.righe = [...(integrazione.righe ?? [])].sort((a, b) => a.ordine - b.ordine)
      }
    }

    const doc = await generaPianoPdf(piano, { integrazione })
    const buffer = doc.output('arraybuffer') as ArrayBuffer
    const nomeFile = `${slugPiano(piano.nome)}.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${nomeFile}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('[api/pdf/piano] errore:', error)
    return NextResponse.json({ error: 'Errore nella generazione del PDF' }, { status: 500 })
  }
}
