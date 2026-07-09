import { useEffect, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/** Modifica dei propri dati (nome e cognome). */
export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { session, profile, refreshProfile } = useAuth()
  const [nome, setNome] = useState(profile?.nome ?? '')
  const [cognome, setCognome] = useState(profile?.cognome ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
    onClose()
  }

  const inputCls =
    'w-full h-11 rounded-xl border border-black/10 bg-muted px-4 text-sm text-ink outline-none transition focus:border-cyan/60 focus:bg-surface'
  const labelCls =
    'block text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle mb-2'

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Il mio profilo"
    >
      <form
        onSubmit={handleSave}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-pop animate-scale-in sm:rounded-2xl"
      >
        <div className="mb-1 flex items-start justify-between">
          <h2 className="font-display text-[24px] tracking-tight text-ink">
            Il mio profilo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost !px-2"
            aria-label="Chiudi"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-subtle">
          Come compari nella lista del team.
        </p>

        <div className="mt-5">
          <label className={labelCls}>
            Nome{' '}
            <span className="font-normal normal-case tracking-normal text-subtle">
              (incluso il secondo nome)
            </span>
          </label>
          <input
            autoFocus
            type="text"
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
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
            placeholder="Rossi"
            className={inputCls}
          />
        </div>

        {error && <p className="mt-3 text-sm text-pink">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Annulla
          </button>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </form>
    </div>
  )
}
