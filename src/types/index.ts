export type Ruolo = 'employee' | 'admin'

export type Tipo = 'lavoro' | 'ferie_bloccate' | 'ferie_flessibili'

export interface AppUser {
  id: string
  email: string
  nome: string
  cognome: string
  ruolo: Ruolo
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

/** Riga aggregata usata nella tabella e nell'export admin. */
export interface EmployeePlan {
  user: Pick<AppUser, 'id' | 'nome' | 'cognome' | 'email'>
  /** Mappa giorno (1-31) -> tipo inserito. */
  byDay: Record<number, Tipo>
  hasResponded: boolean
}

export type Theme = 'sereno' | 'essenziale'
