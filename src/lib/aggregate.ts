import type { AppUser, CalendarEntry, EmployeePlan, RosterPerson, Tipo } from '../types'
import { DAYS } from './august'

export interface DayCoverage {
  iso: string
  dom: number
  month: number
  monthShort: string
  wLabel: string
  weekend: boolean
  suggested: boolean
  lavoro: number
  ferie_bloccate: number
  ferie_flessibili: number
  non_compilato: number
}

export interface AggregateResult {
  plans: EmployeePlan[]
  coverage: DayCoverage[]
  respondedCount: number
  totalPeople: number
}

/**
 * Costruisce i dati aggregati per admin.
 * roster = elenco atteso (dalla lista collaboratori). Vengono mostrate anche
 * le persone che non hanno ancora compilato.
 */
export function buildAggregate(
  roster: RosterPerson[],
  users: AppUser[],
  entries: CalendarEntry[]
): AggregateResult {
  const byUserId = new Map<string, Record<string, Tipo>>()
  for (const e of entries) {
    if (!byUserId.has(e.user_id)) byUserId.set(e.user_id, {})
    byUserId.get(e.user_id)![e.data] = e.tipo
  }

  // Indice utenti registrati per email.
  const usersByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]))

  // Unione: tutte le email del roster + eventuali utenti registrati non in lista.
  const emails = new Set<string>()
  roster.forEach((r) => emails.add(r.email.toLowerCase()))
  users.forEach((u) => emails.add(u.email.toLowerCase()))
  const rosterByEmail = new Map(roster.map((r) => [r.email.toLowerCase(), r]))

  const plans: EmployeePlan[] = [...emails]
    .map((email) => {
      const u = usersByEmail.get(email)
      const r = rosterByEmail.get(email)
      // Conta SOLO i piani inviati: le modifiche in corso (non inviate) non
      // devono comparire nella dashboard/Excel.
      const inviato = !!u?.inviato
      const byDay = inviato && u ? byUserId.get(u.id) ?? {} : {}
      const nome = (u?.nome || r?.nome || '').trim()
      const cognome = (u?.cognome || r?.cognome || '').trim()
      return {
        user: { id: u?.id ?? null, email, nome, cognome },
        byDay,
        nota: inviato ? u?.nota ?? null : null,
        hasResponded: inviato,
      }
    })
    .sort((a, b) =>
      `${a.user.cognome} ${a.user.nome}`.localeCompare(
        `${b.user.cognome} ${b.user.nome}`,
        'it'
      )
    )

  const coverage: DayCoverage[] = DAYS.map((g) => {
    const row: DayCoverage = {
      iso: g.iso,
      dom: g.dom,
      month: g.month,
      monthShort: g.monthShort,
      wLabel: g.wLabel,
      weekend: g.weekend,
      suggested: g.suggested,
      lavoro: 0,
      ferie_bloccate: 0,
      ferie_flessibili: 0,
      non_compilato: 0,
    }
    if (g.weekend) return row
    for (const p of plans) {
      const t = p.byDay[g.iso]
      if (!t) row.non_compilato++
      else row[t]++
    }
    return row
  })

  return {
    plans,
    coverage,
    respondedCount: plans.filter((p) => p.hasResponded).length,
    totalPeople: plans.length,
  }
}
