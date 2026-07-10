import { createClient } from '@supabase/supabase-js'

// Config a runtime (per deploy Azure/on-prem senza ricompilare): il file
// pubblico /config.js può impostare window.__FERIE_CONFIG__. Se assente o
// vuoto, si usano le variabili iniettate al build (es. Netlify).
type RuntimeConfig = { SUPABASE_URL?: string; SUPABASE_ANON_KEY?: string }
const runtime: RuntimeConfig =
  (typeof window !== 'undefined' &&
    (window as unknown as { __FERIE_CONFIG__?: RuntimeConfig })
      .__FERIE_CONFIG__) ||
  {}

const url = runtime.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const anonKey =
  runtime.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

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
