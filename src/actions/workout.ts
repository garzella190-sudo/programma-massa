// src/actions/workout.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { EsercizioCatalogo, SchedaAllenamento, EsercizioScheda, Allenamento, SerieAllenamento, TipoSerie, SerieInput, EsercizioAllenamentoInput } from '@/types/workout'

// ==========================================
// 1. CATALOGO ESERCIZI
// ==========================================

export async function getEserciziCatalogo(): Promise<EsercizioCatalogo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('esercizi_catalogo')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Error fetching esercizi catalogo:', error)
    return []
  }
  return data || []
}

export async function creaEsercizioCatalogo(nome: string, gruppo: string, attrezzatura: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('esercizi_catalogo')
    .insert([{ nome, gruppo_muscolare: gruppo, attrezzatura }])
    .select()
    .single()

  if (error) {
    console.error('Error creating esercizio catalogo:', error)
    throw error
  }
  return data
}

// ==========================================
// 2. SCHEDE / ROUTINE (TEMPLATES)
// ==========================================

export async function getSchede(): Promise<(SchedaAllenamento & { esercizi: (EsercizioScheda & { esercizio: EsercizioCatalogo })[] })[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('schede_allenamento')
    .select(`
      *,
      esercizi:esercizi_scheda(
        *,
        esercizio:esercizi_catalogo(*)
      )
    `)
    .eq('user_id', user.id)
    .order('creato_at', { ascending: false })

  if (error) {
    console.error('Error fetching schede:', error)
    return []
  }

  // Ordina gli esercizi secondo il campo 'ordine'
  const schedeOrdinate = (data || []).map((scheda: any) => {
    const eserciziOrdinati = (scheda.esercizi || []).sort((a: any, b: any) => a.ordine - b.ordine);
    return {
      ...scheda,
      esercizi: eserciziOrdinati
    };
  });

  return schedeOrdinate;
}

interface EsercizioSchedaInput {
  esercizio_id: string;
  serie_target: number;
  reps_target: string;
  recupero_target: number;
}

export async function creaScheda(nome: string, esercizi: EsercizioSchedaInput[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorizzato' }

    // 1. Crea la scheda
    const { data: scheda, error: schedaError } = await supabase
      .from('schede_allenamento')
      .insert([{ nome, user_id: user.id }])
      .select()
      .single()

    if (schedaError) throw schedaError

    // 2. Inserisci gli esercizi
    if (esercizi.length > 0) {
      const records = esercizi.map((e, idx) => ({
        scheda_id: scheda.id,
        esercizio_id: e.esercizio_id,
        serie_target: e.serie_target,
        reps_target: e.reps_target,
        recupero_target: e.recupero_target,
        ordine: idx
      }))

      const { error: eserciziError } = await supabase
        .from('esercizi_scheda')
        .insert(records)

      if (eserciziError) throw eserciziError
    }

    revalidatePath('/schede')
    revalidatePath('/allenamento')
    return { success: true, data: scheda }
  } catch (err: any) {
    console.error('Error in creaScheda:', err)
    return { success: false, error: err.message || 'Errore imprevisto' }
  }
}

export async function aggiornaInteraScheda(schedaId: string, nome: string, esercizi: EsercizioSchedaInput[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorizzato' }

    // 1. Aggiorna nome e data
    const { error: updateSchedaErr } = await supabase
      .from('schede_allenamento')
      .update({ nome, aggiornato_at: new Date().toISOString() })
      .eq('id', schedaId)

    if (updateSchedaErr) throw updateSchedaErr

    // 2. Cancella esercizi esistenti nella scheda
    const { error: deleteErr } = await supabase
      .from('esercizi_scheda')
      .delete()
      .eq('scheda_id', schedaId)

    if (deleteErr) throw deleteErr

    // 3. Inserisci i nuovi esercizi
    if (esercizi.length > 0) {
      const records = esercizi.map((e, idx) => ({
        scheda_id: schedaId,
        esercizio_id: e.esercizio_id,
        serie_target: e.serie_target,
        reps_target: e.reps_target,
        recupero_target: e.recupero_target,
        ordine: idx
      }))

      const { error: insertErr } = await supabase
        .from('esercizi_scheda')
        .insert(records)

      if (insertErr) throw insertErr
    }

    revalidatePath('/schede')
    revalidatePath('/allenamento')
    return { success: true }
  } catch (err: any) {
    console.error('Error in aggiornaInteraScheda:', err)
    return { success: false, error: err.message || 'Errore imprevisto' }
  }
}

export async function eliminaScheda(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('schede_allenamento')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/schede')
    revalidatePath('/allenamento')
    return { success: true }
  } catch (err: any) {
    console.error('Error in eliminaScheda:', err)
    return { success: false, error: err.message }
  }
}

// ==========================================
// 3. ALLENAMENTI (DIARIO / LIVE SESSION)
// ==========================================

