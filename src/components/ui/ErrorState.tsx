export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="mx-auto my-10 max-w-md rounded-card border border-bloccate-fg/20 bg-bloccate-bg/50 p-6 text-center animate-fade-in">
      <p className="text-sm font-medium text-bloccate-fg">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost mt-3 mx-auto">
          Riprova
        </button>
      )}
    </div>
  )
}
