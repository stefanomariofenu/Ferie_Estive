import { useEffect, useRef } from 'react'
import type { CalendarEntry } from '../types'
import {
  AUGUST_DAYS,
  TIPO_META,
  TIPO_ORDER,
  firstDayOffset,
  isWeekend,
  SUGGESTED_START,
  SUGGESTED_END,
} from '../lib/august'
import { DayCell } from './DayCell'

const WEEK_HEADER = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

interface CalendarGridProps {
  entries: Record<number, CalendarEntry>
  selected: Set<number>
  onSelectionChange: (next: Set<number>) => void
}

export function CalendarGrid({
  entries,
  selected,
  onSelectionChange,
}: CalendarGridProps) {
  const offset = firstDayOffset()

  // Stato del drag conservato in ref per non ri-renderizzare durante il trascinamento.
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

  function apply(day: number) {
    const next = new Set(selRef.current)
    if (mode.current === 'add') next.add(day)
    else next.delete(day)
    onSelectionChange(next)
  }

  function handlePointerDown(day: number, e: React.PointerEvent) {
    if (isWeekend(day)) return
    e.preventDefault()
    dragging.current = true
    mode.current = selRef.current.has(day) ? 'remove' : 'add'
    apply(day)
  }

  function handlePointerEnter(day: number) {
    if (!dragging.current || isWeekend(day)) return
    apply(day)
  }

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="headline text-[22px]">
            <em>Agosto</em> 2026
          </h2>
          <p className="text-xs text-subtle">
            Tocca o <span className="font-medium text-ink">trascina</span> per
            selezionare più giorni, poi scegli la categoria.
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
            <span className="h-2.5 w-2.5 rounded-[4px] ring-1 ring-inset ring-accent/40" />
            Consigliato ({SUGGESTED_START}–{SUGGESTED_END})
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
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden />
        ))}
        {AUGUST_DAYS.map((day) => {
          const entry = entries[day]
          return (
            <DayCell
              key={day}
              day={day}
              tipo={entry?.tipo}
              hasNote={!!entry?.note}
              selected={selected.has(day)}
              onPointerDown={handlePointerDown}
              onPointerEnter={handlePointerEnter}
            />
          )
        })}
      </div>
    </div>
  )
}
