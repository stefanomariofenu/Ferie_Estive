import type { AggregateResult } from '../lib/aggregate'
import { WORKING_DAYS } from '../lib/august'
import { CoverageChart } from './CoverageChart'

interface AdminDashboardProps {
  agg: AggregateResult
  expected: number
  threshold: number
  onThresholdChange: (n: number) => void
}

export function AdminDashboard({
  agg,
  expected,
  threshold,
  onThresholdChange,
}: AdminDashboardProps) {
  const pct = expected > 0 ? Math.round((agg.respondedCount / expected) * 100) : 0
  const working = agg.coverage.filter((c) => !c.weekend)
  const uncovered = working.filter((c) => c.lavoro < threshold)
  const avgAtWork =
    working.length > 0
      ? Math.round(working.reduce((s, c) => s + c.lavoro, 0) / working.length)
      : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Hanno compilato"
          value={`${agg.respondedCount}`}
          sub={`su ${expected} attesi`}
          accent="#00338D"
          progress={pct}
        />
        <StatTile
          label="Giorni scoperti"
          value={`${uncovered.length}`}
          sub={`su ${WORKING_DAYS.length} lavorativi`}
          accent={uncovered.length > 0 ? '#C6007E' : '#00A651'}
        />
        <StatTile
          label="Media al lavoro"
          value={`${avgAtWork}`}
          sub="persone / giorno"
          accent="#00A3E0"
        />
        <div className="card flex flex-col justify-center p-5">
          <label className="text-xs font-medium text-subtle">
            Soglia minima copertura
          </label>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-semibold tabular-nums text-ink">
              {threshold}
            </span>
            <span className="text-xs text-subtle">persone</span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(10, expected)}
            value={threshold}
            onChange={(e) => onThresholdChange(Number(e.target.value))}
            className="mt-2 w-full accent-accent"
          />
        </div>
      </div>

      <CoverageChart coverage={agg.coverage} threshold={threshold} />

      {uncovered.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-ink">
            ⚠️ Giorni sotto soglia ({uncovered.length})
          </h3>
          <p className="mb-3 text-xs text-subtle">
            Meno di {threshold} persone al lavoro: possibili giorni critici.
          </p>
          <div className="flex flex-wrap gap-2">
            {uncovered.map((c) => (
              <span
                key={c.iso}
                className="inline-flex items-center gap-1.5 rounded-full bg-pink/10 px-3 py-1 text-xs font-semibold text-pink"
              >
                {c.dom} {c.monthShort.toLowerCase()}
                <span className="rounded-full bg-white/60 px-1.5 tabular-nums">
                  {c.lavoro}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({
  label,
  value,
  sub,
  accent,
  progress,
}: {
  label: string
  value: string
  sub: string
  accent: string
  progress?: number
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: accent }}
      />
      <p className="text-xs font-medium text-subtle">{label}</p>
      <p className="mt-1 text-3xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="text-xs text-subtle">{sub}</p>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%`, background: accent }}
          />
        </div>
      )}
    </div>
  )
}
