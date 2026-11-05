import { createBrowserClient } from '@supabase/ssr'
import { ERRORE_CONFIG, leggiConfigSupabase } from './config'

export function createClient() {
  const { url, anonKey, configurato } = leggiConfigSupabase()

  if (!configurato || !url || !anonKey) {
    throw new Error(ERRORE_CONFIG)
  }

  return createBrowserClient(url, anonKey)
}
