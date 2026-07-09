import { useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { KpmgMark } from '../components/Logo'

const ALLOWED_DOMAIN = '@kpmg.it'

// Account amministratori: entrano con password propria (ruolo admin
// assegnato automaticamente al login).
const ADMIN_EMAILS = ['sfenu@kpmg.it', 'pmelzi@kpmg.it']

// Accesso "senza password" per i collaboratori in lista: l'app usa una
// credenziale condivisa (invisibile all'utente). Chi è nel roster entra
// digitando solo la propria email. Nota pilota: chiunque conosca un'email
// in lista potrebbe entrare — accettabile per uno strumento interno.
const SHARED_ACCESS_KEY = 'FerieEstive-2026-PS&HC'

type Step = 'email' | 'password'

export function LoginPage() {
  const { refreshProfile } = useAuth()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pwdRef = useRef<HTMLInputElement>(null)

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

    // Accesso: prova a entrare; se l'account non esiste ancora, lo crea.
    let userId: string | undefined
    const signIn = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: SHARED_ACCESS_KEY,
    })
    if (signIn.error) {
      const signInMsg = signIn.error.message.toLowerCase()
      // Account in attesa di conferma (residuo di test precedenti): non
      // riprovare con signUp, darebbe "User already registered".
      if (signInMsg.includes('not confirmed') || signInMsg.includes('confirm')) {
        setBusy(false)
        setError(
          'Account in attesa di conferma. Scrivi a sfenu@kpmg.it o pmelzi@kpmg.it per lo sblocco.'
        )
        return
      }
      // Credenziali non valide = account non ancora esistente → crealo.
      const signUp = await supabase.auth.signUp({
        email: cleanEmail,
        password: SHARED_ACCESS_KEY,
      })
      if (signUp.error) {
        const signUpMsg = signUp.error.message.toLowerCase()
        setBusy(false)
        if (signUpMsg.includes('already registered')) {
          setError(
            'Account già presente ma non accessibile. Scrivi a sfenu@kpmg.it o pmelzi@kpmg.it per lo sblocco.'
          )
        } else {
          setError('Accesso non riuscito: ' + signUp.error.message)
        }
        return
      }
      userId = signUp.data.user?.id
    } else {
      userId = signIn.data.user?.id
    }

    // Popola nome/cognome dal roster (così "Ciao, {nome}" e niente onboarding).
    if (userId) {
      const { data: r } = await supabase
        .from('allowed_emails')
        .select('nome, cognome')
        .eq('email', cleanEmail)
        .maybeSingle()
      if (r && (r.nome || r.cognome)) {
        await supabase
          .from('users')
          .update({ nome: r.nome ?? '', cognome: r.cognome ?? '' })
          .eq('id', userId)
      }
      await refreshProfile()
    }
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
    // AuthContext rileva la sessione: se il profilo è incompleto parte
    // l'onboarding (nome/cognome), altrimenti si entra nel portale.
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
          {step === 'password' ? (
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
                onClick={() => {
                  setStep('email')
                  setPassword('')
                  setError('')
                }}
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
                Accedi
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
