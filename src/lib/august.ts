import type { Tipo } from '../types'

/** Anno di riferimento della pianificazione. */
export const YEAR = 2026

/** Numero di giorni di Agosto. */
export const DAYS_IN_AUGUST = 31

/** Elenco dei giorni 1..31. */
export const AUGUST_DAYS: number[] = Array.from(
  { length: DAYS_IN_AUGUST },
  (_, i) => i + 1
)

/** Range "caldamente consigliato" da KPMG (inclusivo). */
export const SUGGESTED_START = 10
export const SUGGESTED_END = 28

export function isSuggested(day: number): boolean {
  return day >= SUGGESTED_START && day <= SUGGESTED_END
}

/**
 * Headcount atteso per il calcolo "X / Y hanno risposto".
 * null = usa il numero di utenti registrati (count su public.users).
 * Metti un numero fisso (es. 120) se vuoi un totale indipendente dai signup.
 */
export const EXPECTED_HEADCOUNT: number | null = null

/** Soglia minima di persone al lavoro sotto la quale un giorno è "scoperto". */
export const DEFAULT_COVERAGE_THRESHOLD = 5

/** 'YYYY-MM-01' .. 'YYYY-MM-31' per le query e i confronti. */
export function dateISO(day: number): string {
  const dd = String(day).padStart(2, '0')
  return `${YEAR}-08-${dd}`
}

/** Estrae il giorno (1-31) da una data ISO 'YYYY-MM-DD'. */
export function dayFromISO(iso: string): number {
  return Number(iso.slice(8, 10))
}

const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

/** Etichetta breve del giorno della settimana (Lun..Dom). */
export function weekdayLabel(day: number): string {
  // getDay(): 0=Dom..6=Sab -> rimappa a 0=Lun..6=Dom
  const js = new Date(YEAR, 7, day).getDay()
  return WEEKDAY_LABELS[(js + 6) % 7]
}

/** true se il giorno cade di sabato o domenica. */
export function isWeekend(day: number): boolean {
  const js = new Date(YEAR, 7, day).getDay()
  return js === 0 || js === 6
}

/** Offset (0-6, Lun=0) del 1° agosto, per allineare la griglia settimanale. */
export function firstDayOffset(): number {
  const js = new Date(YEAR, 7, 1).getDay()
  return (js + 6) % 7
}

// ---- Metadati categorie (label + colori pastello condivisi) ----------

export const TIPO_META: Record<
  Tipo,
  { label: string; bg: string; fg: string; excelFill: string }
> = {
  lavoro: {
    label: 'Lavoro',
    bg: '#D1F2DE',
    fg: '#1E8E4E',
    excelFill: 'FFD1F2DE',
  },
  ferie_bloccate: {
    label: 'Ferie bloccate',
    bg: '#FCE4D6',
    fg: '#C9622A',
    excelFill: 'FFFCE4D6',
  },
  ferie_flessibili: {
    label: 'Ferie flessibili',
    bg: '#FFF6D6',
    fg: '#B8860B',
    excelFill: 'FFFFF6D6',
  },
}

export const TIPO_ORDER: Tipo[] = ['lavoro', 'ferie_bloccate', 'ferie_flessibili']
