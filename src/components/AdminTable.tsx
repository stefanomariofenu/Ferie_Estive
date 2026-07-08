import { useMemo, useState } from 'react'
import type { Tipo } from '../types'
import type { AggregateResult } from '../lib/aggregate'
import {
  AUGUST_DAYS,
  TIPO_META,
  TIPO_ORDER,
  isSuggested,
  isWeekend,
} from '../lib/august'

type Filtro = 'tutti' | Tipo

interface AdminTableProps {
  agg: AggregateResult
}

export function AdminTable({ agg }: AdminTableProps) {
  const [query, setQuery] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('tutti')

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase()
    return agg.plans.filter((p) => {
      if (!q) return true
      const name = `${p.user.nome} ${p.user.cognome} ${p.user.email}`.toLowerCase()
      return name.includes(q)
    })
  }, [agg.plans, query])

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-black/5 p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per nome, cognome o email…"
          className="min-w-[220px] flex-1 rounded-full border border-black/5 bg-muted px-4 py-2 text-sm text-ink outline-none transition focus:border-accent/40 focus:bg-surface"
        />
        <div className="flex items-center gap-1">
          <FilterChip active={filtro === 'tutti'} onClick={() => setFiltro('tutti')}>
            Tutti
          </FilterChip>
          {TIPO_ORDER.map((t) => (
            <FilterChip
              key={t}
              active={filtro === t}
              onClick={() => setFiltro(t)}
              color={TIPO_META[t].fg}
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
              <th className="sticky left-0 z-10 min-w-[180px] bg-muted/60 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-subtle">
                Dipendente
              </th>
              {AUGUST_DAYS.map((day) => (
                <th
                  key={day}
                  className={`px-0 py-2 text-center text-[11px] font-medium ${
                    isSuggested(day) ? 'text-accent' : 'text-subtle'
                  } ${isWeekend(day) ? 'opacity-50' : ''}`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPlans.map((p) => (
              <tr key={p.user.id} className="border-t border-black/5">
                <td className="sticky left-0 z-10 bg-surface px-4 py-1.5">
                  <div className="font-medium text-ink">
                    {p.user.cognome} {p.user.nome}
                  </div>
                  {!p.hasResponded && (
                    <div className="text-[11px] text-bloccate-fg">
                      non ha compilato
                    </div>
                  )}
                </td>
                {AUGUST_DAYS.map((day) => {
                  if (isWeekend(day)) {
                    return (
                      <td key={day} className="p-[2px]">
                        <div className="mx-auto h-6 w-6 rounded-md border border-dashed border-black/10 bg-black/[0.015]" />
                      </td>
                    )
                  }
                  const tipo = p.byDay[day]
                  const dim = filtro !== 'tutti' && tipo !== filtro
                  const meta = tipo ? TIPO_META[tipo] : null
                  return (
                    <td key={day} className="p-[2px]">
                      <div
                        className="mx-auto h-6 w-6 rounded-md"
                        title={
                          tipo ? `${day} ago — ${TIPO_META[tipo].label}` : undefined
                        }
                        style={
                          meta
                            ? {
                                backgroundColor: meta.bg,
                                opacity: dim ? 0.15 : 1,
                              }
                            : { backgroundColor: '#F5F5F7' }
                        }
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
            {filteredPlans.length === 0 && (
              <tr>
                <td
                  colSpan={AUGUST_DAYS.length + 1}
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
