import { useEffect, useRef } from 'react'
import type { CalendarEntry } from '../types'
import {
  DAYS,
  FIRST_OFFSET,
  TIPO_META,
  TIPO_ORDER,
  PERIOD_LABEL,
  SUGGESTED_LABEL,
  giornoOf,
} from '../lib/august'
import { DayCell } from './DayCell'

const WEEK_HEADER = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

interface CalendarGridProps {
  entries: Record<string, CalendarEntry>
  selected: Set<string>
  onSelectionChange: (next: Set<string>) => void
  /** Piano inviato: calendario in sola lettura, nessuna selezione. */
  locked?: boolean
}

export function CalendarGrid({
  entries,
  selected,
  onSelectionChange,
  locked = false,
}: CalendarGridProps) {
  const dragging = useRef(false)
  const mode = useRef<'add' | 'remove'>('add')
  const selRef = useRef(selected)
  selRef.current = selected

  useEffect(() => {
    const stop = () => (dragging.current = false)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    return () => {
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
    }
  }, [])

  function apply(iso: string) {
    const next = new Set(selRef.current)
    if (mode.current === 'add') next.add(iso)
    else next.delete(iso)
    onSelectionChange(next)
  }

  function handlePointerDown(iso: string, e: React.PointerEvent) {
    if (locked || giornoOf(iso)?.weekend) return
    e.preventDefault()
    dragging.current = true
    mode.current = selRef.current.has(iso) ? 'remove' : 'add'
    apply(iso)
  }

  function handlePointerEnter(iso: string) {
    if (locked || !dragging.current || giornoOf(iso)?.weekend) return
    apply(iso)
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px]">
            <em>{PERIOD_LABEL}</em>
          </h2>
          <p className="text-xs text-subtle">
            {locked ? (
              <>Piano inviato — <span className="font-medium text-ink">sola lettura</span>. Ritira l'invio per modificarlo.</>
            ) : (
              <>Tocca o <span className="font-medium text-ink">trascina</span> per selezionare più giorni, poi scegli la categoria.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-subtle">
          {TIPO_ORDER.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-[4px]"
                style={{ backgroundColor: TIPO_META[t].bg }}
              />
              {TIPO_META[t].label}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[4px] ring-1 ring-inset ring-cyan/50" />
            Consigliato ({SUGGESTED_LABEL})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-[4px] border border-dashed border-black/20 bg-black/[0.02]" />
            Chiuso (weekend)
          </span>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEK_HEADER.map((w, i) => (
          <div
            key={w}
            className={`pb-1 text-center text-[11px] font-medium uppercase tracking-wide ${
              i >= 5 ? 'text-black/25' : 'text-subtle'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {Array.from({ length: FIRST_OFFSET }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden />
        ))}
        {DAYS.map((g) => {
          const entry = entries[g.iso]
          return (
            <DayCell
              key={g.iso}
              giorno={g}
              tipo={entry?.tipo}
              hasNote={!!entry?.note}
              selected={selected.has(g.iso)}
              onPointerDown={handlePointerDown}
              onPointerEnter={handlePointerEnter}
            />
          )
        })}
      </div>
    </div>
  )
}
