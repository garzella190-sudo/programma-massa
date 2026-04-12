'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface EsercizioRow {
  id: string;
  scheda_id: string;
  user_id: string;
  nome: string;
  peso: string;
  reps: number;
  serie: number;
  recupero: number;
  ordine: number;
  tags: string[];
}

export async function getSchede() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from('schede_allenamento')
    .select(`
      *,
      esercizi:esercizi_scheda(*)
    `)
    .eq('user_id', user.id)
    .order('creato_at', { ascending: false })

  if (error) {
    console.error('Error fetching schede:', error)
    return []
  }

  // Sort exercises by order
  return data.map(s => ({
    ...s,
    esercizi: (s.esercizi as EsercizioRow[]).sort((a, b) => a.ordine - b.ordine)
  }))
}

interface EsercizioInput {
  nome: string;
  peso?: string;
  reps?: string | number;
  serie?: string | number;
  recupero?: number;
  tags?: string[];
}

export async function creaScheda(nome: string, esercizi: EsercizioInput[]) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Non autorizzato - Effettua il login' }

    const { data: scheda, error: schedaError } = await supabase
      .from('schede_allenamento')
      .insert([{ nome, user_id: user.id }])
      .select()
      .single()

    if (schedaError) {
      console.error('ERRORE CREAZIONE SCHEDA:', schedaError)
      return { success: false, error: `Errore tabella schede: ${schedaError.message}` }
    }

    if (esercizi.length > 0) {
      const eserciziDaInserire = esercizi.map((e, index) => ({
        scheda_id: scheda.id,
        user_id: user.id, // Adding this as it's often required for RLS
        nome: e.nome,
        peso: e.peso || '0',
        reps: typeof e.reps === 'string' ? parseInt(e.reps) : (e.reps || 0),
        serie: typeof e.serie === 'string' ? parseInt(e.serie) : (e.serie || 0),
        recupero: e.recupero || 60,
        ordine: index,
        tags: e.tags || []
      }))

      const { error: eserciziError } = await supabase
        .from('esercizi_scheda')
        .insert(eserciziDaInserire)

      if (eserciziError) {
        console.error('ERRORE INSERIMENTO ESERCIZI:', eserciziError)
        return { success: false, error: `Errore tabella esercizi: ${eserciziError.message}` }
      }
    }

    console.log('SCHEDA CREATA CON SUCCESSO:', scheda.id)
    revalidatePath('/schede')
    return { success: true, data: scheda }
  } catch (err: any) {
    console.error('SERVER ACTION CRASH:', err)
    return { success: false, error: `Server Action Crash: ${err.message || 'Errore imprevisto'}` }
  }
}

