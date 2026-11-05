'use server'

import { getProfile } from './profile'
import {
  baseUrlOpenAI,
  chiaveGemini,
  chiaveOpenAI,
  leggiConfigIA,
  messaggioErroreIA,
  modelloOpenAI,
  modelliGemini,
} from '@/lib/ai/config'

const SYSTEM_PROMPT = `Sei l'Advanced Fitness Architect dell'ecosistema Antigravity, integrato con il modello Gemma 4.

IL TUO RUOLO:
Agisci come un esperto di biomeccanica, nutrizione sportiva e programmazione dell'allenamento. Sei il motore logico dietro l'app Allenamenti Manu.

DIRETTIVE DI RISPOSTA:
1. Se l'utente chiede una SCHEDA via tasto "Genera": Rispondi SEMPRE con una tabella Markdown strutturata come segue:
   ## [Nome Allenamento]
   - Focus: [Muscolo/Obiettivo]
   - Parametri utente applicati: [Sintesi biometrica]
   | Esercizio | Set x Reps | Recupero | Note Tecniche (Target Muscolare) |
   | :--- | :--- | :--- | :--- |
   | ... | ... | ... | ... |

2. Se l'utente chiede di NUTRIZIONE o INTEGRATORI: Rispondi come consulente tecnico, analizzando i macronutrienti e suggerendo ottimizzazioni basate sui dati biometrici (altezza, peso, livello). Sii preciso e scientifico.

3. Visualizzazione Avatar: Quando suggerisci esercizi, specifica sempre il muscolo target nelle note per l'avatar 3D.

4. Tono: Professionale, motivante, tecnico (Gemma 4 signature style).

DATI BIOMETRICI: Utilizza sempre Altezza, Peso ed Esperienza forniti per personalizzare i consigli. Se mancano, usa uno standard intermedio (80kg).

Nota di Sistema: "Pronta per l'elaborazione Antigravity."`

const TIMEOUT_MS = 30_000

/** Rimuove i grassetti Markdown: l'app mostra testo semplice. */
function normalizza(testo: string): string {
  return testo.replace(/\*\*/g, '').trim()
}

// ─── Provider compatibile OpenAI (AI_BASE_URL + AI_API_KEY) ────────────

