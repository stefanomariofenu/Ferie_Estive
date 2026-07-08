/**
 * Pioggia leggera di ☀️ mostrata brevemente quando si segnano ferie
 * (solo modalità "Sereno"). Nasconde automaticamente via .playful-only.
 */
export function SunBurst({ seed }: { seed: number }) {
  const items = Array.from({ length: 10 })
  return (
    <div
      key={seed}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {items.map((_, i) => {
        const left = (i * 100) / items.length + (seed % 7)
        const delay = (i % 5) * 90
        const size = 18 + (i % 4) * 6
        return (
          <span
            key={i}
            className="absolute top-0 animate-sun-fall"
            style={{
              left: `${left}%`,
              fontSize: `${size}px`,
              animationDelay: `${delay}ms`,
              animationDuration: '1200ms',
            }}
          >
            ☀️
          </span>
        )
      })}
    </div>
  )
}
