import { useEffect, useState } from 'react'
import type { Tipo } from '../types'
import { TIPO_META, isSuggested, isWeekend, weekdayLabel } from '../lib/august'
import { useTheme } from '../context/ThemeContext'
import { SunEmoji } from './SunEmoji'

interface DayCellProps {
  day: number
  tipo?: Tipo
  hasNote?: boolean
  onClick: (day: number) => void
}

export function DayCell({ day, tipo, hasNote, onClick }: DayCellProps) {
  const { playful } = useTheme()
  const suggested = isSuggested(day)
  const weekend = isWeekend(day)
  const meta = tipo ? TIPO_META[tipo] : null

  // Trigger animazione sole quando l'utente marca un giorno di ferie.
  const [burst, setBurst] = useState(false)
  const isFerie = tipo === 'ferie_bloccate' || tipo === 'ferie_flessibili'
  useEffect(() => {
    if (playful && isFerie) {
      setBurst(true)
      const t = setTimeout(() => setBurst(false), 1100)
      return () => clearTimeout(t)
    }
  }, [tipo, playful, isFerie])

  return (
    <button
      onClick={() => onClick(day)}
      style={
        meta
          ? { backgroundColor: meta.bg, color: meta.fg }
          : undefined
      }
      className={[
        'relative flex aspect-square flex-col items-start justify-between',
        'rounded-2xl p-2 text-left transition duration-200 ease-smooth',
        'hover:-translate-y-0.5 hover:shadow-card focus-visible:-translate-y-0.5',
        meta ? 'font-medium' : 'bg-muted text-ink',
        !meta && weekend ? 'opacity-70' : '',
        suggested ? 'ring-1 ring-inset ring-accent/40' : '',
      ].join(' ')}
      aria-label={`${day} agosto (${weekdayLabel(day)})${
        meta ? ' – ' + meta.label : ' – nessun inserimento'
      }`}
    >
      <span className="flex w-full items-center justify-between text-[11px] font-medium uppercase tracking-wide opacity-70">
        <span>{weekdayLabel(day)}</span>
        {hasNote && <span title="Contiene una nota">✎</span>}
      </span>
      <span className="text-xl font-semibold leading-none">{day}</span>
      {meta ? (
        <span className="w-full truncate text-[10px] font-medium leading-tight">
          {meta.label}
        </span>
      ) : (
        <span className="text-[10px] text-subtle">—</span>
      )}
      {suggested && !meta && (
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent/50" />
      )}
      {burst && <SunEmoji />}
    </button>
  )
}
