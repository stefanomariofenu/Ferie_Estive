/**
 * Wordmark testuale per l'header dell'app. Nessuna forma geometrica:
 * "KPMG" in stampatello + il nome del portale.
 */
export function Logo() {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="text-[19px] font-bold tracking-tight text-accent">
        KPMG
      </span>
      <span className="hidden text-[13px] font-medium text-subtle sm:inline">
        Ferie Estive 2026
      </span>
    </div>
  )
}
