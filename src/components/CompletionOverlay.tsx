import { useEffect } from 'react'
import { SunMark } from './Logo'

interface CompletionOverlayProps {
  nome: string
  onClose: () => void
}

/**
 * Schermata di ringraziamento mostrata quando il piano è completo:
 * un grande sole che entra con una transizione e il messaggio
 * "Grazie, {nome} · Buone Ferie!". Si chiude da sola o al tocco.
 */
export function CompletionOverlay({ nome, onClose }: CompletionOverlayProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 p-6 backdrop-blur-xl animate-fade-in"
      role="dialog"
      aria-label="Piano completato"
    >
      {/* pioggia di soli sullo sfondo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="absolute top-0 animate-sun-fall"
            style={{
              left: `${(i * 100) / 14 + (i % 3)}%`,
              fontSize: `${16 + (i % 4) * 7}px`,
              animationDelay: `${(i % 6) * 130}ms`,
              animationDuration: '1600ms',
            }}
          >
            ☀️
          </span>
        ))}
      </div>

      <div className="relative flex flex-col items-center text-center animate-scale-in">
        <div className="animate-sun-pop drop-shadow-sm">
          <SunMark className="h-28 w-28" />
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Grazie{nome ? `, ${nome}` : ''}!
        </h2>
        <p className="mt-1 text-2xl font-semibold sm:text-3xl">
          <span className="brand-gradient">Buone Ferie</span> ☀️
        </p>
        <p className="mt-4 text-sm text-subtle">
          Hai completato il tuo piano di agosto. Puoi comunque modificarlo
          quando vuoi.
        </p>
        <button onClick={onClose} className="btn-primary mt-6">
          Perfetto
        </button>
      </div>
    </div>
  )
}
