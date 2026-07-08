import type { AggregateResult } from '../lib/aggregate'
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
  const uncovered = agg.coverage.filter((c) => c.lavoro < threshold).length

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-subtle">Hanno compilato</p>
          <p className="mt-1 text-3xl font-semibold text-ink">
            {agg.respondedCount}{' '}
            <span className="text-lg font-normal text-subtle">/ {expected}</span>
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-subtle">{pct}% completato</p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-subtle">Giorni scoperti</p>
          <p className="mt-1 text-3xl font-semibold text-ink">
            {uncovered}
            <span className="ml-1 text-lg font-normal text-subtle">/ 31</span>
          </p>
          <p className="mt-3 text-xs text-subtle">
            Giorni con meno di {threshold} persone al lavoro.
          </p>
        </div>

        <div className="card flex flex-col justify-center p-5">
          <label className="text-sm font-medium text-ink">
            Soglia minima di copertura
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={Math.max(10, expected)}
              value={threshold}
              onChange={(e) => onThresholdChange(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <span className="w-8 text-right text-lg font-semibold tabular-nums text-ink">
              {threshold}
            </span>
          </div>
          <p className="mt-1.5 text-xs text-subtle">
            Persone al lavoro sotto cui un giorno è "scoperto".
          </p>
        </div>
      </div>

      <CoverageChart coverage={agg.coverage} threshold={threshold} />
    </div>
  )
}
