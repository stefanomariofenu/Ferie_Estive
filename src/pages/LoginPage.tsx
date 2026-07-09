import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const ALLOWED_DOMAIN = '@kpmg.it'
const CODE_LEN = 6

// Accessi "diretti" (con password, senza codice via email): utili come
// bootstrap finché non si definisce il metodo di accesso per tutti.
const DIRECT_LOGIN_EMAILS = ['sfenu@kpmg.it']

type Step = 'form' | 'code' | 'password'

export function LoginPage() {
  const { refreshProfile } = useAuth()
  const [step, setStep] = useState<Step>('form')
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')
  const codeRef = useRef<HTMLInputElement>(null)
  const pwdRef = useRef<HTMLInputElement>(null)

  const cleanEmail = email.trim().toLowerCase()

  async function sendCode(): Promise<boolean> {
    // Il campo Nome include eventuali secondi nomi (es. "Mario Enrico").
    const nomeCompleto = nome.trim().replace(/\s+/g, ' ')
    // Metadati usati dal trigger DB al primo accesso per popolare public.users
    // (l'email aziendale, es. mrossi@kpmg.it, non basta a ricavare nome/cognome).
    const { error: sbError } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: window.location.origin,
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
    // Accesso diretto con password (bootstrap): salta il codice via email.
    if (DIRECT_LOGIN_EMAILS.includes(cleanEmail)) {
      setStep('password')
      setTimeout(() => pwdRef.current?.focus(), 50)
      return
    }
    setBusy(true)
    // Allowlist: solo le email caricate dal team possono accedere.
    const { data: allowed, error: rpcError } = await supabase.rpc(
      'is_email_allowed',
      { p_email: cleanEmail }
    )
    if (rpcError) {
      setBusy(false)
      setError('Verifica accesso non riuscita. Riprova tra poco.')
      return
    }
    if (!allowed) {
      setBusy(false)
      setError(
        'Questo indirizzo non è tra quelli autorizzati. Scrivi a sfenu@kpmg.it per essere aggiunto.'
      )
      return
    }
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

  async function handlePassword(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!password) {
      setError('Inserisci la password.')
      return
    }
    setBusy(true)
    const { data, error: sbError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })
    if (sbError) {
      setBusy(false)
      setError('Email o password non corretti.')
      setPassword('')
      pwdRef.current?.focus()
      return
    }
    // Allinea il profilo al nome/cognome digitati nel form, così il saluto
    // mostra "Stefano Mario" e non la parte dell'email.
    const nomeCompleto = nome.trim().replace(/\s+/g, ' ')
    if (data.user && (nomeCompleto || cognome.trim())) {
      await supabase
        .from('users')
        .update({ nome: nomeCompleto, cognome: cognome.trim() })
        .eq('id', data.user.id)
      await refreshProfile()
    }
    setBusy(false)
    // AuthContext rileva la sessione e reindirizza.
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

  const inputCls =
    'w-full h-11 rounded-xl border border-black/10 bg-muted px-4 text-sm text-ink outline-none transition focus:border-cyan/60 focus:bg-surface'
  const labelCls =
    'block text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle mb-2'

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Blocco istituzionale */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#00204F] via-accent to-accent-soft p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="pointer-events-none absolute -right-36 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,163,224,.5),transparent_65%)]" />
        <div className="relative flex items-baseline gap-2.5">
          <span className="text-[20px] font-bold tracking-tight">KPMG</span>
          <span className="text-[13px] font-light uppercase tracking-wide opacity-75">
            PS &amp; HC
          </span>
        </div>
        <div className="relative">
          <div className="text-[13px] font-semibold uppercase tracking-[0.34em] text-cyan/90">
            Piano Ferie
          </div>
          <h1 className="font-display mt-3 text-[92px] italic leading-[0.85] text-white">
            Estivo
          </h1>
          <div className="font-display mt-2 text-[40px] leading-none tracking-tight text-white/55">
            2026
          </div>
        </div>
        <div className="relative text-[11px] uppercase tracking-[0.14em] text-white/50">
          Strumento interno · Uso riservato
        </div>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center bg-canvas px-6 py-14">
        <div className="w-full max-w-sm">
          {step === 'password' ? (
            <form onSubmit={handlePassword} className="animate-fade-in">
              <h2 className="font-display text-[32px] tracking-tight text-ink">
                Accesso diretto
              </h2>
              <p className="mt-2 text-sm text-subtle">
                Inserisci la password per{' '}
                <span className="font-medium text-ink">{cleanEmail}</span>.
              </p>
              <div className="mt-6">
                <label className={labelCls}>Password</label>
                <input
                  ref={pwdRef}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
              {error && <p className="mt-3 text-sm text-pink">{error}</p>}
              <button
                type="submit"
                disabled={busy || !password}
                className="btn-primary mt-6 w-full"
              >
                {busy ? 'Accesso…' : 'Accedi al portale'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('form')
                  setPassword('')
                  setError('')
                }}
                className="mt-4 text-xs text-subtle hover:text-ink"
              >
                ← Cambia email
              </button>
            </form>
          ) : step === 'code' ? (
            <form onSubmit={handleVerify} className="animate-fade-in">
              <h2 className="font-display text-[32px] tracking-tight text-ink">
                Inserisci il codice
              </h2>
              <p className="mt-2 text-sm text-subtle">
                Ti abbiamo inviato un codice a {CODE_LEN} cifre a{' '}
                <span className="font-medium text-ink">{cleanEmail}</span>. In
                alternativa, apri il link nell'email da questo dispositivo.
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
                className="mt-5 w-full rounded-xl border border-black/10 bg-muted px-4 py-3 text-center text-3xl font-semibold tracking-[0.5em] text-ink outline-none transition focus:border-cyan/60 focus:bg-surface"
              />
              {error && <p className="mt-2 text-sm text-pink">{error}</p>}
              {resent && (
                <p className="mt-2 text-sm text-cyan">Nuovo codice inviato.</p>
              )}
              <button
                type="submit"
                disabled={busy || code.length !== CODE_LEN}
                className="btn-primary mt-5 w-full"
              >
                {busy ? 'Verifica…' : 'Accedi al portale'}
              </button>
              <div className="mt-4 flex items-center justify-between text-xs text-subtle">
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
            <form onSubmit={handleRequest}>
              <h2 className="font-display text-[32px] tracking-tight text-ink">
                Accedi al portale
              </h2>
              <p className="mt-2 text-sm text-subtle">
                Inserisci l'email aziendale per entrare.
              </p>

              <div className="mt-6">
                <label className={labelCls}>
                  Nome{' '}
                  <span className="font-normal normal-case tracking-normal text-subtle">
                    (incluso il secondo nome)
                  </span>
                </label>
                <input
                  type="text"
                  autoComplete="given-name"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Mario Enrico"
                  className={inputCls}
                />
              </div>
              <div className="mt-4">
                <label className={labelCls}>Cognome</label>
                <input
                  type="text"
                  autoComplete="family-name"
                  required
                  value={cognome}
                  onChange={(e) => setCognome(e.target.value)}
                  placeholder="Rossi"
                  className={inputCls}
                />
              </div>
              <div className="mt-4">
                <label className={labelCls}>Email aziendale</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mrossi@kpmg.it"
                  className={inputCls}
                />
              </div>

              {error && <p className="mt-3 text-sm text-pink">{error}</p>}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary mt-6 w-full"
              >
                {busy ? 'Invio in corso…' : 'Invia codice di accesso'}
              </button>
              <p className="mt-3 text-center text-xs text-subtle">
                Nessuna password: riceverai un codice a {CODE_LEN} cifre via email.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
