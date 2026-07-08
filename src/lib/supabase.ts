import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // Errore esplicito in fase di sviluppo: niente schermate bianche misteriose.
  throw new Error(
    'Variabili Supabase mancanti. Crea un file .env.local con ' +
      'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi .env.example).'
  )
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
