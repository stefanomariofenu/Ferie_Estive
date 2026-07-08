import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'

export function Header() {
  const { profile, isAdmin, signOut } = useAuth()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Ferie Estive 2026">
            <Logo />
          </Link>
          {isAdmin && (
            <nav className="ml-1 hidden items-center gap-1 rounded-full bg-black/[0.04] p-1 sm:flex">
              <NavLink to="/" active={pathname === '/'}>
                Il mio piano
              </NavLink>
              <NavLink to="/admin" active={pathname === '/admin'}>
                Dashboard
              </NavLink>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {profile && (
            <span className="hidden text-sm font-medium text-subtle md:inline">
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

function NavLink({
  to,
  active,
  children,
}: {
  to: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-white text-ink shadow-sm' : 'text-subtle hover:text-ink'
      }`}
    >
      {children}
    </Link>
  )
}
