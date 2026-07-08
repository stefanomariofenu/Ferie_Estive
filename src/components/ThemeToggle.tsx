import { useTheme } from '../context/ThemeContext'

/** Toggle Sereno (☀️, micro-interazioni) / Essenziale (sobrio). */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const sereno = theme === 'sereno'

  return (
    <button
      onClick={toggle}
      className="btn-ghost !px-3"
      aria-label={
        sereno
          ? 'Passa alla modalità Essenziale'
          : 'Passa alla modalità Sereno'
      }
      title={sereno ? 'Modalità Sereno' : 'Modalità Essenziale'}
    >
      <span className="text-base leading-none">{sereno ? '☀️' : '🌙'}</span>
      <span className="hidden sm:inline">
        {sereno ? 'Sereno' : 'Essenziale'}
      </span>
    </button>
  )
}
