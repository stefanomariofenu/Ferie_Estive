import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { AuthClient } from '@supabase/auth-js'
import { PostgrestClient } from '@supabase/postgrest-js'

// Config a runtime (per deploy Azure/on-prem senza ricompilare): il file
// pubblico /config.js può impostare window.__FERIE_CONFIG__. Se assente o
// vuoto, si usano le variabili iniettate al build (es. Netlify).
//
// Due modalità:
//  - "hosted"    (SUPABASE_URL + SUPABASE_ANON_KEY): un progetto Supabase
//                 gestito (es. Netlify oggi).
//  - "self-host" (AUTH_URL + REST_URL + SUPABASE_ANON_KEY): i due servizi
//                 open-source di Supabase (GoTrue + PostgREST) eseguiti come
//                 container separati (es. Azure Container Apps), ciascuno
//                 col proprio indirizzo pubblico — senza un gateway/Kong
//                 davanti a unificarli in un solo URL.
type RuntimeConfig = {
  SUPABASE_URL?: string
  SUPABASE_ANON_KEY?: string
  AUTH_URL?: string
  REST_URL?: string
}
const runtime: RuntimeConfig =
  (typeof window !== 'undefined' &&
    (window as unknown as { __FERIE_CONFIG__?: RuntimeConfig })
      .__FERIE_CONFIG__) ||
  {}

const url = runtime.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const anonKey =
  runtime.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY
const authUrl = runtime.AUTH_URL
const restUrl = runtime.REST_URL

const selfHostMode = Boolean(authUrl && restUrl && anonKey)

/**
 * true se è configurata almeno una delle due modalità. Usato dall'app per
 * mostrare una schermata di setup invece di andare in crash (pagina bianca)
 * quando il deploy non è ancora configurato.
 */
export const isSupabaseConfigured = selfHostMode || Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // Niente throw: lo segnaliamo e l'app mostra <ConfigNotice />.
  console.error(
    'Configurazione Supabase mancante. Imposta SUPABASE_URL/SUPABASE_ANON_KEY ' +
      '(progetto gestito) oppure AUTH_URL/REST_URL/SUPABASE_ANON_KEY ' +
      '(self-host) in config.js e ricarica.'
  )
}

/** Sottoinsieme dell'API supabase-js usato dall'app (auth, from, rpc). */
type FerieSupabase = Pick<SupabaseClient, 'auth' | 'from' | 'rpc'>

function buildSelfHosted(): FerieSupabase {
  const key = anonKey || 'placeholder-anon-key'

  // Senza gateway/Kong, GoTrue è servito sulla radice del suo container
  // (endpoint /token, /signup, /logout, ...): niente prefisso /auth/v1.
  const auth = new AuthClient({
    url: authUrl || 'https://placeholder.invalid',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    storageKey: 'ferie-estive-auth',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  })

  // Come fa internamente supabase-js: ogni richiesta a PostgREST porta
  // l'Authorization della sessione corrente (se loggato) o della anon key
  // (se no) — è quello che permette alle policy RLS di riconoscere l'utente.
  const selfHostedFetch: typeof fetch = async (input, init) => {
    const { data } = await auth.getSession()
    const token = data.session?.access_token || key
    const headers = new Headers(init?.headers)
    headers.set('apikey', key)
    headers.set('Authorization', `Bearer ${token}`)
    return fetch(input, { ...init, headers })
  }

  // PostgREST è servito sulla radice del suo container (/users,
  // /calendar_entries, /rpc/is_email_allowed, ...): niente prefisso /rest/v1.
  const rest = new PostgrestClient(restUrl || 'https://placeholder.invalid', {
    headers: { apikey: key },
    fetch: selfHostedFetch,
  })

  return {
    auth: auth as unknown as SupabaseClient['auth'],
    from: rest.from.bind(rest) as SupabaseClient['from'],
    rpc: rest.rpc.bind(rest) as SupabaseClient['rpc'],
  }
}

export const supabase: FerieSupabase = selfHostMode
  ? buildSelfHosted()
  : createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key', {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
