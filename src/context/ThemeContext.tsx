import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import type { Theme } from '../types'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
  /** true se le micro-interazioni/emoji sono attive (modalità "Sereno"). */
  playful: boolean
}

const ThemeContext = createContext<ThemeCtx | undefined>(undefined)

const STORAGE_KEY = 'ferie-agosto:theme'

function readInitial(): Theme {
  if (typeof window === 'undefined') return 'sereno'
  const saved = window.localStorage.getItem(STORAGE_KEY)
  return saved === 'essenziale' || saved === 'sereno' ? saved : 'sereno'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readInitial)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  const value: ThemeCtx = {
    theme,
    toggle: () => setTheme((t) => (t === 'sereno' ? 'essenziale' : 'sereno')),
    playful: theme === 'sereno',
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme deve stare dentro <ThemeProvider>')
  return ctx
}
