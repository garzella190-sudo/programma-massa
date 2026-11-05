import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { leggiConfigSupabase } from './config'

export async function updateSession(request: NextRequest) {
  const { url, anonKey, configurato } = leggiConfigSupabase()

  // Senza configurazione non possiamo validare la sessione: lasciamo passare la
  // richiesta (le pagine mostreranno l'errore esplicito) invece di crashare qui.
  if (!configurato || !url || !anonKey) {
    console.error('[middleware] Supabase non configurato: mancano le variabili NEXT_PUBLIC_SUPABASE_*')
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // IMPORTANTE: nessuna logica tra createServerClient e getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/auth')) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Il response va restituito così com'è: contiene i cookie di sessione aggiornati.
  return supabaseResponse
}
