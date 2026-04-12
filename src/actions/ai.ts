'use server'

import { getProfile } from './profile'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

Nota di Sistema: "Pronta per l'elaborazione Antigravity."`;

const MODELS_TO_TRY = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro'
];

export async function generateWorkoutWithAI(prompt: string) {
  const profile = await getProfile();
  
  const userContext = profile 
    ? `\n\nDATI UTENTE ATTUALI:\n- Altezza: ${profile.altezza}cm\n- Peso: ${profile.peso}kg\n- Esperienza: ${profile.esperienza}\n- Consumo Calorico: ${profile.consumo_calorico}kcal\n- Obiettivi: ${profile.obiettivi || 'Massa/Forza'}`
    : '\n\nDATI UTENTE: Non disponibili. Usa parametri standard per un atleta intermedio di 80kg.';

  const fullPrompt = `${prompt}${userContext}`;

  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not found.');
  }

  let lastError = '';

  for (const modelName of MODELS_TO_TRY) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Increased to 20s

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: { 
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          }),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      // Handle non-JSON or error responses gracefully
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        lastError = `Invalid response type: ${contentType}`;
        continue;
      }

      const data = await response.json();
      
      if (!response.ok) {
        lastError = data?.error?.message || `HTTP ${response.status}`;
        console.error(`AI Action Error [${modelName}]:`, lastError);
        if (lastError.toLowerCase().includes('quota')) break; 
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text.replace(/\*\*/g, '');
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (lastError === 'The user aborted a request.') {
        lastError = 'Timeout superato (L\'IA è lenta a rispondere)';
      }
      console.error(`Fetch Exception [${modelName}]:`, lastError);
    }
  }

  // Instead of throwing and causing a 500, return a specific error string
  if (lastError.toLowerCase().includes('quota')) {
    return "ERRORE_IA: Limite quota raggiunto. Riprova tra 60 secondi.";
  }

  if (lastError.toLowerCase().includes('key') || lastError.toLowerCase().includes('not found')) {
    return "ERRORE_IA: Chiave API non valida o mancante nelle impostazioni di Vercel.";
  }

  return `ERRORE_IA: Errore durante l'elaborazione (${lastError})`;
}

export async function analyzeMuscleTargets(exercises: { nome: string; serie: number; reps: string }[]) {
  const profile = await getProfile();
  
  const exercisesList = exercises.map(ex => `- ${ex.nome}: ${ex.serie} serie x ${ex.reps} reps`).join('\n');
  
  const prompt = `Analizza dettagliatamente questa scheda di allenamento. Per ogni esercizio, spiega:
  1. Quali muscoli primari e secondari vengono coinvolti.
  2. La biomeccanica del movimento (perché è efficace).
  3. Come si inserisce nel mio obiettivo di ipertrofia.
  
  Esercizi:\n${exercisesList}`;
  
  const userContext = profile 
    ? `\n\nDATI UTENTE:\n- Altezza: ${profile.altezza}cm\n- Peso: ${profile.peso}kg\n- Esperienza: ${profile.esperienza}\n- Obiettivi: ${profile.obiettivi}`
    : '';

  const fullPrompt = `${prompt}${userContext}`;
  
  return generateWorkoutWithAI(fullPrompt);
}

export async function suggestExercisesWithAI(term: string) {
  const prompt = `Gemma 4, agisci come assistente Antigravity. Proponi una lista di massimo 5 esercizi di bodybuilding/fitness correlati a: "${term}".
  Rispondi SOLO con i nomi degli esercizi, uno per riga, senza numeri o descrizioni.`;
  
  const res = await generateWorkoutWithAI(prompt);
  return res.split('\n').map((s: string) => s.trim()).filter(Boolean);
}

export async function suggestFoodsWithAI(term: string) {
  const prompt = `Gemma 4, agisci come nutrizionista sportivo. Proponi una lista di massimo 4 pasti o alimenti sani e adatti alla massa muscolare correlati a: "${term}".
  Rispondi SOLO con i nomi degli alimenti, uno per riga, senza numeri o calorie.`;
  
  const res = await generateWorkoutWithAI(prompt);
  return res.split('\n').map((s: string) => s.trim()).filter(Boolean);
}

export async function generateDietPlanWithAI(type: 'alimentazione' | 'integrazione', obiettivi: string) {
  const profile = await getProfile();
  const context = profile 
    ? `Utente: ${profile.altezza}cm, ${profile.peso}kg, obiettivo: ${obiettivi || profile.obiettivi}`
    : `Obiettivo: ${obiettivi}`;

  const prompt = type === 'alimentazione'
    ? `Gemma 4, genera un PIANO ALIMENTARE completo per una giornata tipo (Massa/Ipertrofia). 
       ${context}
       Rispondi esclusivamente in formato CSV usando come separatore il carattere | con queste colonne:
       Orario | Pasto / Fase | Quantità | Note
       Esempio: 08:00 | Colazione Proteica | 150g Yogurt + 50g Avena | Base anabolica`
    : `Gemma 4, genera un PIANO DI INTEGRAZIONE completo per la performance e il recupero.
       ${context}
       Rispondi esclusivamente in formato CSV usando come separatore il carattere | con queste colonne:
       Orario | Integratore | Quantità | Note
       Esempio: 07:00 | BCAA 4:1:1 | 5g | Protezione muscolare`;

  const res = await generateWorkoutWithAI(prompt);
  return res;
}

export const callGemini = generateWorkoutWithAI;

