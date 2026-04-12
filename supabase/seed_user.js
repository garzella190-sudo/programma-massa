const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zjjxwmjkmnxowuqauaja.supabase.co'
const supabaseKey = 'sb_publishable_qgi1_6aN3z2fDyS9ivkdEg_UcY8DEdc'
const supabase = createClient(supabaseUrl, supabaseKey)

async function signUp() {
  console.log('Tentativo di registrazione per garzella190@gmail.com...')
  const { data, error } = await supabase.auth.signUp({
    email: 'garzella190@gmail.com',
    password: 'Garzellone2026',
    options: {
      data: {
        full_name: 'Manuele Garzella'
      }
    }
  })

  if (error) {
    console.error('Errore:', error.message)
  } else {
    console.log('Successo! Utente creato:', data.user?.id)
    if (data.session === null) {
      console.log('Nota: È necessario confermare l\'email se l\'invio è abilitato.')
    }
  }
}

signUp()
