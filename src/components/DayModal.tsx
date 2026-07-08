import { useEffect, useState } from 'react'
import type { Tipo } from '../types'
import { TIPO_META, TIPO_ORDER, isSuggested, weekdayLabel } from '../lib/august'

interface DayModalProps {
  day: number
  currentTipo?: Tipo
  currentNote?: string | null
  saving: boolean
  onSave: (tipo: Tipo, note: string) => void
  onDelete: () => void
  onClose: () => void
}

export function DayModal({
  day,
  currentTipo,
  currentNote,
  saving,
  onSave,
  onDelete,
  onClose,
}: DayModalProps) {
  const [tipo, setTipo] = useState<Tipo | undefined>(currentTipo)
  const [note, setNote] = useState(currentNote ?? '')

  // Chiudi con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Modifica ${day} agosto`}
    >
      <div
        className="w-full max-w-md rounded-t-card bg-surface p-6 shadow-pop animate-scale-in sm:rounded-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink">
              {day} agosto
            </h2>
            <p className="text-sm text-subtle">
              {weekdayLabel(day)}
              {isSuggested(day) && (
                <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  consigliato KPMG
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2" aria-label="Chiudi">
            ✕
          </button>
        </div>

        <p className="mb-2 mt-4 text-sm font-medium text-ink">Come sarà la giornata?</p>
        <div className="grid gap-2">
          {TIPO_ORDER.map((t) => {
            const meta = TIPO_META[t]
            const selected = tipo === t
            return (
              <button
                key={t}
                onClick={() => setTipo(t)}
                style={
                  {
                    backgroundColor: meta.bg,
                    color: meta.fg,
                    '--tw-ring-color': meta.fg,
                  } as React.CSSProperties
                }
                className={[
                  'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold',
                  'transition duration-200 ease-smooth hover:brightness-95',
                  selected ? 'ring-2 ring-offset-2 ring-offset-surface' : 'opacity-90',
                ].join(' ')}
              >
                <span>{meta.label}</span>
                {selected && <span aria-hidden>✓</span>}
              </button>
            )
          })}
        </div>

        <label className="mt-4 block text-sm font-medium text-ink">
          Nota <span className="font-normal text-subtle">(opzionale)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={280}
            placeholder="Es. reperibile solo la mattina…"
            className="mt-1.5 w-full resize-none rounded-2xl border border-black/5 bg-muted px-3 py-2 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
          />
        </label>

        <div className="mt-5 flex items-center justify-between gap-2">
          {currentTipo ? (
            <button
              onClick={onDelete}
              disabled={saving}
              className="btn-ghost !text-bloccate-fg hover:!bg-bloccate-bg/60"
            >
              Cancella
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost">
              Annulla
            </button>
            <button
              onClick={() => tipo && onSave(tipo, note.trim())}
              disabled={!tipo || saving}
              className="btn-primary"
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
