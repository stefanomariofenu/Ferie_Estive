import { useEffect } from 'react'
import { TIPO_META, TIPO_ORDER } from '../lib/august'

const SUPPORT_EMAIL = 'sfenu@kpmg.it'

/** Guida rapida su come compilare + contatto assistenza. */
export function HelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/25 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Guida"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-card bg-surface p-6 shadow-pop animate-scale-in sm:rounded-card"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="headline text-[24px]">
              Come <em>funziona</em>
            </h2>
            <p className="text-sm text-subtle">Compilare il piano in 3 passi.</p>
          </div>
          <button onClick={onClose} className="btn-ghost !px-2" aria-label="Chiudi">
            ✕
          </button>
        </div>

        <ol className="space-y-3">
          <Step n={1} title="Seleziona i giorni">
            Tocca un giorno, oppure <b>tieni premuto e trascina</b> per
            selezionarne più di uno insieme. Sabato e domenica sono chiusi e
            non si compilano.
          </Step>
          <Step n={2} title="Scegli la categoria">
            Nella barra in basso scegli come sarà la giornata. Puoi selezionare
            più giorni e colorarli tutti in un colpo solo.
          </Step>
          <Step n={3} title="Modifica quando vuoi">
            Per cambiare, riseleziona i giorni e applica un'altra categoria;
            con <b>Svuota</b> rimuovi la scelta. Il salvataggio è automatico.
          </Step>
        </ol>

        <div className="mt-5 space-y-2 rounded-2xl bg-muted p-4">
          <p className="text-sm font-medium text-ink">Le tre categorie</p>
          {TIPO_ORDER.map((t) => {
            const m = TIPO_META[t]
            return (
              <div key={t} className="flex items-start gap-2.5 text-sm">
                <span
                  className="mt-0.5 inline-flex h-5 shrink-0 items-center rounded-full px-2 text-xs font-semibold"
                  style={{ backgroundColor: m.bg, color: m.fg }}
                >
                  {m.emoji} {m.label}
                </span>
                <span className="text-subtle">{m.desc}</span>
              </div>
            )
          })}
          <p className="pt-1 text-xs text-subtle">
            Il periodo <b>10–28 agosto</b> è quello caldamente consigliato da
            KPMG per le ferie (evidenziato nel calendario).
          </p>
        </div>

        <div className="mt-4 rounded-2xl border border-accent/15 bg-accent/[0.04] p-4">
          <p className="text-sm font-medium text-ink">Problemi o errori?</p>
          <p className="mt-0.5 text-sm text-subtle">
            Scrivi a{' '}
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Assistenza Ferie Estive 2026`}
              className="font-semibold text-accent hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>{' '}
            e ti diamo una mano.
          </p>
        </div>

        <button onClick={onClose} className="btn-primary mt-5 w-full">
          Ho capito
        </button>
      </div>
    </div>
  )
}

function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="text-sm text-subtle">{children}</p>
      </div>
    </li>
  )
}
