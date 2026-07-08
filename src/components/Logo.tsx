interface LogoProps {
  size?: 'sm' | 'lg'
}

/**
 * Logo tipografico "FERIE estive 2026" · KPMG PS & HC.
 * Gioco di contrasti: stampatello largo (Inter) + corsivo editoriale
 * (Fraunces) con gradiente solare. Nessuna icona: solo carattere.
 */
export function Logo({ size = 'sm' }: LogoProps) {
  const lg = size === 'lg'
  return (
    <div className="select-none leading-none">
      <div className="flex items-baseline">
        <span
          className={`font-extrabold uppercase tracking-[0.24em] text-ink ${
            lg ? 'text-[24px]' : 'text-[15px]'
          }`}
        >
          Ferie
        </span>
        <span
          className={`font-display italic font-medium sun-gradient ${
            lg ? 'ml-2 text-[34px]' : 'ml-1.5 text-[22px]'
          }`}
          style={{ letterSpacing: '-0.01em' }}
        >
          estive
        </span>
        <span
          className={`font-display font-light tabular-nums text-subtle ${
            lg ? 'ml-2 text-[22px]' : 'ml-1.5 text-[14px]'
          }`}
        >
          2026
        </span>
      </div>
      <div
        className={`font-semibold uppercase text-subtle ${
          lg
            ? 'mt-2 text-[10px] tracking-[0.42em]'
            : 'mt-1 text-[8px] tracking-[0.38em]'
        }`}
      >
        KPMG · PS &amp; HC
      </div>
    </div>
  )
}
