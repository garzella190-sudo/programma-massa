'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PianoAlimentazione, RigaPiano, TipoPiano } from '@/types/diet'
import {
  NOME_INTEGRAZIONE_MASSA,
  NOME_PIANO_MASSA,
  righePerTipo,
} from '@/lib/seedPianoMassa'

// Re-export dei tipi per comodità dei consumer lato client
export type { PianoAlimentazione, RigaPiano, TipoPiano }

const REVALIDATE = '/dieta'

async function getSupabaseAutenticato() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorizzato')
  return { supabase, user }
}

// ─── PIANI ────────────────────────────────────────────────

export async function getPiani(tipo: TipoPiano): Promise<PianoAlimentazione[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('piani_alimentazione')
    .select('*, righe:righe_piano(*)')
    .eq('user_id', user.id)
    .eq('tipo', tipo)
    .order('creato_at', { ascending: false })

  if (error) {
    console.error('[alimentazione] getPiani:', error.message)
    return []
  }

  return (data as PianoAlimentazione[]).map((piano) => ({
    ...piano,
    righe: [...(piano.righe ?? [])].sort((a, b) => a.ordine - b.ordine),
  }))
}

export async function creaPiano(nome: string, tipo: TipoPiano) {
  const { supabase, user } = await getSupabaseAutenticato()

  const { data, error } = await supabase
    .from('piani_alimentazione')
    .insert([{ nome, tipo, user_id: user.id }])
    .select()
    .single()

  if (error) throw error
  revalidatePath(REVALIDATE)
  return data as PianoAlimentazione
}

export async function rinominaPiano(id: string, nome: string) {
  const { supabase } = await getSupabaseAutenticato()

  const { error } = await supabase
    .from('piani_alimentazione')
    .update({ nome })
    .eq('id', id)

  if (error) throw error
  revalidatePath(REVALIDATE)
}

export async function eliminaPiano(id: string) {
  const { supabase } = await getSupabaseAutenticato()

  const { error } = await supabase.from('piani_alimentazione').delete().eq('id', id)

  if (error) throw error
  revalidatePath(REVALIDATE)
}

export async function abbinaIntegrazione(pianoId: string, integrazioneId: string | null) {
  const { supabase } = await getSupabaseAutenticato()

  const { error } = await supabase
    .from('piani_alimentazione')
    .update({ integrazione_abbinata_id: integrazioneId })
    .eq('id', pianoId)

  if (error) throw error
  revalidatePath(REVALIDATE)
}

// ─── RIGHE ────────────────────────────────────────────────

export async function aggiungiRiga(pianoId: string, data: Partial<RigaPiano>) {
  const { supabase } = await getSupabaseAutenticato()

  const { error } = await supabase.from('righe_piano').insert([
    {
      piano_id: pianoId,
      orario: data.orario ?? '',
      voce: data.voce ?? '',
      quantita: data.quantita ?? '',
      note: data.note ?? '',
      ordine: data.ordine ?? 0,
    },
  ])

  if (error) throw error
  revalidatePath(REVALIDATE)
}

export async function aggiornaRiga(id: string, data: Partial<Pick<RigaPiano, 'orario' | 'voce' | 'quantita' | 'note' | 'ordine'>>) {
  const { supabase } = await getSupabaseAutenticato()

  const { error } = await supabase.from('righe_piano').update(data).eq('id', id)

  if (error) throw error
  revalidatePath(REVALIDATE)
}

export async function eliminaRiga(id: string) {
  const { supabase } = await getSupabaseAutenticato()

  const { error } = await supabase.from('righe_piano').delete().eq('id', id)

  if (error) throw error
  revalidatePath(REVALIDATE)
}

// ─── CREAZIONE DA IA ──────────────────────────────────────

/**
 * Crea un piano a partire dall'output CSV (`Orario | Voce | Quantità | Note`)
 * generato dall'assistente IA.
 */
export async function creaPianoIA(nome: string, tipo: TipoPiano, aiString: string) {
  const { supabase, user } = await getSupabaseAutenticato()

  const { data: piano, error: planError } = await supabase
    .from('piani_alimentazione')
    .insert([{ nome, tipo, user_id: user.id }])
    .select()
    .single()

  if (planError) throw planError

  const righe = aiString
    .split('\n')
    .filter((line) => line.includes('|') && !/orario/i.test(line.split('|')[0] ?? ''))
    .map((line, idx) => {
      const [orario, voce, quantita, note] = line.split('|').map((part) => part.trim())
      return {
        piano_id: piano.id as string,
        orario: orario ?? '',
        voce: voce ?? '',
        quantita: quantita ?? '',
        note: note ?? '',
        ordine: idx,
      }
    })
    .filter((riga) => riga.voce !== '')

  if (righe.length > 0) {
    const { error: rowError } = await supabase.from('righe_piano').insert(righe)
    if (rowError) throw rowError
  }

  revalidatePath(REVALIDATE)
  return piano as PianoAlimentazione
}

