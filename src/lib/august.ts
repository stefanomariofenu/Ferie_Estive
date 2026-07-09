import type { Tipo } from '../types'

/** Anno di riferimento della pianificazione. */
export const YEAR = 2026

// Periodo di pianificazione: 27 luglio → 31 agosto 2026.
const START = new Date(YEAR, 6, 27) // 27 luglio (mese 6 = luglio)
const END = new Date(YEAR, 7, 31) // 31 agosto

const WD_MON = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] // 0=Lun
const MONTH_SHORT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}
/** Indice 0=Lun..6=Dom */
function monIdx(d: Date): number {
  return (d.getDay() + 6) % 7
}

export interface Giorno {
  iso: string // 'YYYY-MM-DD' — chiave univoca del giorno
  dom: number // giorno del mese (1..31)
  month: number // 6=luglio, 7=agosto
  monthShort: string // 'Lug' / 'Ago'
  wLabel: string // Lun..Dom
  weekend: boolean
  suggested: boolean
}

/** Range "caldamente consigliato" da KPMG: 10–28 agosto. */
export function isSuggestedDate(d: Date): boolean {
  return d.getMonth() === 7 && d.getDate() >= 10 && d.getDate() <= 28
}
export const SUGGESTED_LABEL = '10–28 agosto'

/** Tutti i giorni del periodo. */
export const DAYS: Giorno[] = (() => {
  const out: Giorno[] = []
  const d = new Date(START)
  while (d <= END) {
    const g = d.getDay()
    out.push({
      iso: isoOf(d),
      dom: d.getDate(),
      month: d.getMonth(),
      monthShort: MONTH_SHORT[d.getMonth()],
      wLabel: WD_MON[monIdx(d)],
      weekend: g === 0 || g === 6,
      suggested: isSuggestedDate(d),
    })
    d.setDate(d.getDate() + 1)
  }
  return out
})()

/** Giorni lavorativi (weekend esclusi). */
export const WORKING_DAYS: Giorno[] = DAYS.filter((g) => !g.weekend)

/** Mappa iso -> Giorno. */
const BY_ISO = new Map(DAYS.map((g) => [g.iso, g]))
export function giornoOf(iso: string): Giorno | undefined {
  return BY_ISO.get(iso)
}

/** Offset (0=Lun..6=Dom) del primo giorno, per allineare la griglia. */
export const FIRST_OFFSET = monIdx(START)

/** Etichetta di intestazione del periodo. */
export const PERIOD_LABEL = '27 luglio – 31 agosto 2026'

/**
 * Headcount atteso per il calcolo "X / Y hanno risposto".
 * null = usa il numero di persone attese (roster).
 */
export const EXPECTED_HEADCOUNT: number | null = null

/** Soglia minima di persone al lavoro sotto la quale un giorno è "scoperto". */
export const DEFAULT_COVERAGE_THRESHOLD = 5

// ---- Metadati categorie (label + colori KPMG) -----------------------

export const TIPO_META: Record<
  Tipo,
  {
    label: string
    short: string
    desc: string
    bg: string
    fg: string
    solid: string
    excelFill: string
  }
> = {
  lavoro: {
    label: 'Lavoro',
    short: 'L',
    desc: 'Giornata lavorativa in ufficio',
    // Più marcato per distinguerlo bene dai giorni vuoti.
    bg: '#B9CBE4',
    fg: '#12305C',
    solid: '#B9CBE4',
    excelFill: 'FFB9CBE4',
  },
  ferie_bloccate: {
    label: 'Ferie bloccate',
    short: 'B',
    desc: 'Via e/o irreperibile',
    bg: '#00338D',
    fg: '#FFFFFF',
    solid: '#00338D',
    excelFill: 'FF00338D',
  },
  ferie_flessibili: {
    label: 'Ferie flessibili',
    short: 'F',
    desc: 'Per urgenze estreme, reperibile',
    bg: '#00A3E0',
    fg: '#06243B',
    solid: '#00A3E0',
    excelFill: 'FF00A3E0',
  },
}

export const TIPO_ORDER: Tipo[] = ['lavoro', 'ferie_bloccate', 'ferie_flessibili']
