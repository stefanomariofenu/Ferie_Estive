/**
 * Piccola emoji ☀️ che fluttua/cade — mostrata solo in modalità "Sereno".
 * Il rendering condizionale è a carico del chiamante (playful).
 */
export function SunEmoji() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden"
    >
      <span className="mt-0.5 animate-sun-fall text-sm">☀️</span>
    </span>
  )
}
