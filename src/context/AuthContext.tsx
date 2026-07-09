import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AppUser } from '../types'

interface AuthCtx {
  session: Session | null
  profile: AppUser | null
  loading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthCtx | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('Errore nel caricamento profilo:', error.message)
      setProfile(null)
      return
    }
    let user = (data as AppUser) ?? null

    // Il roster (allowed_emails) è la fonte di verità per nome e cognome:
    // se il profilo mostra un nome derivato dalla mail (es. "Acaldarone"),
    // lo allineiamo al valore ufficiale ("Alessandro Aldo" / "Caldarone").
    if (user?.email) {
      const { data: r } = await supabase
        .from('allowed_emails')
        .select('nome, cognome')
        .eq('email', user.email.toLowerCase())
        .maybeSingle()
      if (
        r &&
        (r.nome || r.cognome) &&
        (r.nome !== user.nome || r.cognome !== user.cognome)
      ) {
        await supabase
          .from('users')
          .update({ nome: r.nome ?? '', cognome: r.cognome ?? '' })
          .eq('id', userId)
        user = { ...user, nome: r.nome ?? '', cognome: r.cognome ?? '' }
      }
    }

    setProfile(user)
  }

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        if (newSession) {
          await loadProfile(newSession.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value: AuthCtx = {
    session,
    profile,
    loading,
    isAdmin: profile?.ruolo === 'admin',
    signOut: async () => {
      await supabase.auth.signOut()
      setProfile(null)
    },
    refreshProfile: async () => {
      if (session) await loadProfile(session.user.id)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthCtx {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve stare dentro <AuthProvider>')
  return ctx
}
