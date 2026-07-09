export type Ruolo = 'employee' | 'admin'

export type Tipo = 'lavoro' | 'ferie_bloccate' | 'ferie_flessibili'

export interface AppUser {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: Ruolo
  nota?: string | null
  created_at: string
}

export interface CalendarEntry {
  id: string
  user_id: string
  data: string // ISO date 'YYYY-MM-DD'
  tipo: Tipo
  note: string | null
  created_at: string
  updated_at: string
}

/** Persona attesa (dal roster) + eventuale nome/cognome. */
export interface RosterPerson {
  email: string
  nome: string | null
  cognome: string | null
}

/** Riga aggregata usata nella tabella e nell'export admin. */
export interface EmployeePlan {
  user: { id: string | null; nome: string; cognome: string; email: string }
  /** Mappa data ISO -> tipo inserito. */
  byDay: Record<string, Tipo>
  nota: string | null
  hasResponded: boolean
}
