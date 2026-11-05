import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ERRORE_CONFIG, leggiConfigSupabase } from './config'

export async function createClient() {
  const { url, anonKey, configurato } = leggiConfigSupabase()

  if (!configurato || !url || !anonKey) {
    throw new Error(ERRORE_CONFIG)
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // `setAll` chiamato da un Server Component: ignorabile se il middleware
          // aggiorna già la sessione.
        }
      },
    },
  })
}
