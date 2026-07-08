import type { CalendarEntry } from '../types'
import { AUGUST_DAYS, firstDayOffset, SUGGESTED_START, SUGGESTED_END } from '../lib/august'
import { DayCell } from './DayCell'

const WEEK_HEADER = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

interface CalendarGridProps {
  entries: Record<number, CalendarEntry>
  onDayClick: (day: number) => void
}

export function CalendarGrid({ entries, onDayClick }: CalendarGridProps) {
  const offset = firstDayOffset()

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">Agosto</h2>
        <span className="inline-flex items-center gap-1.5 text-xs text-subtle">
          <span className="h-2.5 w-2.5 rounded-full ring-1 ring-inset ring-accent/40" />
          Consigliato KPMG ({SUGGESTED_START}–{SUGGESTED_END})
        </span>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEK_HEADER.map((w) => (
          <div
            key={w}
            className="pb-1 text-center text-[11px] font-medium uppercase tracking-wide text-subtle"
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
              onClick={onDayClick}
            />
          )
        })}
      </div>
    </div>
  )
}
