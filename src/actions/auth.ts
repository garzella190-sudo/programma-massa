'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { messaggioErroreRete } from '@/utils/supabase/config'

/** Messaggio leggibile: prima la causa di rete, poi l'errore Supabase. */
function messaggioErrore(errore: unknown, fallback: string): string {
  return messaggioErroreRete(errore) ?? (errore instanceof Error ? errore.message : fallback)
}

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }

    revalidatePath('/', 'layout')
  } catch (errore) {
    console.error('[auth] signIn:', errore)
    return { error: messaggioErrore(errore, 'Errore durante l\u2019accesso.') }
  }

  // redirect() lancia un errore di controllo: va fuori dal try/catch
  redirect('/schede')
}

export async function signUp(formData: FormData, origin: string) {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  try {
    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    })
    if (error) return { error: error.message }
  } catch (errore) {
    console.error('[auth] signUp:', errore)
    return { error: messaggioErrore(errore, 'Errore durante la registrazione.') }
  }

  return { success: "Controlla la tua email per confermare l'iscrizione!" }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
