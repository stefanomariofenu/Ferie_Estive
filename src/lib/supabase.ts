import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * true solo se entrambe le variabili d'ambiente Supabase sono presenti.
 * Usato dall'app per mostrare una schermata di setup invece di andare in
 * crash (pagina bianca) quando il deploy non è ancora configurato.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Niente throw: lo segnaliamo e l'app mostra <ConfigNotice />.
  console.error(
    'Variabili Supabase mancanti (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). ' +
      'Configurale in Netlify (Site settings → Environment variables) e ri-deploya.'
  )
}

// Fallback a valori placeholder validi così createClient non lancia
// eccezioni: il client non verrà comunque usato finché non è configurato.
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)
