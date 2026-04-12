'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Profile {
  altezza: number;
  peso: number;
  esperienza: string;
  consumo_calorico: number;
  obiettivi: string;
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('profili')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

export async function updateProfile(profile: Profile) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Non autorizzato' }

  const { error } = await supabase
    .from('profili')
    .upsert({
      user_id: user.id,
      ...profile,
      aggiornato_at: new Date().toISOString()
    })

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/profilo')
  return { success: true }
}
