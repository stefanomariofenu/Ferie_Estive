import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Logo'

const ALLOWED_DOMAIN = '@kpmg.it'
const CODE_LEN = 6

type Step = 'form' | 'code'

export function LoginPage() {
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [secondoNome, setSecondoNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')
  const codeRef = useRef<HTMLInputElement>(null)

  const cleanEmail = email.trim().toLowerCase()

  async function sendCode(): Promise<boolean> {
    // Nome completo = nome + eventuale secondo nome (es. "Stefano Mario").
    const nomeCompleto = [nome.trim(), secondoNome.trim()].filter(Boolean).join(' ')
    // Metadati usati dal trigger DB al primo accesso per popolare public.users
    // (l'email aziendale, es. mrossi@kpmg.it, non basta a ricavare nome/cognome).
    const { error: sbError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
        data: { nome: nomeCompleto, cognome: cognome.trim() },
      },
    })
    if (sbError) {
      setError(sbError.message)
      return false
    }
    return true
  }

  async function handleRequest(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!cleanEmail.endsWith(ALLOWED_DOMAIN)) {
      setError(`Usa il tuo indirizzo aziendale ${ALLOWED_DOMAIN}.`)
      return
    }
    setBusy(true)
    const ok = await sendCode()
    setBusy(false)
    if (ok) {
      setStep('code')
      setTimeout(() => codeRef.current?.focus(), 50)
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault()
    setError('')
    const token = code.trim()
    if (token.length !== CODE_LEN) {
      setError(`Inserisci il codice a ${CODE_LEN} cifre.`)
      return
    }
    setBusy(true)
    const { error: sbError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token,
      type: 'email',
    })
    setBusy(false)
    if (sbError) {
      setError('Codice non valido o scaduto. Controlla e riprova.')
      setCode('')
      codeRef.current?.focus()
    }
    // In caso di successo AuthContext rileva la sessione e reindirizza.
  }

  async function handleResend() {
    setError('')
    setBusy(true)
    const ok = await sendCode()
    setBusy(false)
    if (ok) {
      setResent(true)
      setTimeout(() => setResent(false), 4000)
    }
  }

  return (
    <div className="flex min-h-screen flex-col summer-bg">
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size="lg" />
            <p className="mt-4 text-sm text-subtle">
              Pianifica le tue ferie estive. Accedi con l'email aziendale
              per iniziare.
            </p>
          </div>

          {step === 'code' ? (
            <form onSubmit={handleVerify} className="card animate-scale-in p-6">
              <div className="mb-1 text-center text-2xl" aria-hidden>
                ✉️
              </div>
              <h2 className="text-center text-base font-semibold text-ink">
                Inserisci il codice
              </h2>
              <p className="mx-auto mt-1 max-w-[18rem] text-center text-sm text-subtle">
                Ti abbiamo inviato un codice a {CODE_LEN} cifre a{' '}
                <span className="font-medium text-ink">{cleanEmail}</span>.
              </p>

              <input
                ref={codeRef}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={CODE_LEN}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                className="mt-4 w-full rounded-2xl border border-black/5 bg-muted px-4 py-3 text-center text-2xl font-semibold tracking-[0.5em] text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
              />

              {error && <p className="mt-2 text-sm text-bloccate-fg">{error}</p>}
              {resent && (
                <p className="mt-2 text-sm text-lavoro-fg">Nuovo codice inviato.</p>
              )}

              <button
                type="submit"
                disabled={busy || code.length !== CODE_LEN}
                className="btn-primary mt-4 w-full"
              >
                {busy ? 'Verifica…' : 'Accedi'}
              </button>

              <div className="mt-3 flex items-center justify-between text-xs text-subtle">
                <button
                  type="button"
                  onClick={() => {
                    setStep('form')
                    setCode('')
                    setError('')
                  }}
                  className="hover:text-ink"
                >
                  ← Cambia email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={busy}
                  className="hover:text-ink disabled:opacity-50"
                >
                  Invia di nuovo
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRequest} className="card p-6">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-medium text-ink">
                  Nome
                  <input
                    type="text"
                    autoComplete="given-name"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Stefano"
                    className="mt-1.5 w-full rounded-2xl border border-black/5 bg-muted px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Secondo nome{' '}
                  <span className="font-normal text-subtle">(opz.)</span>
                  <input
                    type="text"
                    autoComplete="additional-name"
                    value={secondoNome}
                    onChange={(e) => setSecondoNome(e.target.value)}
                    placeholder="Mario"
                    className="mt-1.5 w-full rounded-2xl border border-black/5 bg-muted px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
                  />
                </label>
              </div>

              <label className="mt-3 block text-sm font-medium text-ink">
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

              <label className="mt-3 block text-sm font-medium text-ink">
                Email aziendale
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mrossi@kpmg.it"
                  className="mt-1.5 w-full rounded-2xl border border-black/5 bg-muted px-4 py-2.5 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
                />
              </label>

              <p className="mt-2 text-xs text-subtle">
                Nome e cognome servono solo al primo accesso, per comparire
                correttamente nella lista del team.
              </p>

              {error && <p className="mt-2 text-sm text-bloccate-fg">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary mt-4 w-full"
              >
                {busy ? 'Invio in corso…' : 'Invia codice di accesso'}
              </button>

              <p className="mt-3 text-center text-xs text-subtle">
                Nessuna password: riceverai un codice a {CODE_LEN} cifre via email.
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}
