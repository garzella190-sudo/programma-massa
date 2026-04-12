const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zjjxwmjkmnxowuqauaja.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // SERVICE ROLE KEY (from ENV)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updateUser() {
  const email = 'garzella190@gmail.com'
  const newPassword = 'Garzellone2026'

  console.log(`Aggiornamento utente ${email}...`)

  // 1. Cercare l'utente
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  
  if (listError) {
    console.error('Errore durante la ricerca utenti:', listError.message)
    return
  }

  const user = users.find(u => u.email === email)

  if (!user) {
    console.log('Utente non trovato, creazione in corso...')
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: newPassword,
      email_confirm: true,
      user_metadata: { full_name: 'Manuele Garzella' }
    })
    if (error) console.error('Errore creazione:', error.message)
    else console.log('Utente creato e confermato!')
  } else {
    console.log('Utente trovato, aggiornamento password e conferma email...')
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
      email_confirm: true
    })
    if (error) console.error('Errore aggiornamento:', error.message)
    else console.log('Password aggiornata e email confermata!')
  }
}

updateUser()
