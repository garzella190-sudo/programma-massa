const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zjjxwmjkmnxowuqauaja.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key (from ENV)
const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigration() {
  console.log('🚀 Avvio migrazione serie esercizi...')

  // 1. Prendi tutti gli esercizi ordinati per scheda e ordine
  const { data: esercizi, error } = await supabase
    .from('esercizi_scheda')
    .select('*')
    .order('scheda_id', { ascending: true })
    .order('ordine', { ascending: true })

  if (error) {
    console.error('❌ Errore fetch:', error.message)
    return
  }

  if (!esercizi || esercizi.length === 0) {
    console.log('✅ Nessun esercizio trovato.')
    return
  }

  console.log(`📦 Trovati ${esercizi.length} esercizi. Elaborazione...`)

  let updatedCount = 0
  const groups = {} // schedaId-nome -> counter

  for (const ex of esercizi) {
    const key = `${ex.scheda_id}-${ex.nome}`
    groups[key] = (groups[key] || 0) + 1
    
    const correctSerie = groups[key]
    
    if (ex.serie !== correctSerie) {
      const { error: updateErr } = await supabase
        .from('esercizi_scheda')
        .update({ serie: correctSerie })
        .eq('id', ex.id)
      
      if (updateErr) {
        console.error(`🔴 Errore aggiornamento ex ${ex.id}:`, updateErr.message)
      } else {
        updatedCount++
      }
    }
  }

  console.log(`✨ Migrazione completata!`)
  console.log(`✅ Record aggiornati: ${updatedCount}`)
}

runMigration()
