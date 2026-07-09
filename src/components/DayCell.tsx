import type { Tipo } from '../types'
import type { Giorno } from '../lib/august'
import { TIPO_META } from '../lib/august'

interface DayCellProps {
  giorno: Giorno
  tipo?: Tipo
  hasNote?: boolean
  selected: boolean
  onPointerDown: (iso: string, e: React.PointerEvent) => void
  onPointerEnter: (iso: string) => void
}

export function DayCell({
  giorno,
  tipo,
  hasNote,
  selected,
  onPointerDown,
  onPointerEnter,
}: DayCellProps) {
  const meta = tipo ? TIPO_META[tipo] : null

  if (giorno.weekend) {
    return (
      <div
        className="flex aspect-square flex-col items-start justify-between rounded-2xl border border-dashed border-black/10 bg-black/[0.02] p-2 text-left"
        aria-label={`${giorno.dom} ${giorno.monthShort} — chiuso (weekend)`}
      >
        <span className="text-[11px] font-medium uppercase tracking-wide text-black/25">
          {giorno.wLabel}
        </span>
        <span className="text-xl font-semibold leading-none text-black/25">
          {giorno.dom}
        </span>
        <span className="text-[10px] font-medium text-black/25">Chiuso</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onPointerDown={(e) => onPointerDown(giorno.iso, e)}
      onPointerEnter={() => onPointerEnter(giorno.iso)}
      style={meta ? { backgroundColor: meta.bg, color: meta.fg } : undefined}
      className={[
        'no-touch-scroll relative flex aspect-square select-none flex-col items-start justify-between',
        'rounded-2xl p-2 text-left transition-[transform,box-shadow,background-color] duration-200 ease-smooth',
        'hover:-translate-y-0.5 hover:shadow-card',
        meta ? 'font-medium' : 'bg-white text-ink ring-1 ring-black/[0.05]',
        giorno.suggested && !meta ? 'ring-1 ring-inset ring-cyan/50' : '',
        selected ? 'outline outline-2 outline-cyan -translate-y-0.5 shadow-pop' : '',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={`${giorno.dom} ${giorno.monthShort} (${giorno.wLabel})${
        meta ? ' – ' + meta.label : ' – da compilare'
      }`}
    >
      <span className="flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-wide opacity-70">
        <span>{giorno.wLabel}</span>
        {hasNote && <span title="Contiene una nota">✎</span>}
      </span>
      <span className="flex items-baseline gap-1 leading-none">
        <span className="text-xl font-semibold">{giorno.dom}</span>
        {giorno.dom === 1 || giorno.iso === DAYS_FIRST_ISO ? (
          <span className="text-[10px] font-semibold uppercase opacity-60">
            {giorno.monthShort}
          </span>
        ) : null}
      </span>
      {meta ? (
        <span className="w-full truncate text-[10px] font-medium leading-tight">
          {meta.label}
        </span>
      ) : (
        <span className="text-[10px] text-subtle">—</span>
      )}
      {giorno.suggested && !meta && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-cyan/60" />
      )}
      {selected && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan text-[10px] font-bold text-white">
          ✓
        </span>
      )}
    </button>
  )
}

// Mostra l'etichetta del mese sul primo giorno del periodo.
const DAYS_FIRST_ISO = '2026-07-27'