// SerieInput e EsercizioAllenamentoInput sono definiti in @/types/workout e re-esportati qui per comodità
export type { SerieInput, EsercizioAllenamentoInput } from '@/types/workout'

export async function completaAllenamento(
  nome: string,
  note: string | null,
  inizio_at: string,
  fine_at: string,
  scheda_id: string | null,
  esercizi: EsercizioAllenamentoInput[]
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorizzato' }

    // 1. Crea la sessione di allenamento
    const { data: workout, error: workoutErr } = await supabase
      .from('allenamenti')
      .insert([{
        user_id: user.id,
        scheda_id: scheda_id || null,
        nome: nome || 'Allenamento',
        inizio_at,
        fine_at,
        note
      }])
      .select()
      .single()

    if (workoutErr) throw workoutErr

    // 2. Inserisci tutte le serie eseguite
    const serieRecords: any[] = []
    
    esercizi.forEach((ex) => {
      ex.serie.forEach((s) => {
        serieRecords.push({
          allenamento_id: workout.id,
          esercizio_id: ex.esercizio_id,
          tipo: s.tipo,
          peso: s.peso,
          reps: s.reps,
          rpe: s.rpe || null
        })
      })
    })

    if (serieRecords.length > 0) {
      const { error: serieErr } = await supabase
        .from('serie_allenamento')
        .insert(serieRecords)

      if (serieErr) throw serieErr
    }

    revalidatePath('/profilo')
    revalidatePath('/esercizi')
    return { success: true, workoutId: workout.id }
  } catch (err: any) {
    console.error('Error in completaAllenamento:', err)
    return { success: false, error: err.message || 'Errore imprevisto' }
  }
}

export async function getStoricoAllenamenti() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('allenamenti')
    .select(`
      *,
      serie:serie_allenamento(
        *,
        esercizio:esercizi_catalogo(*)
      )
    `)
    .eq('user_id', user.id)
    .not('fine_at', 'is', null) // Mostra solo allenamenti completati
    .order('inizio_at', { ascending: false })

  if (error) {
    console.error('Error fetching storico allenamenti:', error)
    return []
  }

  return data || []
}

export async function eliminaAllenamento(id: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('allenamenti')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/profilo')
    revalidatePath('/esercizi')
    return { success: true }
  } catch (err: any) {
    console.error('Error in eliminaAllenamento:', err)
    return { success: false, error: err.message }
  }
}

// Ottieni lo storico delle serie per un singolo esercizio
export async function getStoricoEsercizio(esercizioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('serie_allenamento')
    .select(`
      *,
      allenamento:allenamenti(*)
    `)
    .eq('esercizio_id', esercizioId)
    .order('creato_at', { ascending: false })

  if (error) {
    console.error('Error fetching storico esercizio:', error)
    return []
  }

  return data || []
}

// ==========================================
// 4. UTILITÀ SCHEDE
// ==========================================

export async function duplicaScheda(schedaId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Non autorizzato' }

    // 1. Recupera la scheda originale con i suoi esercizi
    const { data: original, error: fetchErr } = await supabase
      .from('schede_allenamento')
      .select(`*, esercizi:esercizi_scheda(*)`)
      .eq('id', schedaId)
      .single()

    if (fetchErr || !original) throw fetchErr || new Error('Scheda non trovata')

    // 2. Crea la nuova scheda (copia)
    const { data: nuova, error: insertErr } = await supabase
      .from('schede_allenamento')
      .insert([{
        user_id: user.id,
        nome: `${original.nome} (copia)`,
        attiva: true
      }])
      .select()
      .single()

    if (insertErr || !nuova) throw insertErr || new Error('Errore creazione copia')

    // 3. Copia gli esercizi nella nuova scheda
    if (original.esercizi && original.esercizi.length > 0) {
      const nuoviEsercizi = original.esercizi.map((e: any) => ({
        scheda_id: nuova.id,
        esercizio_id: e.esercizio_id,
        serie_target: e.serie_target,
        reps_target: e.reps_target,
        recupero_target: e.recupero_target,
        ordine: e.ordine
      }))

      const { error: eserciziErr } = await supabase
        .from('esercizi_scheda')
        .insert(nuoviEsercizi)

      if (eserciziErr) throw eserciziErr
    }

    revalidatePath('/schede')
    return { success: true, data: nuova }
  } catch (err: any) {
    console.error('Error in duplicaScheda:', err)
    return { success: false, error: err.message || 'Errore imprevisto' }
  }
}

export async function toggleSchedaAttiva(schedaId: string, attiva: boolean) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('schede_allenamento')
      .update({ attiva })
      .eq('id', schedaId)

    if (error) throw error

    revalidatePath('/schede')
    revalidatePath('/allenamento')
    return { success: true }
  } catch (err: any) {
    console.error('Error in toggleSchedaAttiva:', err)
    return { success: false, error: err.message || 'Errore imprevisto' }
  }
}
