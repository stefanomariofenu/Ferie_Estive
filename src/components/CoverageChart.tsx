import type { DayCoverage } from '../lib/aggregate'
import { isWeekend } from '../lib/august'

interface CoverageChartProps {
  coverage: DayCoverage[]
  threshold: number
}

/**
 * Grafico a barre "persone al lavoro giorno per giorno". SVG puro,
 * nessuna dipendenza. Le barre sotto soglia sono evidenziate in arancione.
 */
export function CoverageChart({ coverage, threshold }: CoverageChartProps) {
  const max = Math.max(1, ...coverage.map((c) => c.lavoro))

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink">
            Persone al lavoro, giorno per giorno
          </h3>
          <p className="text-xs text-subtle">
            Le barre arancioni sono i giorni sotto la soglia di {threshold}.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-lavoro-fg" /> ok
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-bloccate-fg" /> scoperto
          </span>
        </div>
      </div>

      <div className="flex items-end gap-[3px] overflow-x-auto pb-1 sm:gap-1">
        {coverage.map((c) => {
          const h = Math.round((c.lavoro / max) * 100)
          const low = c.lavoro < threshold
          const weekend = isWeekend(c.day)
          return (
            <div
              key={c.day}
              className="flex min-w-[16px] flex-1 flex-col items-center gap-1"
              title={`${c.day} agosto — ${c.lavoro} al lavoro`}
            >
              <div className="flex h-28 w-full items-end justify-center">
                <div
                  className={`w-full rounded-t-md transition-all duration-300 ${
                    low ? 'bg-bloccate-fg' : 'bg-lavoro-fg'
                  } ${weekend ? 'opacity-40' : ''}`}
                  style={{ height: `${Math.max(h, 3)}%` }}
                />
              </div>
              <span
                className={`text-[9px] tabular-nums ${
                  low ? 'font-semibold text-bloccate-fg' : 'text-subtle'
                }`}
              >
                {c.day}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
