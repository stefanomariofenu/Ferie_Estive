import { useState } from 'react'

// Un unico file: il logo KPMG BIANCO in public/kpmg-logo.png.
// Sfondo scuro (login) -> bianco; sfondo chiaro (header) -> reso scuro via CSS.
const LOGO_SRC = '/kpmg-logo.png'

/**
 * Logo KPMG come immagine, con fallback automatico alla scritta se il file
 * non è presente. Basta salvare il logo ufficiale in public/kpmg-logo.png.
 */
export function KpmgMark({
  variant = 'default',
  className = 'h-6 w-auto',
}: {
  variant?: 'default' | 'white'
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={`text-[19px] font-bold tracking-tight ${
          variant === 'white' ? 'text-white' : 'text-accent'
        }`}
      >
        KPMG
      </span>
    )
  }
  return (
    <img
      src={LOGO_SRC}
      alt="KPMG"
      className={className}
      // Nell'header (sfondo chiaro) il logo bianco viene reso scuro.
      style={variant === 'default' ? { filter: 'brightness(0)' } : undefined}
      onError={() => setFailed(true)}
    />
  )
}

/** Marchio + nome del portale per l'header dell'app. */
export function Logo() {
  return (
    <div className="flex items-baseline gap-2.5">
      <KpmgMark className="h-[22px] w-auto" />
      <span className="hidden text-[13px] font-medium text-subtle sm:inline">
        Ferie Estive 2026
      </span>
    </div>
  )
}
