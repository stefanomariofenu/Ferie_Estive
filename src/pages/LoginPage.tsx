import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { KpmgMark } from '../components/Logo'

const ALLOWED_DOMAIN = '@kpmg.it'

// Account amministratori: entrano con password propria (ruolo admin
// assegnato automaticamente al login).
const ADMIN_EMAILS = ['sfenu@kpmg.it', 'pmelzi@kpmg.it']

// Credenziale condivisa usata SOLO per migrare gli account creati nella
// fase pilota (senza codice personale) verso il nuovo codice scelto
// dall'utente. Non viene mai mostrata né richiesta.
const LEGACY_SHARED_KEY = 'FerieEstive-2026-PS&HC'

const MIN_PIN = 6

type Step = 'email' | 'password' | 'pin'
type PinMode = 'create' | 'enter'

export function LoginPage() {
  const { refreshProfile } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [pinMode, setPinMode] = useState<PinMode>('create')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pwdRef = useRef<HTMLInputElement>(null)
  const pinRef = useRef<HTMLInputElement>(null)

  const cleanEmail = email.trim().toLowerCase()

  async function handleEmail(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!cleanEmail.endsWith(ALLOWED_DOMAIN)) {
      setError(`Usa il tuo indirizzo aziendale ${ALLOWED_DOMAIN}.`)
      return
    }
    // Admin: password propria.
    if (ADMIN_EMAILS.includes(cleanEmail)) {
      setStep('password')
      setTimeout(() => pwdRef.current?.focus(), 50)
      return
    }

    setBusy(true)
    // Solo le email in lista (roster) possono entrare.
    const { data: allowed, error: rpcErr } = await supabase.rpc(
      'is_email_allowed',
      { p_email: cleanEmail }
    )
    if (rpcErr) {
      setBusy(false)
      setError('Verifica accesso non riuscita. Riprova tra poco.')
      return
    }
    if (!allowed) {
      setBusy(false)
      setError(
        'Questa email non è abilitata. Scrivi a sfenu@kpmg.it o pmelzi@kpmg.it.'
      )
      return
    }

    // Primo accesso (crea codice) o accesso successivo (inserisci codice)?
    const { data: activated, error: actErr } = await supabase.rpc(
      'is_activated',
      { p_email: cleanEmail }
    )
    setBusy(false)
    if (actErr) {
      setError('Verifica accesso non riuscita. Riprova tra poco.')
      return
    }
    setPin('')
    setPin2('')
    setPinMode(activated ? 'enter' : 'create')
    setStep('pin')
    setTimeout(() => pinRef.current?.focus(), 50)
  }

  async function handlePin(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (pin.length < MIN_PIN) {
      setError(`Il codice personale deve avere almeno ${MIN_PIN} caratteri.`)
      return
    }
    if (pinMode === 'create' && pin !== pin2) {
      setError('I due codici non coincidono.')
      return
    }
    setBusy(true)

    // Accesso successivo: verifica il codice.
    if (pinMode === 'enter') {
      const signIn = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: pin,
      })
      setBusy(false)
      if (signIn.error) {
        setError(
          'Codice non corretto. Se non lo ricordi, scrivi a sfenu@kpmg.it o pmelzi@kpmg.it.'
        )
        setPin('')
        pinRef.current?.focus()
        return
      }
      await refreshProfile()
      return
    }

    // Primo accesso: crea l'account con il codice scelto.
    const signUp = await supabase.auth.signUp({
      email: cleanEmail,
      password: pin,
    })
    if (signUp.error) {
      const m = signUp.error.message.toLowerCase()
      if (m.includes('already registered')) {
        // Account creato in fase pilota (chiave condivisa): migralo al
        // codice appena scelto, così l'utente lo userà d'ora in poi.
        const legacy = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: LEGACY_SHARED_KEY,
        })
        if (!legacy.error) {
          await supabase.auth.updateUser({ password: pin })
          await supabase.rpc('mark_activated')
          await refreshProfile()
          setBusy(false)
          return
        }
        // Non migrabile: qualcuno l'ha già attivato con un altro codice.
        setBusy(false)
        setError(
          'Questo account risulta già attivato. Inserisci il tuo codice; se non lo ricordi scrivi a sfenu@kpmg.it o pmelzi@kpmg.it.'
        )
        setPinMode('enter')
        setPin('')
        setPin2('')
        pinRef.current?.focus()
        return
      }
      setBusy(false)
      setError('Attivazione non riuscita: ' + signUp.error.message)
      return
    }
    // Account creato: marca l'email come attivata e entra.
    await supabase.rpc('mark_activated')
    await refreshProfile()
    setBusy(false)
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
      const m = sbError.message.toLowerCase()
      if (m.includes('not confirmed') || m.includes('confirm')) {
        setError(
          'Account non confermato. Su Supabase attiva "Confirm" per questo utente (o ricrealo con Auto Confirm).'
        )
      } else if (m.includes('invalid')) {
        setError('Email o password non corretti.')
      } else {
        setError('Accesso non riuscito: ' + sbError.message)
      }
      setPassword('')
      pwdRef.current?.focus()
      return
    }
    // Ruolo admin automatico per gli account amministratori.
    if (data.user && ADMIN_EMAILS.includes(cleanEmail)) {
      await supabase.from('users').update({ ruolo: 'admin' }).eq('id', data.user.id)
      await refreshProfile()
    }
    setBusy(false)
  }

  const inputCls =
    'w-full h-11 rounded-xl border border-black/10 bg-muted px-4 text-sm text-ink outline-none transition focus:border-cyan/60 focus:bg-surface'
  const labelCls =
    'block text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle mb-2'

  function backToEmail() {
    setStep('email')
    setPassword('')
    setPin('')
    setPin2('')
    setError('')
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Blocco istituzionale */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#00204F] via-accent to-accent-soft p-14 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="pointer-events-none absolute -right-36 -top-32 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(0,163,224,.5),transparent_65%)]" />
        <div className="relative flex items-center gap-3">
          <KpmgMark variant="white" className="h-6 w-auto" />
          <span className="text-[13px] font-light uppercase tracking-wide opacity-75">
            PS &amp; HC
          </span>
        </div>
        <div className="relative">
          <div className="text-[13px] font-semibold uppercase tracking-[0.34em] text-cyan/90">
            Piano Ferie
          </div>
          <h1 className="font-display mt-3 text-[92px] italic leading-[0.85] text-white">
            Estate
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
          {step === 'pin' ? (
            <form onSubmit={handlePin} className="animate-fade-in">
              <h2 className="font-display text-[32px] tracking-tight text-ink">
                {pinMode === 'create'
                  ? 'Crea il tuo codice'
                  : 'Inserisci il tuo codice'}
              </h2>
              <p className="mt-2 text-sm text-subtle">
                {pinMode === 'create' ? (
                  <>
                    Primo accesso per{' '}
                    <span className="font-medium text-ink">{cleanEmail}</span>.
                    Scegli un codice personale (min {MIN_PIN} caratteri): ti
                    servirà per rientrare e protegge il tuo piano.
                  </>
                ) : (
                  <>
                    Bentornato. Inserisci il codice personale scelto al primo
                    accesso per{' '}
                    <span className="font-medium text-ink">{cleanEmail}</span>.
                  </>
                )}
              </p>
              <div className="mt-6">
                <label className={labelCls}>Codice personale</label>
                <input
                  ref={pinRef}
                  type="password"
                  autoComplete={
                    pinMode === 'create' ? 'new-password' : 'current-password'
                  }
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </div>
              {pinMode === 'create' && (
                <div className="mt-4">
                  <label className={labelCls}>Ripeti il codice</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pin2}
                    onChange={(e) => setPin2(e.target.value)}
                    placeholder="••••••••"
                    className={inputCls}
                  />
                </div>
              )}
              {error && <p className="mt-3 text-sm text-pink">{error}</p>}
              <button
                type="submit"
                disabled={busy || !pin}
                className="btn-primary mt-6 w-full"
              >
                {busy
                  ? 'Attendi…'
                  : pinMode === 'create'
                    ? 'Crea e accedi'
                    : 'Accedi'}
              </button>
              <button
                type="button"
                onClick={backToEmail}
                className="mt-4 text-xs text-subtle hover:text-ink"
              >
                ← Cambia email
              </button>
            </form>
          ) : step === 'password' ? (
            <form onSubmit={handlePassword} className="animate-fade-in">
              <h2 className="font-display text-[32px] tracking-tight text-ink">
                Inserisci la password
              </h2>
              <p className="mt-2 text-sm text-subtle">
                Accesso per{' '}
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
                {busy ? 'Accesso…' : 'Accedi'}
              </button>
              <button
                type="button"
                onClick={backToEmail}
                className="mt-4 text-xs text-subtle hover:text-ink"
              >
                ← Cambia email
              </button>
            </form>
          ) : (
            <form onSubmit={handleEmail}>
              <h2 className="font-display text-[32px] tracking-tight text-ink">
                Entra con la tua email
              </h2>
              <p className="mt-2 text-sm text-subtle">
                Inserisci l'email aziendale KPMG per accedere al portale.
              </p>
              <div className="mt-6">
                <label className={labelCls}>Email aziendale</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="arossi@kpmg.it"
                  className={inputCls}
                />
              </div>
              {error && <p className="mt-3 text-sm text-pink">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
                {busy ? 'Attendi…' : 'Continua'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