// ─── MIGRAZIONE DATI STORICI ───────────────────────────────

const FASI_INTEGRAZIONE = ['Supporto', 'Focus', 'Pre-WK', 'Post-WK', 'Shaker', 'Digestione', 'Repair']

export async function migraPianoMassa() {
  const { supabase, user } = await getSupabaseAutenticato()

  const { data: giaMigrato } = await supabase
    .from('piani_alimentazione')
    .select('id')
    .eq('user_id', user.id)
    .eq('nome', 'Piano Massa 93kg')
    .maybeSingle()

  if (giaMigrato) throw new Error('Piano Massa già migrato')

  const { data: vecchiDati, error: fetchError } = await supabase
    .from('programma_giornaliero')
    .select('*')
    .eq('user_id', user.id)
    .order('ordine', { ascending: true })

  if (fetchError) throw fetchError
  if (!vecchiDati || vecchiDati.length === 0) throw new Error('Nessun dato da migrare')

  const righeAlimentazione = vecchiDati.filter((r) => !FASI_INTEGRAZIONE.includes(r.fase))
  const righeIntegrazione = vecchiDati.filter((r) => FASI_INTEGRAZIONE.includes(r.fase))

  if (righeAlimentazione.length > 0) {
    const { data: pianoAlim, error: errAlim } = await supabase
      .from('piani_alimentazione')
      .insert([{ nome: 'Piano Massa 93kg', tipo: 'alimentazione', user_id: user.id }])
      .select()
      .single()

    if (errAlim) throw errAlim

    await supabase.from('righe_piano').insert(
      righeAlimentazione.map((r, idx) => ({
        piano_id: pianoAlim.id,
        orario: r.orario,
        voce: `${r.fase} — ${r.pasto}`,
        quantita: r.quantita,
        note: r.note || '',
        ordine: idx,
      })),
    )
  }

  if (righeIntegrazione.length > 0) {
    const { data: pianoInteg, error: errInteg } = await supabase
      .from('piani_alimentazione')
      .insert([{ nome: 'Integrazione Massa 93kg', tipo: 'integrazione', user_id: user.id }])
      .select()
      .single()

    if (errInteg) throw errInteg

    await supabase.from('righe_piano').insert(
      righeIntegrazione.map((r, idx) => ({
        piano_id: pianoInteg.id,
        orario: r.orario,
        voce: `${r.pasto} (${r.sostanza})`,
        quantita: r.quantita,
        note: r.note || '',
        ordine: idx,
      })),
    )
  }

  revalidatePath(REVALIDATE)
}

// ─── RIPRISTINO DEL PIANO ORIGINALE ───────────────────────

/**
 * Ricrea il "Piano Massa 93kg" e la relativa integrazione usando i dati originali
 * salvati in `lib/seedPianoMassa.ts` (utile se il database è stato ricreato o svuotato).
 * Non fa nulla se i piani esistono già.
 */
export async function ripristinaPianoMassa() {
  const { supabase, user } = await getSupabaseAutenticato()

  const { data: esistenti } = await supabase
    .from('piani_alimentazione')
    .select('id, nome, tipo')
    .eq('user_id', user.id)

  const creati: string[] = []

  for (const tipo of ['alimentazione', 'integrazione'] as const) {
    const nome = tipo === 'alimentazione' ? NOME_PIANO_MASSA : NOME_INTEGRAZIONE_MASSA
    const gia = (esistenti ?? []).find((p) => p.nome === nome && p.tipo === tipo)
    if (gia) continue

    const righeSeed = righePerTipo(tipo)
    if (righeSeed.length === 0) continue

    const { data: piano, error: errPiano } = await supabase
      .from('piani_alimentazione')
      .insert([{ nome, tipo, user_id: user.id }])
      .select()
      .single()

    if (errPiano) throw errPiano

    const { error: errRighe } = await supabase.from('righe_piano').insert(
      righeSeed.map((riga) => ({
        piano_id: piano.id,
        orario: riga.orario,
        voce: `${riga.fase} — ${riga.pasto}`,
        quantita: riga.quantita,
        note: riga.sostanza ? `${riga.sostanza} · ${riga.note}`.replace(/ · $/, '') : riga.note,
        ordine: riga.ordine,
      })),
    )

    if (errRighe) throw errRighe
    creati.push(piano.id)
  }

  // Abbina automaticamente l'integrazione al piano alimentare
  if (creati.length > 0) {
    const { data: piani } = await supabase
      .from('piani_alimentazione')
      .select('id, tipo')
      .eq('user_id', user.id)

    const alimentazione = (piani ?? []).find((p) => p.tipo === 'alimentazione')
    const integrazione = (piani ?? []).find((p) => p.tipo === 'integrazione')

    if (alimentazione && integrazione) {
      await supabase
        .from('piani_alimentazione')
        .update({ integrazione_abbinata_id: integrazione.id })
        .eq('id', alimentazione.id)
    }
  }

  revalidatePath(REVALIDATE)
  return creati
}
