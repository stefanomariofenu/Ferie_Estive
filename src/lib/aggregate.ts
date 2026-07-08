import type { AppUser, CalendarEntry, EmployeePlan, Tipo } from '../types'
import { AUGUST_DAYS, dayFromISO, isWeekend } from './august'

export interface DayCoverage {
  day: number
  lavoro: number
  ferie_bloccate: number
  ferie_flessibili: number
  /** Persone che NON hanno marcato quel giorno. */
  non_compilato: number
  /** Weekend: ufficio chiuso, escluso dai conteggi di copertura. */
  closed: boolean
}

export interface AggregateResult {
  plans: EmployeePlan[]
  coverage: DayCoverage[]
  respondedCount: number
  totalUsers: number
}

/**
 * Costruisce i dati aggregati per la vista/expor admin a partire da
 * tutti gli utenti e tutte le entry di agosto.
 */
export function buildAggregate(
  users: AppUser[],
  entries: CalendarEntry[]
): AggregateResult {
  // Raggruppa le entry per utente.
  const byUser = new Map<string, Record<number, Tipo>>()
  for (const e of entries) {
    const day = dayFromISO(e.data)
    if (!byUser.has(e.user_id)) byUser.set(e.user_id, {})
    byUser.get(e.user_id)![day] = e.tipo
  }

  const plans: EmployeePlan[] = users
    .map((u) => {
      const byDay = byUser.get(u.id) ?? {}
      return {
        user: { id: u.id, nome: u.nome, cognome: u.cognome, email: u.email },
        byDay,
        hasResponded: Object.keys(byDay).length > 0,
      }
    })
    .sort((a, b) =>
      `${a.user.cognome} ${a.user.nome}`.localeCompare(
        `${b.user.cognome} ${b.user.nome}`,
        'it'
      )
    )

  const coverage: DayCoverage[] = AUGUST_DAYS.map((day) => {
    const row: DayCoverage = {
      day,
      lavoro: 0,
      ferie_bloccate: 0,
      ferie_flessibili: 0,
      non_compilato: 0,
      closed: isWeekend(day),
    }
    for (const p of plans) {
      const t = p.byDay[day]
      if (!t) row.non_compilato++
      else row[t]++
    }
    return row
  })

  const respondedCount = plans.filter((p) => p.hasResponded).length

  return {
    plans,
    coverage,
    respondedCount,
    totalUsers: users.length,
  }
}
