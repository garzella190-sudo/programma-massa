// lib/ai/config.ts
// Configurazione del provider IA (modulo neutro: importabile da server action,
// route handler e client senza trascinare jsPDF o logica di dominio).

export type TipoProviderIA = 'openai-compatibile' | 'gemini'

export interface ConfigIA {
  provider: TipoProviderIA | null
  configurata: boolean
  modello: string | null
  dettaglio: string
}

/** Modelli Gemini tentati in ordine (i vecchi 1.5/2.0 sono stati ritirati). */
export const MODELLI_GEMINI = [
  'gemini-flash-latest',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
]

export function modelliGemini(): string[] {
  const preferito = process.env.GEMINI_MODEL?.trim()
  if (!preferito) return MODELLI_GEMINI
  return [preferito, ...MODELLI_GEMINI.filter((m) => m !== preferito)]
}

export function chiaveGemini(): string | null {
  return process.env.GEMINI_API_KEY?.trim() || null
}

export function baseUrlOpenAI(): string | null {
  const base = process.env.AI_BASE_URL?.trim()
  return base ? base.replace(/\/+$/, '') : null
}

export function chiaveOpenAI(): string | null {
  return process.env.AI_API_KEY?.trim() || null
}

export function modelloOpenAI(): string {
  return process.env.AI_MODEL?.trim() || 'gpt-4o-mini'
}

/**
 * Priorità: provider OpenAI-compatibile (AI_BASE_URL + AI_API_KEY) se configurato,
 * altrimenti Gemini nativo (GEMINI_API_KEY).
 */
export function leggiConfigIA(): ConfigIA {
  const base = baseUrlOpenAI()
  const chiaveOpen = chiaveOpenAI()
  if (base && chiaveOpen) {
    return {
      provider: 'openai-compatibile',
      configurata: true,
      modello: modelloOpenAI(),
      dettaglio: `Provider compatibile OpenAI su ${base}`,
    }
  }

  const gemini = chiaveGemini()
  if (gemini) {
    return {
      provider: 'gemini',
      configurata: true,
      modello: modelliGemini()[0],
      dettaglio: 'Google Gemini (chiave nativa)',
    }
  }

  return {
    provider: null,
    configurata: false,
    modello: null,
    dettaglio:
      'Nessuna chiave IA configurata: imposta GEMINI_API_KEY oppure AI_BASE_URL + AI_API_KEY.',
  }
}

export interface DettaglioErroreIA {
  status?: number
  messaggio?: string
}

/** Traduce gli errori tipici dei provider in un messaggio azionabile. */
export function messaggioErroreIA(dettaglio: DettaglioErroreIA): string {
  const msg = (dettaglio.messaggio ?? '').toLowerCase()
  const status = dettaglio.status

  if (msg.includes('reported as leaked') || msg.includes('leaked')) {
    return 'La chiave Gemini è stata segnalata come compromessa (leaked) e Google l\u2019ha bloccata. Creane una nuova su aistudio.google.com/apikey e aggiorna GEMINI_API_KEY (oppure usa AI_BASE_URL + AI_API_KEY).'
  }
  if (msg.includes('api key not valid') || msg.includes('invalid api key') || msg.includes('api_key_invalid')) {
    return 'Chiave API IA non valida: controlla GEMINI_API_KEY / AI_API_KEY.'
  }
  if (status === 401 || status === 403) {
    return `Chiave IA rifiutata dal provider (HTTP ${status}): verifica permessi e progetto associati alla chiave.`
  }
  if (status === 429 || msg.includes('quota') || msg.includes('rate limit')) {
    return 'Quota IA esaurita o troppe richieste: riprova tra qualche minuto o usa un\u2019altra chiave.'
  }
  if (msg.includes('fetch failed') || msg.includes('enotfound') || msg.includes('timeout') || msg.includes('abort')) {
    return 'IA non raggiungibile: problema di rete o timeout della richiesta.'
  }
  if (!dettaglio.messaggio) {
    return `Errore IA${status ? ` (HTTP ${status})` : ''}: risposta non valida dal provider.`
  }
  return `Errore IA${status ? ` (HTTP ${status})` : ''}: ${dettaglio.messaggio}`
}
