import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { KpmgMark } from '../components/Logo'

/**
 * Primo accesso: l'utente completa nome e cognome, poi salva.
 * Mostrata dall'App finché il profilo non ha un cognome.
 */
export function OnboardingPage() {
  const { session, profile, refreshProfile, signOut } = useAuth()
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [cognome, setCognome] = useState(profile?.cognome ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    setError('')
    const nomeCompleto = nome.trim().replace(/\s+/g, ' ')
    if (!nomeCompleto || !cognome.trim()) {
      setError('Inserisci nome e cognome.')
      return
    }
    setBusy(true)
    const { error: sbError } = await supabase
      .from('users')
      .update({ nome: nomeCompleto, cognome: cognome.trim() })
      .eq('id', session!.user.id)
    setBusy(false)
    if (sbError) {
      setError('Salvataggio non riuscito. ' + sbError.message)
      return
    }
    await refreshProfile()
  }

  const inputCls =
    'w-full h-11 rounded-xl border border-black/10 bg-muted px-4 text-sm text-ink outline-none transition focus:border-cyan/60 focus:bg-surface'
  const labelCls =
    'block text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle mb-2'

  return (
    <div className="flex min-h-screen items-center justify-center summer-bg px-6 py-14">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <KpmgMark className="h-[22px] w-auto" />
          <span className="text-[13px] font-medium text-subtle">
            Ferie Estive 2026
          </span>
        </div>
        <form onSubmit={handleSave} className="card p-6 animate-scale-in">
          <h2 className="font-display text-[30px] leading-tight tracking-tight text-ink">
            Come ti chiami?
          </h2>
          <p className="mt-2 text-sm text-subtle">
            Servono solo per comparire correttamente nella lista del team.
            Potrai modificarli quando vuoi.
          </p>

          <div className="mt-6">
            <label className={labelCls}>
              Nome{' '}
              <span className="font-normal normal-case tracking-normal text-subtle">
                (incluso il secondo nome)
              </span>
            </label>
            <input
              autoFocus
              type="text"
              autoComplete="given-name"
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
              value={cognome}
              onChange={(e) => setCognome(e.target.value)}
              placeholder="Rossi"
              className={inputCls}
            />
          </div>

          {error && <p className="mt-3 text-sm text-pink">{error}</p>}

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? 'Salvataggio…' : 'Salva e continua'}
          </button>
          <button
            type="button"
            onClick={signOut}
            className="mt-3 w-full text-center text-xs text-subtle hover:text-ink"
          >
            Esci
          </button>
        </form>
      </div>
    </div>
  )
}
