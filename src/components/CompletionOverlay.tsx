import { useEffect } from 'react'

interface CompletionOverlayProps {
  nome: string
  onClose: () => void
}

/**
 * Schermata di ringraziamento a piano completato: cielo terso con nuvole
 * morbide che fluttuano su una sfumatura bianca, e il messaggio
 * "Grazie mille, {nome}! · Buone Ferie". Si chiude da sola o al tocco.
 */
export function CompletionOverlay({ nome, onClose }: CompletionOverlayProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden animate-fade-in"
      role="dialog"
      aria-label="Piano completato"
    >
      {/* cielo estivo: azzurro tenue in alto → bianco morbido al centro */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,#CDE6FF_0%,#EAF4FF_35%,#FFFFFF_70%)]" />

      {/* nuvole morbide che fluttuano */}
      <Clouds />

      {/* velo bianco che dà profondità al testo */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_50%,rgba(255,255,255,0.9),rgba(255,255,255,0)_70%)]" />

      <div className="relative flex flex-col items-center px-6 text-center animate-rise">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-accent/70">
          Piano completato
        </p>
        <h2 className="headline mt-4 text-4xl leading-tight sm:text-[54px]">
          Grazie mille{nome ? `, ${nome}` : ''}!
        </h2>
        <p className="headline mt-2 text-3xl sm:text-[40px]">
          <em>Buone Ferie</em> ☀️
        </p>
        <p className="mt-5 max-w-sm text-sm text-subtle">
          Il tuo agosto è pianificato. Potrai modificarlo quando vuoi.
        </p>
        <button
          onClick={onClose}
          className="btn-primary mt-7"
        >
          Continua
        </button>
      </div>
    </div>
  )
}

/** Nuvole soffici realizzate con blob bianchi sfocati che scorrono lente. */
function Clouds() {
  const clouds = [
    { top: '14%', size: 200, delay: 0, dur: 26, from: '-30%' },
    { top: '26%', size: 140, delay: 4, dur: 32, from: '-20%' },
    { top: '62%', size: 240, delay: 2, dur: 30, from: '-40%' },
    { top: '74%', size: 160, delay: 7, dur: 36, from: '-25%' },
    { top: '44%', size: 120, delay: 10, dur: 28, from: '-15%' },
  ]
  return (
    <div aria-hidden className="absolute inset-0">
      {clouds.map((c, i) => (
        <div
          key={i}
          className="animate-cloud absolute left-0"
          style={{
            top: c.top,
            width: c.size,
            height: c.size * 0.6,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.dur}s`,
            ['--from' as string]: c.from,
          }}
        >
          <Cloud />
        </div>
      ))}
    </div>
  )
}

function Cloud() {
  return (
    <div className="relative h-full w-full">
      {/* più ellissi bianche sfocate sovrapposte = nuvola morbida */}
      <div className="absolute bottom-0 left-[18%] h-[55%] w-[55%] rounded-full bg-white blur-xl" />
      <div className="absolute bottom-[8%] left-[36%] h-[75%] w-[55%] rounded-full bg-white blur-xl" />
      <div className="absolute bottom-0 left-[50%] h-[52%] w-[50%] rounded-full bg-white blur-xl" />
      <div className="absolute bottom-[4%] left-[8%] h-[42%] w-[45%] rounded-full bg-white blur-xl" />
    </div>
  )
}
