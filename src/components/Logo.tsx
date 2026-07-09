import { useState } from 'react'

/**
 * Logo KPMG come immagine (public/kpmg-logo.svg), con fallback automatico
 * alla scritta se il file non è presente. Basta sostituire il file col
 * logo ufficiale KPMG per vederlo ovunque.
 */
export function KpmgMark({
  variant = 'default',
  className = 'h-6',
}: {
  variant?: 'default' | 'white'
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const src = variant === 'white' ? '/kpmg-logo-white.svg' : '/kpmg-logo.svg'

  if (failed) {
    return (
      <span
        className={`font-bold tracking-tight ${
          variant === 'white' ? 'text-white' : 'text-accent'
        }`}
        style={{ fontSize: '19px' }}
      >
        KPMG
      </span>
    )
  }
  return (
    <img
      src={src}
      alt="KPMG"
      className={className}
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
