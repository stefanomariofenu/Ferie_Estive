interface LogoProps {
  size?: 'sm' | 'lg'
}

/** Logo "Ferie Estive 2026" · KPMG PS & HC. */
export function Logo({ size = 'sm' }: LogoProps) {
  const lg = size === 'lg'
  return (
    <div className="flex items-center gap-2.5">
      <SunMark className={lg ? 'h-9 w-9' : 'h-7 w-7'} />
      <div className="leading-none">
        <div
          className={`font-semibold tracking-tight text-ink ${
            lg ? 'text-[22px]' : 'text-[16px]'
          }`}
        >
          Ferie Estive{' '}
          <span className="font-medium tabular-nums text-subtle">2026</span>
        </div>
        <div
          className={`mt-1 font-semibold uppercase tracking-[0.16em] text-subtle ${
            lg ? 'text-[10px]' : 'text-[9px]'
          }`}
        >
          KPMG · PS &amp; HC
        </div>
      </div>
    </div>
  )
}

/**
 * Sole minimale e caldo — nessun riquadro, tratto pulito e premium.
 * Disco con gradiente sole + raggi sottili tondi.
 */
export function SunMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="sunCore" cx="38%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#FFD778" />
          <stop offset="55%" stopColor="#FFB020" />
          <stop offset="100%" stopColor="#FB8C00" />
        </radialGradient>
      </defs>
      <g stroke="#FFB020" strokeWidth="2.2" strokeLinecap="round">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4
          const r1 = 13.5
          const r2 = 18
          return (
            <line
              key={i}
              x1={20 + Math.cos(a) * r1}
              y1={20 + Math.sin(a) * r1}
              x2={20 + Math.cos(a) * r2}
              y2={20 + Math.sin(a) * r2}
            />
          )
        })}
      </g>
      <circle cx="20" cy="20" r="9.5" fill="url(#sunCore)" />
    </svg>
  )
}
