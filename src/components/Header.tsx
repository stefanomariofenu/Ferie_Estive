import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
  const { profile, isAdmin, signOut } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg" aria-hidden>☀️</span>
            <span className="text-[15px] font-semibold tracking-tight text-ink">
              Ferie Agosto
            </span>
          </Link>
          {isAdmin && (
            <nav className="ml-2 hidden items-center gap-1 sm:flex">
              <Link
                to="/"
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  pathname === '/'
                    ? 'bg-muted text-ink'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                Il mio piano
              </Link>
              <Link
                to="/admin"
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  pathname === '/admin'
                    ? 'bg-muted text-ink'
                    : 'text-subtle hover:text-ink'
                }`}
              >
                Vista admin
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {profile && (
            <span className="hidden text-sm text-subtle md:inline">
              {profile.nome} {profile.cognome}
            </span>
          )}
          <button onClick={signOut} className="btn-ghost">
            Esci
          </button>
        </div>
      </div>
    </header>
  )
}
