/**
 * Configurazione Supabase condivisa (server + client).
 * Espone un errore esplicito quando le variabili d'ambiente mancano o sono invalide.
 */

export interface SupabaseConfig {
  url: string | null
  anonKey: string | null
  configurato: boolean
}

export function leggiConfigSupabase(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || null
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null
  return { url, anonKey, configurato: Boolean(url && anonKey) }
}

export const ERRORE_CONFIG =
  'Supabase non configurato: mancano NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.'

/**
 * Traduce un errore di rete generico (DNS, host inesistente, offline) in un messaggio utile.
 * Restituisce null se l'errore non è di rete.
 */
export function messaggioErroreRete(errore: unknown): string | null {
  const testo =
    errore instanceof Error
      ? `${errore.message} ${errore.cause instanceof Error ? errore.cause.message : ''}`.trim()
      : typeof errore === 'string'
        ? errore
        : ''

  if (!testo) return null

  if (/fetch failed|failed to fetch|ENOTFOUND|getaddrinfo|EAI_AGAIN|ECONNREFUSED|ETIMEDOUT|network/i.test(testo)) {
    const { url } = leggiConfigSupabase()
    const host = url ? safeHost(url) : 'URL non impostato'
    return `Impossibile raggiungere il server Supabase (${host}). Il progetto potrebbe essere eliminato o in pausa: verifica la dashboard Supabase e aggiorna NEXT_PUBLIC_SUPABASE_URL.`
  }

  return null
}

export function safeHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}
