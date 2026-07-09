import { useState } from 'react'
import type { DayCoverage } from '../lib/aggregate'

interface CoverageChartProps {
  coverage: DayCoverage[]
  threshold: number
}

/**
 * Grafico "persone al lavoro, giorno per giorno". SVG puro. Weekend come
 * colonne chiuse; giorni sotto soglia evidenziati. Hover per il dettaglio.
 */
export function CoverageChart({ coverage, threshold }: CoverageChartProps) {
  const [hover, setHover] = useState<string | null>(null)
  const working = coverage.filter((c) => !c.weekend)
  const max = Math.max(1, ...working.map((c) => c.lavoro))

  return (
    <div className="card p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-[21px]">
            <em>Copertura</em> giornaliera
          </h3>
          <p className="text-xs text-subtle">
            Persone al lavoro per giorno · in rosa i giorni sotto soglia.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-subtle">
          <Legend color="#005EB8" label="coperto" />
          <Legend color="#C6007E" label="scoperto" />
          <Legend color="#E5E5EA" label="chiuso" />
        </div>
      </div>

      <div className="flex items-end gap-[3px] overflow-x-auto sm:gap-1.5">
        {coverage.map((c) => {
          if (c.weekend) {
            return (
              <div
                key={c.iso}
                className="flex min-w-[13px] flex-1 flex-col items-center gap-1.5"
              >
                <div className="flex h-32 w-full items-end justify-center">
                  <div className="h-3 w-full rounded-sm bg-black/[0.05]" />
                </div>
                <span className="text-[9px] text-black/25 tabular-nums">{c.dom}</span>
              </div>
            )
          }
          const h = Math.round((c.lavoro / max) * 100)
          const low = c.lavoro < threshold
          const active = hover === c.iso
          return (
            <div
              key={c.iso}
              className="group relative flex min-w-[13px] flex-1 flex-col items-center gap-1.5"
              onMouseEnter={() => setHover(c.iso)}
              onMouseLeave={() => setHover(null)}
            >
              {active && (
                <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-medium text-white shadow-pop">
                  {c.dom} {c.monthShort.toLowerCase()} · {c.wLabel}
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
                      ? 'linear-gradient(180deg,#E5379A,#C6007E)'
                      : 'linear-gradient(180deg,#00A3E0,#005EB8)',
                    opacity: active ? 1 : 0.92,
                  }}
                />
              </div>
              <span
                className={`text-[9px] tabular-nums ${
                  low ? 'font-bold text-pink' : 'text-subtle'
                }`}
              >
                {c.dom}
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
