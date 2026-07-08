interface LogoProps {
  size?: 'sm' | 'lg'
}

/** Logo "Ferie Estive 2026" · KPMG PS & HC con mark premium. */
export function Logo({ size = 'sm' }: LogoProps) {
  const lg = size === 'lg'
  return (
    <div className="flex items-center gap-3">
      <SunMark className={lg ? 'h-12 w-12' : 'h-10 w-10'} />
      <div className="leading-tight">
        <div
          className={`font-semibold tracking-tight text-ink ${
            lg ? 'text-2xl' : 'text-[17px]'
          }`}
        >
          Ferie Estive <span className="tabular-nums text-subtle">2026</span>
        </div>
        <div
          className={`font-semibold uppercase tracking-[0.14em] text-subtle ${
            lg ? 'text-[11px]' : 'text-[10px]'
          }`}
        >
          KPMG · PS &amp; HC
        </div>
      </div>
    </div>
  )
}

/**
 * Mark "app-icon": tile squircle con gradiente e un sole minimale.
 * Pulito e premium (stile Apple/Revolut), niente faccina.
 */
export function SunMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="tileGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0A57C2" />
          <stop offset="100%" stopColor="#002A73" />
        </linearGradient>
        <linearGradient id="sunGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#FFB020" />
        </linearGradient>
      </defs>

      {/* tile */}
      <rect x="1" y="1" width="46" height="46" rx="13" fill="url(#tileGrad)" />

      {/* raggi minimali */}
      <g stroke="url(#sunGrad)" strokeWidth="2" strokeLinecap="round" opacity="0.95">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4 - Math.PI / 2
          const r1 = 11.5
          const r2 = 15
          return (
            <line
              key={i}
              x1={24 + Math.cos(a) * r1}
              y1={24 + Math.sin(a) * r1}
              x2={24 + Math.cos(a) * r2}
              y2={24 + Math.sin(a) * r2}
            />
          )
        })}
      </g>

      {/* disco solare */}
      <circle cx="24" cy="24" r="7.5" fill="url(#sunGrad)" />
    </svg>
  )
}
