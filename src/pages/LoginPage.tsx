import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { ThemeToggle } from '../components/ThemeToggle'

const ALLOWED_DOMAIN = '@kpmg.it'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const clean = email.trim().toLowerCase()

    if (!clean.endsWith(ALLOWED_DOMAIN)) {
      setError(`Usa il tuo indirizzo aziendale ${ALLOWED_DOMAIN}.`)
      setStatus('error')
      return
    }

    setStatus('sending')
    setError('')
    // Nome e cognome vengono passati come metadati: al primo accesso il
    // trigger DB li usa per popolare public.users (l'email aziendale, es.
    // mrossi@kpmg.it, non è sufficiente a ricavarli). Agli accessi
    // successivi il profilo esiste già e questi valori vengono ignorati.
    const { error: sbError } = await supabase.auth.signInWithOtp({
      email: clean,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          nome: nome.trim(),
          cognome: cognome.trim(),
        },
      },
    })

    if (sbError) {
      setError(sbError.message)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <main className="flex flex-1 items-center justify-center px-4 pb-24">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <div className="mb-4 text-4xl" aria-hidden>☀️</div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Ferie Agosto
            </h1>
            <p className="mt-1 text-sm text-subtle">
              Pianifica il tuo mese di agosto. Accedi con l'email aziendale.
            </p>
          </div>

          {status === 'sent' ? (
            <div className="card animate-scale-in p-6 text-center">
              <div className="mb-2 text-2xl" aria-hidden>📬</div>
              <h2 className="text-base font-semibold text-ink">Controlla la posta</h2>
              <p className="mt-1 text-sm text-subtle">
                Ti abbiamo inviato un link di accesso a{' '}
                <span className="font-medium text-ink">{email.trim().toLowerCase()}</span>.
                Aprilo da questo dispositivo per entrare.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="btn-ghost mx-auto mt-4"
              >
                Usa un'altra email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-ink">
                  Nome
                  <input
                    type="text"
                    autoComplete="given-name"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Marco"
                    className="mt-1.5 w-full rounded-2xl border border-black/5 bg-muted px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Cognome
                  <input
                    type="text"
                    autoComplete="family-name"
                    required
                    value={cognome}
                    onChange={(e) => setCognome(e.target.value)}
                    placeholder="Rossi"
                    className="mt-1.5 w-full rounded-2xl border border-black/5 bg-muted px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
                  />
                </label>
              </div>

              <label className="mt-3 block text-sm font-medium text-ink">
                Email aziendale
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`nome.cognome${ALLOWED_DOMAIN}`}
                  className="mt-1.5 w-full rounded-2xl border border-black/5 bg-muted px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
                />
              </label>

              <p className="mt-2 text-xs text-subtle">
                Nome e cognome servono solo al primo accesso, per comparire
                correttamente nella lista del team.
              </p>

              {status === 'error' && (
                <p className="mt-2 text-sm text-bloccate-fg">{error}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="btn-primary mt-4 w-full"
              >
                {status === 'sending' ? 'Invio in corso…' : 'Invia link di accesso'}
              </button>

              <p className="mt-3 text-center text-xs text-subtle">
                Nessuna password: riceverai un magic link via email.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