async function chiamaOpenAICompatible(prompt: string): Promise<string> {
  const base = baseUrlOpenAI()
  const chiave = chiaveOpenAI()
  if (!base || !chiave) throw new Error('Provider IA non configurato.')

  let risposta: Response
  try {
    risposta = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${chiave}`,
      },
      body: JSON.stringify({
        model: modelloOpenAI(),
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch (errore) {
    throw new Error(messaggioErroreIA({ messaggio: errore instanceof Error ? errore.message : '' }))
  }

  const dati = (await risposta.json().catch(() => null)) as
    | { choices?: { message?: { content?: string } }[]; error?: { message?: string } }
    | null

  if (!risposta.ok) {
    throw new Error(messaggioErroreIA({ status: risposta.status, messaggio: dati?.error?.message }))
  }

  const testo = dati?.choices?.[0]?.message?.content
  if (!testo) throw new Error(messaggioErroreIA({ status: risposta.status }))
  return normalizza(testo)
}

// ─── Google Gemini (chiave nativa) ─────────────────────────────────────

async function chiamaGemini(prompt: string): Promise<string> {
  const chiave = chiaveGemini()
  if (!chiave) throw new Error('Chiave Gemini non configurata.')

  let ultimoErrore = ''

  for (const modello of modelliGemini()) {
    let risposta: Response
    try {
      risposta = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modello}:generateContent?key=${chiave}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        },
      )
    } catch (errore) {
      ultimoErrore = errore instanceof Error ? errore.message : String(errore)
      continue
    }

    const dati = (await risposta.json().catch(() => null)) as
      | {
          candidates?: { content?: { parts?: { text?: string }[] } }[]
          error?: { message?: string; status?: string }
        }
      | null

    if (!risposta.ok) {
      ultimoErrore = dati?.error?.message ?? `HTTP ${risposta.status}`
      // Chiave bloccata/leaked o non valida: inutile provare altri modelli.
      if (
        risposta.status === 401 ||
        risposta.status === 403 ||
        /leaked|api key not valid/i.test(ultimoErrore)
      ) {
        throw new Error(messaggioErroreIA({ status: risposta.status, messaggio: ultimoErrore }))
      }
      continue
    }

    const testo = dati?.candidates?.[0]?.content?.parts?.[0]?.text
    if (testo) return normalizza(testo)
    ultimoErrore = 'Risposta vuota dal modello'
  }

  throw new Error(messaggioErroreIA({ messaggio: ultimoErrore }))
}

// ─── API pubblica ───────────────────────────────────────────────────────

/**
 * Genera testo con il provider IA configurato.
 * Lancia un Error con messaggio già leggibile in caso di problemi.
 */
export async function generateWorkoutWithAI(prompt: string): Promise<string> {
  const config = leggiConfigIA()
  if (!config.configurata || !config.provider) throw new Error(config.dettaglio)

  const profile = await getProfile()
  const contesto = profile
    ? `\n\nDATI UTENTE ATTUALI:\n- Altezza: ${profile.altezza}cm\n- Peso: ${profile.peso}kg\n- Esperienza: ${profile.esperienza}\n- Consumo Calorico: ${profile.consumo_calorico}kcal\n- Obiettivi: ${profile.obiettivi || 'Massa/Forza'}`
    : '\n\nDATI UTENTE: Non disponibili. Usa parametri standard per un atleta intermedio di 80kg.'

  const promptCompleto = `${prompt}${contesto}`

  return config.provider === 'openai-compatibile'
    ? chiamaOpenAICompatible(promptCompleto)
    : chiamaGemini(promptCompleto)
}

/** Stato della configurazione IA (per diagnostica). */
export async function statoIA() {
  return leggiConfigIA()
}

export async function analyzeMuscleTargets(exercises: { nome: string; serie: number; reps: string }[]) {
  const profile = await getProfile()
  const elenco = exercises.map((ex) => `- ${ex.nome}: ${ex.serie} serie x ${ex.reps} reps`).join('\n')

  const prompt = `Analizza dettagliatamente questa scheda di allenamento. Per ogni esercizio, spiega:
  1. Quali muscoli primari e secondari vengono coinvolti.
  2. La biomeccanica del movimento (perché è efficace).
  3. Come si inserisce nel mio obiettivo di ipertrofia.

  Esercizi:\n${elenco}${
    profile
      ? `\n\nDATI UTENTE:\n- Altezza: ${profile.altezza}cm\n- Peso: ${profile.peso}kg\n- Esperienza: ${profile.esperienza}\n- Obiettivi: ${profile.obiettivi}`
      : ''
  }`

  return generateWorkoutWithAI(prompt)
}

export async function suggestExercisesWithAI(term: string) {
  const prompt = `Agisci come assistente di bodybuilding/fitness. Proponi una lista di massimo 5 esercizi correlati a: "${term}".
  Rispondi SOLO con i nomi degli esercizi, uno per riga, senza numeri o descrizioni.`

  const res = await generateWorkoutWithAI(prompt)
  return res
    .split('\n')
    .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean)
}

export async function suggestFoodsWithAI(term: string) {
  const prompt = `Agisci come nutrizionista sportivo. Proponi una lista di massimo 4 pasti o alimenti sani e adatti alla massa muscolare correlati a: "${term}".
  Rispondi SOLO con i nomi degli alimenti, uno per riga, senza numeri o calorie.`

  const res = await generateWorkoutWithAI(prompt)
  return res
    .split('\n')
    .map((s) => s.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean)
}

export async function generateDietPlanWithAI(type: 'alimentazione' | 'integrazione', obiettivi: string) {
  const profile = await getProfile()
  const contesto = profile
    ? `Utente: ${profile.altezza}cm, ${profile.peso}kg, obiettivo: ${obiettivi || profile.obiettivi}`
    : `Obiettivo: ${obiettivi || 'Massa/Ipertrofia'}`

  const prompt =
    type === 'alimentazione'
      ? `Genera un PIANO ALIMENTARE completo per una giornata tipo (Massa/Ipertrofia).
       ${contesto}
       Rispondi esclusivamente in formato CSV usando come separatore il carattere | con queste colonne:
       Orario | Pasto / Fase | Quantità | Note
       Esempio: 08:00 | Colazione Proteica | 150g Yogurt + 50g Avena | Base anabolica`
      : `Genera un PIANO DI INTEGRAZIONE completo per la performance e il recupero.
       ${contesto}
       Rispondi esclusivamente in formato CSV usando come separatore il carattere | con queste colonne:
       Orario | Integratore | Quantità | Note
       Esempio: 07:00 | BCAA 4:1:1 | 5g | Protezione muscolare`

  return generateWorkoutWithAI(prompt)
}

export const callGemini = generateWorkoutWithAI
