import type { Tipo } from '../types'
import { TIPO_META, TIPO_ORDER, DAYS_IN_AUGUST } from '../lib/august'

/** Conteggio giorni per tipo, mostrato in alto nella vista employee. */
export function SummaryBar({ counts }: { counts: Record<Tipo, number> }) {
  const totMarked = TIPO_ORDER.reduce((s, t) => s + counts[t], 0)
  const remaining = DAYS_IN_AUGUST - totMarked

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {TIPO_ORDER.map((t) => {
        const meta = TIPO_META[t]
        return (
          <div key={t} className="card p-4">
            <div
              className="mb-2 inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold"
              style={{ backgroundColor: meta.bg, color: meta.fg }}
            >
              {meta.label}
            </div>
            <p className="text-2xl font-semibold text-ink">{counts[t]}</p>
            <p className="text-xs text-subtle">giorni</p>
          </div>
        )
      })}
      <div className="card col-span-2 flex flex-col justify-center p-4 sm:col-span-1">
        <p className="text-2xl font-semibold text-ink">{remaining}</p>
        <p className="text-xs text-subtle">
          {remaining === 1 ? 'giorno da compilare' : 'giorni da compilare'}
        </p>
      </div>
    </div>
  )
}