export async function rinominaScheda(id: string, nome: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('schede_allenamento')
    .update({ nome, aggiornato_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/schede')
}

export async function duplicaScheda(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  // 1. Get original
  const { data: original, error: fetchError } = await supabase
    .from('schede_allenamento')
    .select('*, esercizi:esercizi_scheda(*)')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  // 2. Create new scheda
  const { data: nuovaScheda, error: createError } = await supabase
    .from('schede_allenamento')
    .insert([{ nome: `${original.nome} (Copia)`, user_id: user.id }])
    .select()
    .single()

  if (createError) throw createError

  // 3. Duplicate exercises
  if (original.esercizi?.length > 0) {
    const nuoviEsercizi = original.esercizi.map((e: EsercizioRow) => ({
      scheda_id: nuovaScheda.id,
      user_id: user.id,
      nome: e.nome,
      serie: e.serie,
      reps: e.reps,
      peso: e.peso,
      recupero: e.recupero,
      ordine: e.ordine,
      tags: e.tags || []
    }))

    const { error: eserciziError } = await supabase
      .from('esercizi_scheda')
      .insert(nuoviEsercizi)

    if (eserciziError) throw eserciziError
  }

  revalidatePath('/schede')
  return nuovaScheda
}

export async function aggiornaInteraScheda(schedaId: string, nome: string, esercizi: EsercizioInput[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  // 1. Rename scheda
  await supabase
    .from('schede_allenamento')
    .update({ nome, aggiornato_at: new Date().toISOString() })
    .eq('id', schedaId)

  // 2. Delete all existing exercises
  await supabase
    .from('esercizi_scheda')
    .delete()
    .eq('scheda_id', schedaId)

  // 3. Insert new exercises
  if (esercizi.length > 0) {
    const records = esercizi.map((e, idx) => ({
      scheda_id: schedaId,
      user_id: user.id,
      nome: e.nome,
      serie: typeof e.serie === 'string' ? parseInt(e.serie) : (e.serie || 1),
      reps: e.reps?.toString() || '10',
      peso: e.peso || '0',
      recupero: e.recupero || 60,
      ordine: idx,
      tags: e.tags || []
    }))

    const { error: insertErr } = await supabase
      .from('esercizi_scheda')
      .insert(records)

    if (insertErr) throw insertErr
  }

  revalidatePath('/schede')
  revalidatePath('/allenamento')
  return { success: true }
}

export async function eliminaScheda(id: string) {
  const supabase = await createClient()
  
  // 1. Delete associated exercises first to avoid FK constraints
  await supabase
    .from('esercizi_scheda')
    .delete()
    .eq('scheda_id', id)

  // 2. Delete the scheda
  const { error } = await supabase
    .from('schede_allenamento')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('ERRORE ELIMINAZIONE SCHEDA:', error)
    throw error
  }
  
  revalidatePath('/schede')
  revalidatePath('/allenamento')
}

// Exercise Actions
export async function aggiungiEsercizio(schedaId: string, data: Partial<EsercizioRow>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato - Effettua il login')

  const { error } = await supabase
    .from('esercizi_scheda')
    .insert([{ 
      scheda_id: schedaId, 
      user_id: user.id,
      ...data,
      ordine: data.ordine ?? 999 
    }])

  if (error) {
    console.error('ERRORE AGGIUNTA ESERCIZIO:', error)
    throw new Error(error.message || 'Errore aggiunta esercizio')
  }
  revalidatePath('/schede')
}

export async function aggiornaEsercizio(id: string, data: Partial<EsercizioRow>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  const { error } = await supabase
    .from('esercizi_scheda')
    .update(data)
    .eq('id', id)

  if (error) {
    console.error('ERRORE AGGIORNAMENTO ESERCIZIO:', error)
    throw new Error(error.message)
  }
  revalidatePath('/schede')
}

export async function eliminaEsercizio(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  const { error } = await supabase
    .from('esercizi_scheda')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('ERRORE ELIMINAZIONE ESERCIZIO:', error)
    throw new Error(error.message || 'Errore eliminazione esercizio')
  }
  revalidatePath('/schede')
}

export async function eliminaGruppoEsercizio(schedaId: string, nome: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  const { error } = await supabase
    .from('esercizi_scheda')
    .delete()
    .eq('scheda_id', schedaId)
    .eq('nome', nome)

  revalidatePath('/schede')
}

export async function getUltimoEsercizioInfo(nome: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Proviamo a cercare l'ultimo esercizio con lo stesso nome (case-insensitive)
  const { data, error } = await supabase
    .from('esercizi_scheda')
    .select('*')
    .eq('user_id', user.id)
    .ilike('nome', nome)
    .order('id', { ascending: false }) // id è tipicamente incrementale, più sicuro se creato_at manca
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('ERRORE RICERCA STORICO:', error)
    return null
  }
  return data
}

export async function toggleSchedaAttiva(id: string, attiva: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('schede_allenamento')
    .update({ attiva, aggiornato_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/schede')
  revalidatePath('/allenamento')
}

export async function getSchedeAttive() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('schede_allenamento')
    .select(`*, esercizi:esercizi_scheda(*)`)
    .eq('user_id', user.id)
    .eq('attiva', true)
    .order('creato_at', { ascending: false })

  if (error) {
    console.error('Error fetching active schede:', error)
    return []
  }

  return data.map(s => ({
    ...s,
    esercizi: (s.esercizi as EsercizioRow[]).sort((a, b) => a.ordine - b.ordine)
  }))
}

// Diet / Schedule Actions
export async function getProgrammaGiornaliero() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('programma_giornaliero')
    .select('*')
    .eq('user_id', user.id)
    .order('ordine', { ascending: true })

  if (error) {
    console.error('Error fetching schedule:', error)
    return []
  }
  return data
}

