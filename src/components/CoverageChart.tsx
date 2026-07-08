import { useState } from 'react'
import type { DayCoverage } from '../lib/aggregate'
import { weekdayLabel } from '../lib/august'

interface CoverageChartProps {
  coverage: DayCoverage[]
  threshold: number
}

/**
 * Grafico "persone al lavoro, giorno per giorno". SVG puro, nessuna
 * dipendenza. Weekend mostrati come colonne chiuse; giorni sotto soglia
 * evidenziati. Hover per il dettaglio.
 */
export function CoverageChart({ coverage, threshold }: CoverageChartProps) {
  const [hover, setHover] = useState<number | null>(null)
  const working = coverage.filter((c) => !c.closed)
  const max = Math.max(1, ...working.map((c) => c.lavoro))

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink">
            Copertura giornaliera
          </h3>
          <p className="text-xs text-subtle">
            Persone al lavoro per ogni giorno. Sotto {threshold} = giorno scoperto.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-subtle">
          <Legend color="#34C759" label="coperto" />
          <Legend color="#FF9500" label="scoperto" />
          <Legend color="#E5E5EA" label="chiuso" />
        </div>
      </div>

      <div className="flex items-end gap-[3px] sm:gap-1.5">
        {coverage.map((c) => {
          if (c.closed) {
            return (
              <div key={c.day} className="flex min-w-[14px] flex-1 flex-col items-center gap-1.5">
                <div className="flex h-32 w-full items-end justify-center">
                  <div className="h-3 w-full rounded-sm bg-black/[0.05]" />
                </div>
                <span className="text-[9px] text-black/25 tabular-nums">{c.day}</span>
              </div>
            )
          }
          const h = Math.round((c.lavoro / max) * 100)
          const low = c.lavoro < threshold
          const active = hover === c.day
          return (
            <div
              key={c.day}
              className="group relative flex min-w-[14px] flex-1 flex-col items-center gap-1.5"
              onMouseEnter={() => setHover(c.day)}
              onMouseLeave={() => setHover(null)}
            >
              {active && (
                <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium text-white shadow-pop">
                  {c.day} ago · {weekdayLabel(c.day)}
                  <br />
                  <span className="text-white/80">
                    {c.lavoro} al lavoro · {c.ferie_bloccate + c.ferie_flessibili} in ferie
                  </span>
                </div>
              )}
              <div className="flex h-32 w-full items-end justify-center">
                <div
                  className="w-full rounded-t-md transition-all duration-500 ease-smooth"
                  style={{
                    height: `${Math.max(h, 4)}%`,
                    background: low
                      ? 'linear-gradient(180deg,#FF9F45,#FF9500)'
                      : 'linear-gradient(180deg,#5CD97A,#34C759)',
                    opacity: active ? 1 : 0.92,
                  }}
                />
              </div>
              <span
                className={`text-[9px] tabular-nums ${
                  low ? 'font-bold text-bloccate-fg' : 'text-subtle'
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </span>
  )
}
