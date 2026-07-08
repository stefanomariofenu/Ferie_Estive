/**
 * Mostrata quando le variabili d'ambiente Supabase non sono configurate.
 * Evita la pagina bianca e spiega esattamente cosa fare sul deploy.
 */
export function ConfigNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="card max-w-lg animate-scale-in p-8">
        <div className="mb-3 text-3xl" aria-hidden>
          ⚙️
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          Configurazione necessaria
        </h1>
        <p className="mt-2 text-sm text-subtle">
          L'app è online ma non è ancora collegata al database Supabase.
          Mancano le variabili d'ambiente. Per attivarla:
        </p>

        <ol className="mt-4 space-y-2 text-sm text-ink">
          <li className="flex gap-2">
            <span className="font-semibold text-accent">1.</span>
            <span>
              Crea un progetto su{' '}
              <span className="font-medium">supabase.com</span> ed esegui{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                supabase/schema.sql
              </code>{' '}
              nel SQL Editor.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-accent">2.</span>
            <span>
              In Netlify:{' '}
              <span className="font-medium">
                Site settings → Environment variables
              </span>
              , aggiungi{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                VITE_SUPABASE_URL
              </code>{' '}
              e{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                VITE_SUPABASE_ANON_KEY
              </code>{' '}
              (Supabase → Project Settings → API).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-accent">3.</span>
            <span>
              Rilancia il deploy:{' '}
              <span className="font-medium">
                Deploys → Trigger deploy → Clear cache and deploy site
              </span>
              . Le variabili{' '}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                VITE_*
              </code>{' '}
              vengono lette in fase di build, quindi un nuovo deploy è
              indispensabile.
            </span>
          </li>
        </ol>

        <p className="mt-5 rounded-2xl bg-accent/5 px-4 py-3 text-xs text-subtle">
          Le istruzioni complete (setup Supabase, ruolo admin, deploy) sono nel{' '}
          <span className="font-medium text-ink">README.md</span> del progetto.
        </p>
      </div>
    </div>
  )
}
