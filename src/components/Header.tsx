import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './Logo'
import { HelpModal } from './HelpModal'

export function Header() {
  const { profile, isAdmin, signOut } = useAuth()
  const { pathname } = useLocation()
  const [help, setHelp] = useState(false)

  return (
    <>
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

          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link
                to={pathname === '/admin' ? '/' : '/admin'}
                className="btn-ghost !px-3 sm:hidden"
              >
                {pathname === '/admin' ? 'Piano' : 'Dashboard'}
              </Link>
            )}
            {profile && (
              <span className="mr-1 hidden text-sm font-medium text-subtle md:inline">
                {profile.nome} {profile.cognome}
              </span>
            )}
            <button
              onClick={() => setHelp(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-subtle transition hover:bg-black/5 hover:text-ink"
              aria-label="Aiuto e guida"
              title="Aiuto"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9.5" />
                <path d="M9.3 9.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.5 2-2.5 3.6" strokeLinecap="round" />
                <circle cx="12" cy="17.4" r="0.4" fill="currentColor" stroke="none" strokeWidth="1.6" />
              </svg>
            </button>
            <button onClick={signOut} className="btn-ghost">
              Esci
            </button>
          </div>
        </div>
      </header>
      {help && <HelpModal onClose={() => setHelp(false)} />}
    </>
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
