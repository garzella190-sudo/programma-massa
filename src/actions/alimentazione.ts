'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PianoAlimentazione {
  id: string;
  nome: string;
  tipo: 'alimentazione' | 'integrazione';
  creato_at: string;
  righe: RigaPiano[];
  integrazione_abbinata_id?: string | null;
}

export interface RigaPiano {
  id: string;
  piano_id: string;
  orario: string;
  voce: string;
  quantita: string;
  note: string;
  ordine: number;
  isIntegration?: boolean;
  [key: string]: string | number | boolean | undefined;
}

export async function getPiani(tipo: 'alimentazione' | 'integrazione') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('piani_alimentazione')
    .select(`*, righe:righe_piano(*)`)
    .eq('user_id', user.id)
    .eq('tipo', tipo)
    .order('creato_at', { ascending: false })

  if (error) {
    console.error('Error fetching piani:', error)
    return []
  }

  return (data as PianoAlimentazione[]).map(p => ({
    ...p,
    righe: p.righe.sort((a, b) => a.ordine - b.ordine)
  }))
}

export async function creaPiano(nome: string, tipo: 'alimentazione' | 'integrazione') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  const { data, error } = await supabase
    .from('piani_alimentazione')
    .insert([{ nome, tipo, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  revalidatePath('/dieta')
  return data
}

export async function rinominaPiano(id: string, nome: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('piani_alimentazione')
    .update({ nome })
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dieta')
}

export async function eliminaPiano(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('piani_alimentazione')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dieta')
}

export async function abbinaIntegrazione(pianoId: string, integrazioneId: string | null) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('piani_alimentazione')
    .update({ integrazione_abbinata_id: integrazioneId })
    .eq('id', pianoId)

  if (error) throw error
  revalidatePath('/dieta')
}

// ─── RIGHE ────────────────────────────────────────────

export async function aggiungiRiga(pianoId: string, data: Partial<RigaPiano>) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('righe_piano')
    .insert([{ piano_id: pianoId, ...data }])

  if (error) throw error
  revalidatePath('/dieta')
}

export async function aggiornaRiga(id: string, data: Partial<RigaPiano>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('righe_piano')
    .update(data)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dieta')
}

export async function eliminaRiga(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('righe_piano')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath('/dieta')
}

// ─── MIGRAZIONE DATI VECCHI ─────────────────────────────

export async function migraPianoMassa() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  // Check if already migrated
  const { data: existing } = await supabase
    .from('piani_alimentazione')
    .select('id')
    .eq('user_id', user.id)
    .eq('nome', 'Piano Massa 93kg')
    .maybeSingle()

  if (existing) throw new Error('Piano Massa già migrato')

  // Fetch old data
  const { data: oldData, error: fetchError } = await supabase
    .from('programma_giornaliero')
    .select('*')
    .eq('user_id', user.id)
    .order('ordine', { ascending: true })

  if (fetchError) throw fetchError
  if (!oldData || oldData.length === 0) throw new Error('Nessun dato da migrare')

  // Separate alimentazione from integrazione
  const integrationPhases = ['Supporto', 'Focus', 'Pre-WK', 'Post-WK', 'Shaker', 'Digestione', 'Repair'];
  
  const alimentazioneRows = oldData.filter(r => !integrationPhases.includes(r.fase));
  const integrazioneRows = oldData.filter(r => integrationPhases.includes(r.fase));

  // Create alimentazione plan
  if (alimentazioneRows.length > 0) {
    const { data: pianoAlim, error: errAlim } = await supabase
      .from('piani_alimentazione')
      .insert([{ nome: 'Piano Massa 93kg', tipo: 'alimentazione', user_id: user.id }])
      .select()
      .single()

    if (errAlim) throw errAlim

    const righeAlim = alimentazioneRows.map((r, idx) => ({
      piano_id: pianoAlim.id,
      orario: r.orario,
      voce: `${r.fase} — ${r.pasto}`,
      quantita: r.quantita,
      note: r.note || '',
      ordine: idx
    }))

    await supabase.from('righe_piano').insert(righeAlim)
  }

  // Create integrazione plan
  if (integrazioneRows.length > 0) {
    const { data: pianoInteg, error: errInteg } = await supabase
      .from('piani_alimentazione')
      .insert([{ nome: 'Integrazione Massa 93kg', tipo: 'integrazione', user_id: user.id }])
      .select()
      .single()

    if (errInteg) throw errInteg

    const righeInteg = integrazioneRows.map((r, idx) => ({
      piano_id: pianoInteg.id,
      orario: r.orario,
      voce: `${r.pasto} (${r.sostanza})`,
      quantita: r.quantita,
      note: r.note || '',
      ordine: idx
    }))

    await supabase.from('righe_piano').insert(righeInteg)
  }
  revalidatePath('/dieta')
}

export async function creaPianoIA(nome: string, tipo: 'alimentazione' | 'integrazione', aiString: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')

  // 1. Create the plan
  const { data: piano, error: planError } = await supabase
    .from('piani_alimentazione')
    .insert([{ nome, tipo, user_id: user.id }])
    .select()
    .single()

  if (planError) throw planError

  // 2. Parse AI String (CSV format with |)
  const lines = aiString.split('\n')
    .filter(l => l.includes('|') && !l.includes('Orario')) // Skip header and non-data lines
  
  const righe = lines.map((line, idx) => {
    const parts = line.split('|').map(p => p.trim())
    return {
      piano_id: piano.id,
      orario: parts[0] || '',
      voce: parts[1] || '',
      quantita: parts[2] || '',
      note: parts[3] || '',
      ordine: idx
    }
  }).filter(r => r.voce !== '')

  if (righe.length > 0) {
    const { error: rowError } = await supabase.from('righe_piano').insert(righe)
    if (rowError) throw rowError
  }

  revalidatePath('/dieta')
  return piano
}

revalidatePath('/dieta')
