import type { Tipo } from '../types'
import { TIPO_META, TIPO_ORDER, WORKING_DAYS } from '../lib/august'

/** Conteggi per tipo + completamento sui soli giorni lavorativi. */
export function SummaryBar({ counts }: { counts: Record<Tipo, number> }) {
  const total = WORKING_DAYS.length
  const marked = TIPO_ORDER.reduce((s, t) => s + counts[t], 0)
  const pct = total > 0 ? Math.round((marked / total) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TIPO_ORDER.map((t) => {
        const meta = TIPO_META[t]
        return (
          <div key={t} className="card overflow-hidden p-4">
            <div
              className="mb-2 inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold"
              style={{ backgroundColor: meta.bg, color: meta.fg }}
            >
              <span>{meta.emoji}</span>
              {meta.label}
            </div>
            <p className="text-3xl font-semibold tabular-nums text-ink">
              {counts[t]}
            </p>
            <p className="text-xs text-subtle">giorni</p>
          </div>
        )
      })}

      <div className="card col-span-2 flex items-center gap-4 p-4 lg:col-span-1">
        <ProgressRing pct={pct} />
        <div>
          <p className="text-sm font-semibold text-ink">
            {marked} / {total}
          </p>
          <p className="text-xs text-subtle">
            giorni lavorativi compilati
          </p>
        </div>
      </div>
    </div>
  )
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 22
  const c = 2 * Math.PI * r
  const off = c - (c * pct) / 100
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" stroke="#F0F0F2" strokeWidth="6" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="#00338D"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          className="transition-[stroke-dashoffset] duration-500 ease-smooth"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-ink">
        {pct}%
      </span>
    </div>
  )
}
