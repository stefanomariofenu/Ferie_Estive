import type { Tipo } from '../types'
import { TIPO_META, TIPO_ORDER } from '../lib/august'

interface SelectionBarProps {
  count: number
  saving: boolean
  onApply: (tipo: Tipo) => void
  onClearEntries: () => void
  onDeselect: () => void
}

/**
 * Barra fluttuante in basso: compare quando ci sono giorni selezionati e
 * permette di colorarli tutti insieme con una categoria.
 */
export function SelectionBar({
  count,
  saving,
  onApply,
  onClearEntries,
  onDeselect,
}: SelectionBarProps) {
  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-3 sm:p-5">
      <div className="pointer-events-auto w-full max-w-2xl animate-fade-in rounded-[22px] border border-black/5 bg-white/85 p-3 shadow-pop backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 pl-1.5 pr-1 text-sm font-semibold text-ink">
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs text-white tabular-nums">
              {count}
            </span>
            selezionati
          </span>

          <span className="mx-1 hidden h-6 w-px bg-black/10 sm:block" />

          <div className="flex flex-1 flex-wrap gap-2">
            {TIPO_ORDER.map((t) => {
              const meta = TIPO_META[t]
              return (
                <button
                  key={t}
                  onClick={() => onApply(t)}
                  disabled={saving}
                  style={{ backgroundColor: meta.bg, color: meta.fg }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition duration-200 hover:brightness-95 active:scale-[0.98] disabled:opacity-50 sm:flex-none"
                >
                  <span>{meta.emoji}</span>
                  {meta.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClearEntries}
              disabled={saving}
              className="btn-ghost !px-3 !text-bloccate-fg"
              title="Rimuovi la categoria dai giorni selezionati"
            >
              Svuota
            </button>
            <button onClick={onDeselect} className="btn-ghost !px-3" disabled={saving}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
