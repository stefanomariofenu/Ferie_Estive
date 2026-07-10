// =====================================================================
//  Ferie Estive 2026 — configurazione a runtime
//  Lascia i valori VUOTI per usare le variabili impostate al build
//  (es. Netlify: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
//
//  Per un deploy su Azure / on-prem SENZA ricompilare, inserisci qui i
//  due valori Supabase (Supabase → Project Settings → API):
//    SUPABASE_URL       = "Project URL"      (es. https://xxxx.supabase.co)
//    SUPABASE_ANON_KEY  = "anon public key"  (chiave pubblica, non la service_role)
// =====================================================================
window.__FERIE_CONFIG__ = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
}