export async function migraDatiIniziali() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  const LEGACY_DATA = [
    { time: "07:00", phase: "Colazione", items: "Yogurt Fage + Muesli + Frutta", substance: "Proteine + Carbo + Fibre", qty: "150g+50g+100g", notes: "Base anabolica e micronutrienti.", icon: 'Coffee', highlight: false },
    { time: "07:15", phase: "Supporto", items: "Nutrea Pro", substance: "Glucosamina / Condroitina", qty: "2 cpr", notes: "Supporto strutturale cartilagini.", icon: 'ShieldPlus', highlight: true },
    { time: "07:15", phase: "Supporto", items: "OptiMSM", substance: "Metilsulfonilmetano (Zolfo)", qty: "2 capsule", notes: "Antinfiammatorio e riparazione.", icon: 'ShieldPlus', highlight: true },
    { time: "07:15", phase: "Focus", items: "Lions Mane (Hericium)", substance: "Estratto fungino (Nootropo)", qty: "1 compressa", notes: "Focus mentale per il workout.", icon: 'Zap', highlight: true },
    { time: "10:30", phase: "Spuntino", items: "Pane Integrale + Mandorle", substance: "Carbo + Grassi buoni", qty: "2 fette + 15g", notes: "Carburante energetico.", icon: 'Coffee', highlight: false },
    { time: "12:00", phase: "Pre-WK", items: "Citrullina + BCAA", substance: "Aminoacidi (Pump & Protezione)", qty: "5+5 cpr", notes: "Stimolo NO2 e anti-catabolismo.", icon: 'Zap', highlight: false },
    { time: "12:00", phase: "Pre-WK", items: "Citrullina + BCAA", substance: "Aminoacidi (Pump & Protezione)", qty: "5+5 cpr", notes: "Stimolo NO2 e anti-catabolismo.", icon: 'Zap', highlight: false },
    { time: "12:00", phase: "Pre-WK", items: "Creatina (Dose 1)", substance: "Creatina Monoidrato", qty: "3.5 g", notes: "ATP per la forza (300ml H2O).", icon: 'Zap', highlight: true },
    { time: "12:30", phase: "TRAIN", items: "Allenamento Forza", substance: "Stimolo Meccanico", qty: "60 min", notes: "Consumo stimato ~500kcal.", icon: 'Dumbbell', highlight: true },
    { time: "13:45", phase: "Pranzo", items: "Riso + Panino + Proteina + Budino", substance: "Carbo + Proteine (Caseine)", qty: "Variabile", notes: "Pasto Massa (Riso+Pane).", icon: 'Utensils', highlight: true },
    { time: "13:50", phase: "Post-WK", items: "Creatina (Dose 2)", substance: "Creatina Monoidrato", qty: "3.5 g", notes: "Recupero scorte ATP post-fatica.", icon: 'Zap', highlight: true },
    { time: "15:45", phase: "Shaker", items: "Whey + Farina d'Avena", substance: "Siero Latte + Carbo Complessi", qty: "35g + 35g", notes: "Surplus calorico (400ml H2O).", icon: 'Zap', highlight: true },
    { time: "15:45", phase: "Digestione", items: "Bromelina", substance: "Enzima Proteolitico", qty: "1 compressa", notes: "Digerisce Proteine/Avena.", icon: 'ShieldPlus', highlight: true },
    { time: "19:15", phase: "Repair", items: "OptiMSM", substance: "Metilsulfonilmetano (Zolfo)", qty: "3 capsule", notes: "Riparazione tendinea notturna.", icon: 'ShieldPlus', highlight: true },
    { time: "20:30", phase: "Cena", items: "Pasta + Proteina + Olio", substance: "Carbo + Proteine + Lipidi", qty: "100g + 200g", notes: "Recupero glicogeno notturno.", icon: 'Moon', highlight: true }
  ];

  const dataToInsert = LEGACY_DATA.map((row, idx) => ({
      user_id: user.id,
      orario: row.time,
      fase: row.phase,
      pasto: row.items,
      sostanza: row.substance,
      quantita: row.qty,
      note: row.notes,
      icona: row.icon,
      evidenziato: row.highlight,
      ordine: idx
  }))

  const { error } = await supabase
    .from('programma_giornaliero')
    .insert(dataToInsert)

  if (error) throw error
  revalidatePath('/programma')
}

/**
 * MIGRAZIONE: Corregge il bug della numerazione delle serie (serie: 1)
 * per tutti i record esistenti nel database.
 */
export async function migraSerieEsercizi() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  // 1. Prendi tutti gli esercizi dell'utente
  const { data: esercizi, error } = await supabase
    .from('esercizi_scheda')
    .select('*')
    .eq('user_id', user.id)
    .order('scheda_id', { ascending: true })
    .order('ordine', { ascending: true })

  if (error) throw error
  if (!esercizi || esercizi.length === 0) return { success: true, count: 0 }

  // 2. Raggruppa per scheda e nome per ricalcolare la serie
  let updatedCount = 0;
  const groups: Record<string, number> = {}; // schedaId-nome -> counter

  for (const ex of esercizi) {
    const key = `${ex.scheda_id}-${ex.nome}`;
    groups[key] = (groups[key] || 0) + 1;
    
    const correctSerie = groups[key];
    
    if (ex.serie !== correctSerie) {
      const { error: updateErr } = await supabase
        .from('esercizi_scheda')
        .update({ serie: correctSerie })
        .eq('id', ex.id)
      
      if (updateErr) console.error(`Errore aggiornamento esercizio ${ex.id}:`, updateErr)
      else updatedCount++;
    }
  }

  revalidatePath('/schede')
  revalidatePath('/allenamento')
  return { success: true, count: updatedCount }
}
