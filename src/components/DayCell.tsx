import type { Tipo } from '../types'
import { TIPO_META, isSuggested, isWeekend, weekdayLabel } from '../lib/august'

interface DayCellProps {
  day: number
  tipo?: Tipo
  hasNote?: boolean
  selected: boolean
  onPointerDown: (day: number, e: React.PointerEvent) => void
  onPointerEnter: (day: number) => void
}

export function DayCell({
  day,
  tipo,
  hasNote,
  selected,
  onPointerDown,
  onPointerEnter,
}: DayCellProps) {
  const weekend = isWeekend(day)
  const suggested = isSuggested(day)
  const meta = tipo ? TIPO_META[tipo] : null

  // Weekend: ufficio chiuso, non selezionabile, non conteggiato.
  if (weekend) {
    return (
      <div
        className="flex aspect-square flex-col items-start justify-between rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-2 text-left"
        aria-label={`${day} agosto — chiuso (weekend)`}
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-black/25">
          {weekdayLabel(day)}
        </span>
        <span className="text-xl font-semibold leading-none text-black/25">
          {day}
        </span>
        <span className="text-[10px] font-medium text-black/25">Chiuso</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onPointerDown={(e) => onPointerDown(day, e)}
      onPointerEnter={() => onPointerEnter(day)}
      style={meta ? { backgroundColor: meta.bg, color: meta.fg } : undefined}
      className={[
        'no-touch-scroll relative flex aspect-square select-none flex-col items-start justify-between',
        'rounded-2xl p-2 text-left transition-[transform,box-shadow,background-color] duration-200 ease-smooth',
        'hover:-translate-y-0.5 hover:shadow-card',
        meta ? 'font-medium' : 'bg-white text-ink ring-1 ring-black/[0.05]',
        suggested && !meta ? 'ring-1 ring-inset ring-accent/40' : '',
        selected
          ? 'outline outline-2 outline-accent -translate-y-0.5 shadow-pop'
          : '',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={`${day} agosto (${weekdayLabel(day)})${
        meta ? ' – ' + meta.label : ' – da compilare'
      }`}
    >
      <span className="flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-wide opacity-70">
        <span>{weekdayLabel(day)}</span>
        {hasNote && <span title="Contiene una nota">✎</span>}
      </span>
      <span className="text-xl font-semibold leading-none">{day}</span>
      {meta ? (
        <span className="flex w-full items-center gap-1 truncate text-[10px] font-medium leading-tight">
          <span>{meta.emoji}</span>
          <span className="truncate">{meta.label}</span>
        </span>
      ) : (
        <span className="text-[10px] text-subtle">—</span>
      )}
      {suggested && !meta && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent/50" />
      )}
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
          ✓
        </span>
      )}
    </button>
  )
}
