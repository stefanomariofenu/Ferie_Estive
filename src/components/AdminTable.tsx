import { useMemo, useState } from 'react'
import type { Tipo } from '../types'
import type { AggregateResult } from '../lib/aggregate'
import { DAYS, TIPO_META, TIPO_ORDER } from '../lib/august'

type Filtro = 'tutti' | Tipo | 'mancanti'

interface AdminTableProps {
  agg: AggregateResult
}

export function AdminTable({ agg }: AdminTableProps) {
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('tutti')

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase()
    return agg.plans.filter((p) => {
      if (filtro === 'mancanti' && p.hasResponded) return false
      if (!q) return true
      const name = `${p.user.nome} ${p.user.cognome} ${p.user.email}`.toLowerCase()
      return name.includes(q)
    })
  }, [agg.plans, query, filtro])

  const missing = agg.plans.filter((p) => !p.hasResponded).length

  function ferieTot(byDay: Record<string, Tipo>) {
    return Object.values(byDay).filter((t) => t !== 'lavoro').length
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/5 p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, cognome o email…"
          className="min-w-[220px] flex-1 rounded-full border border-black/5 bg-muted px-4 py-2 text-sm text-ink outline-none transition focus:border-cyan/50 focus:bg-surface"
        />
        <div className="flex flex-wrap items-center gap-1">
          <FilterChip active={filtro === 'tutti'} onClick={() => setFiltro('tutti')}>
            Tutti
          </FilterChip>
          <FilterChip
            active={filtro === 'mancanti'}
            onClick={() => setFiltro('mancanti')}
            color="#C6007E"
          >
            Non ha inviato ({missing})
          </FilterChip>
          {TIPO_ORDER.map((t) => (
            <FilterChip
              key={t}
              active={filtro === t}
              onClick={() => setFiltro(t)}
              color={t === 'lavoro' ? '#12305C' : TIPO_META[t].solid}
            >
              {TIPO_META[t].label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-muted/60">
              <th className="sticky left-0 z-10 min-w-[190px] bg-muted/60 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Dipendente
              </th>
              {DAYS.map((g) => (
                <th
                  key={g.iso}
                  className={`px-0 pb-2 pt-1.5 text-center align-bottom font-medium ${
                    g.suggested ? 'text-cyan' : 'text-subtle'
                  } ${g.weekend ? 'opacity-45' : ''}`}
                >
                  <div className="text-[8px] uppercase tracking-wide opacity-70">
                    {g.wLabel}
                  </div>
                  <div className="text-[11px] tabular-nums">{g.dom}</div>
                  {(g.dom === 1 || g.iso === DAYS[0].iso) && (
                    <div className="text-[7px] font-semibold uppercase text-cyan">
                      {g.monthShort}
                    </div>
                  )}
                </th>
              ))}
              <th className="px-2 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-subtle">
                Ferie
              </th>
              <th className="min-w-[160px] px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-subtle">
                Note
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map((p) => (
              <tr key={p.user.email} className="border-t border-black/5">
                <td className="sticky left-0 z-10 bg-surface px-4 py-1.5">
                  <div className="font-medium text-ink">
                    {p.user.cognome} {p.user.nome}
                  </div>
                  {!p.hasResponded && (
                    <div className="text-[11px] font-semibold text-pink">
                      non ha inviato
                    </div>
                  )}
                </td>
                {DAYS.map((g) => {
                  if (g.weekend) {
                    return (
                      <td key={g.iso} className="p-[2px]">
                        <div className="mx-auto h-6 w-6 rounded-md border border-dashed border-black/10 bg-black/[0.015]" />
                      </td>
                    )
                  }
                  const tipo = p.byDay[g.iso]
                  const dim = filtro !== 'tutti' && filtro !== 'mancanti' && tipo !== filtro
                  const meta = tipo ? TIPO_META[tipo] : null
                  return (
                    <td key={g.iso} className="p-[2px]">
                      <div
                        className="mx-auto h-6 w-6 rounded-md"
                        title={tipo ? `${g.dom} ${g.monthShort} — ${meta!.label}` : undefined}
                        style={
                          meta
                            ? { backgroundColor: meta.bg, opacity: dim ? 0.15 : 1 }
                            : { backgroundColor: '#F5F5F7' }
                        }
                      />
                    </td>
                  )
                })}
                <td className="px-2 text-center text-sm font-semibold tabular-nums text-ink">
                  {p.hasResponded ? ferieTot(p.byDay) : '—'}
                </td>
                <td className="max-w-[220px] truncate px-3 text-xs text-subtle" title={p.nota ?? ''}>
                  {p.nota || ''}
                </td>
              </tr>
            ))}
            {filteredPlans.length === 0 && (
              <tr>
                <td
                  colSpan={DAYS.length + 3}
                  className="px-4 py-10 text-center text-sm text-subtle"
                >
                  Nessun dipendente corrisponde alla ricerca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={active && color ? { color } : undefined}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-muted text-ink' : 'text-subtle hover:bg-muted/60'
      }`}
    >
      {children}
    </button>
  )
}
