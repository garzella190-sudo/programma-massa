import { NextResponse } from 'next/server'
import { leggiConfigSupabase, safeHost } from '@/utils/supabase/config'
import { leggiConfigIA } from '@/lib/ai/config'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 * Diagnostica del backend: verifica che le variabili Supabase siano presenti
 * e che il progetto risponda davvero (utile quando il login dà "Failed to fetch").
 * Riporta anche se l'IA è configurata e con quale provider.
 */
export async function GET() {
  const ia = leggiConfigIA()
  const { url, configurato } = leggiConfigSupabase()

  if (!configurato || !url) {
    return NextResponse.json(
      {
        ok: false,
        configurato: false,
        dettaglio:
          'Mancano NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY nelle variabili d\u2019ambiente.',
        ia: { configurata: ia.configurata, provider: ia.provider, modello: ia.modello },
      },
      { status: 503 },
    )
  }

  const host = safeHost(url)

  try {
    const risposta = await fetch(`${url}/auth/v1/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    })

    return NextResponse.json(
      {
        ok: risposta.ok,
        configurato: true,
        host,
        stato: risposta.status,
        dettaglio: risposta.ok ? null : `Supabase ha risposto con stato ${risposta.status}.`,
        ia: { configurata: ia.configurata, provider: ia.provider, modello: ia.modello },
      },
      { status: risposta.ok ? 200 : 503 },
    )
  } catch (errore) {
    console.error('[api/health] backend non raggiungibile:', errore)
    return NextResponse.json(
      {
        ok: false,
        configurato: true,
        host,
        dettaglio: `DNS o connessione fallita verso ${host}: il progetto Supabase potrebbe essere eliminato o in pausa.`,
        ia: { configurata: ia.configurata, provider: ia.provider, modello: ia.modello },
      },
      { status: 503 },
    )
  }
}
