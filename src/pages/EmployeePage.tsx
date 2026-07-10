import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CalendarEntry, Tipo } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { WORKING_DAYS, SUGGESTED_LABEL, TIPO_ORDER } from '../lib/august'
import { Header } from '../components/Header'
import { SummaryBar } from '../components/SummaryBar'
import { CalendarGrid } from '../components/CalendarGrid'
import { SelectionBar } from '../components/SelectionBar'
import { CompletionOverlay } from '../components/CompletionOverlay'
import { Spinner } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'

function formatInviato(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('it-IT', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export function EmployeePage() {
  const { session, profile, refreshProfile } = useAuth()
  const userId = session!.user.id
  const inviato = profile?.inviato ?? false

  const [entries, setEntries] = useState<Record<string, CalendarEntry>>({})
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [nota, setNota] = useState(profile?.nota ?? '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [celebrate, setCelebrate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: sbError } = await supabase
      .from('calendar_entries')
      .select('*')
      .eq('user_id', userId)
    if (sbError) {
      setError('Impossibile caricare il tuo piano. ' + sbError.message)
      setLoading(false)
      return
    }
    const map: Record<string, CalendarEntry> = {}
    for (const row of (data ?? []) as CalendarEntry[]) map[row.data] = row
    setEntries(map)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const c: Record<Tipo, number> = {
      lavoro: 0,
      ferie_bloccate: 0,
      ferie_flessibili: 0,
    }
    for (const iso of Object.keys(entries)) c[entries[iso].tipo]++
    return c
  }, [entries])

  const selectedDays = useMemo(() => [...selected].sort(), [selected])

  async function applyTipo(tipo: Tipo) {
    if (selectedDays.length === 0) return
    setSaving(true)
    setError('')
    const rows = selectedDays.map((iso) => ({
      user_id: userId,
      data: iso,
      tipo,
      note: entries[iso]?.note ?? null,
    }))
    const { data, error: sbError } = await supabase
      .from('calendar_entries')
      .upsert(rows, { onConflict: 'user_id,data' })
      .select()
    setSaving(false)
    if (sbError) {
      setError('Salvataggio non riuscito. ' + sbError.message)
      return
    }
    setEntries((prev) => {
      const next = { ...prev }
      for (const row of (data ?? []) as CalendarEntry[]) next[row.data] = row
      return next
    })
    setSelected(new Set())
  }

  async function clearSelected() {
    if (selectedDays.length === 0) return
    const toDelete = selectedDays.filter((iso) => entries[iso])
    if (toDelete.length === 0) {
      setSelected(new Set())
      return
    }
    setSaving(true)
    setError('')
    const { error: sbError } = await supabase
      .from('calendar_entries')
      .delete()
      .eq('user_id', userId)
      .in('data', toDelete)
    setSaving(false)
    if (sbError) {
      setError('Cancellazione non riuscita. ' + sbError.message)
      return
    }
    setEntries((prev) => {
      const next = { ...prev }
      for (const iso of toDelete) delete next[iso]
      return next
    })
    setSelected(new Set())
  }

  function selectSuggested() {
    setSelected(new Set(WORKING_DAYS.filter((g) => g.suggested).map((g) => g.iso)))
  }
  function selectAll() {
    setSelected(new Set(WORKING_DAYS.map((g) => g.iso)))
  }

  // Riempie i soli giorni ancora vuoti come "Lavoro" (non tocca le ferie
  // già inserite): utile per completare in fretta e poter inviare.
  async function fillRestAsLavoro() {
    const rest = WORKING_DAYS.filter((g) => !entries[g.iso]).map((g) => g.iso)
    if (rest.length === 0) return
    setSaving(true)
    setError('')
    const rows = rest.map((iso) => ({
      user_id: userId,
      data: iso,
      tipo: 'lavoro' as Tipo,
      note: null,
    }))
    const { data, error: sbError } = await supabase
      .from('calendar_entries')
      .upsert(rows, { onConflict: 'user_id,data' })
      .select()
    setSaving(false)
    if (sbError) {
      setError('Salvataggio non riuscito. ' + sbError.message)
      return
    }
    setEntries((prev) => {
      const next = { ...prev }
      for (const row of (data ?? []) as CalendarEntry[]) next[row.data] = row
      return next
    })
  }

  // Invia il piano: da questo momento è quello che vede il team ed è in
  // sola lettura finché non viene ritirato.
  async function inviaPiano() {
    const markedNow = TIPO_ORDER.reduce((s, t) => s + counts[t], 0)
    const mancanti = WORKING_DAYS.length - markedNow
    if (mancanti > 0) {
      setError(
        `Per inviare il piano devi compilare tutte le date: ne mancano ${mancanti}.`
      )
      return
    }
    setSavingPlan(true)
    setError('')
    const { error: sbError } = await supabase
      .from('users')
      .update({
        nota: nota.trim() || null,
        inviato: true,
        inviato_at: new Date().toISOString(),
      })
      .eq('id', userId)
    setSavingPlan(false)
    if (sbError) {
      setError('Invio non riuscito. ' + sbError.message)
      return
    }
    setSelected(new Set())
    await refreshProfile()
    setCelebrate(true)
  }

  // Ritira l'invio: riapre il piano per la modifica. Esce dalla dashboard
  // finché non viene reinviato.
  async function ritiraInvio() {
    if (
      !window.confirm(
        'Vuoi ritirare l’invio e riaprire il piano per modificarlo? Fino al nuovo invio non comparirà nel riepilogo del team.'
      )
    )
      return
    setSavingPlan(true)
    setError('')
    const { error: sbError } = await supabase
      .from('users')
      .update({ inviato: false })
      .eq('id', userId)
    setSavingPlan(false)
    if (sbError) {
      setError('Operazione non riuscita. ' + sbError.message)
      return
    }
    await refreshProfile()
  }

  const marked = TIPO_ORDER.reduce((s, t) => s + counts[t], 0)
  const total = WORKING_DAYS.length
  const complete = marked >= total

  return (
    <div className="min-h-screen summer-bg">
      <Header />
      {celebrate && (
        <CompletionOverlay
          nome={profile?.nome || ''}
          onClose={() => setCelebrate(false)}
        />
      )}

      <main className="mx-auto max-w-4xl px-4 py-6 pb-28 sm:px-6 sm:py-8">
        <section className="mb-6">
          <h1 className="headline text-[30px] leading-tight sm:text-[38px]">
            Ciao, <em>{profile?.nome || 'benvenuto'}</em>.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-subtle">
            {inviato ? (
              <>
                Il tuo piano è{' '}
                <span className="font-medium text-ink">inviato</span> ed è in
                sola lettura: è quello che vede il team. Per modificarlo usa{' '}
                <span className="font-medium text-ink">Ritira invio</span> qui
                sotto.
              </>
            ) : (
              <>
                Seleziona i giorni, anche{' '}
                <span className="font-medium text-ink">trascinando</span>, e
                colorali in blocco. Si ricorda che le giornate dal{' '}
                <span className="font-medium text-ink">10 al 28 agosto</span>{' '}
                sono quelle in cui è caldamente consigliato da KPMG usufruire
                delle ferie.
              </>
            )}
          </p>
        </section>

        {loading ? (
          <Spinner label="Carico il tuo piano…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="lg:grid lg:grid-cols-[minmax(300px,340px)_1fr] lg:gap-6 lg:items-start">
            <aside className="space-y-4 lg:sticky lg:top-20">
              <SummaryBar counts={counts} variant="sidebar" />

              {!inviato && (
                <div className="card p-4">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-subtle">
                    Azioni rapide
                  </span>
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={selectSuggested}
                      className="btn-ghost w-full justify-center !bg-white ring-1 ring-black/5"
                    >
                      Seleziona {SUGGESTED_LABEL}
                    </button>
                    <button
                      onClick={selectAll}
                      className="btn-ghost w-full justify-center !bg-white ring-1 ring-black/5"
                    >
                      Seleziona tutti i lavorativi
                    </button>
                    {!complete && (
                      <button
                        onClick={fillRestAsLavoro}
                        disabled={saving}
                        className="btn-ghost w-full justify-center !bg-white ring-1 ring-black/5"
                        title="Riempie i giorni vuoti come Lavoro, senza toccare le ferie già inserite"
                      >
                        Segna i restanti come Lavoro
                      </button>
                    )}
                  </div>
                  {marked > 0 && !complete && (
                    <p className="mt-3 text-xs text-subtle">
                      {total - marked} giorni ancora da compilare
                    </p>
                  )}
                </div>
              )}
            </aside>

            <div className="mt-5 space-y-5 lg:mt-0">
            <CalendarGrid
              entries={entries}
              selected={selected}
              onSelectionChange={setSelected}
              locked={inviato}
            />

            {inviato ? (
              /* Piano inviato: riepilogo + ritiro */
              <div className="card p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                    ✓
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <p className="text-sm font-semibold text-ink">
                      Piano inviato
                    </p>
                    <p className="mt-1 text-xs text-subtle">
                      {profile?.inviato_at
                        ? `Inviato il ${formatInviato(profile.inviato_at)}. `
                        : ''}
                      È il piano che vede il team. Per modificarlo, ritira
                      l’invio: potrai ricompilarlo e reinviarlo.
                    </p>
                    {nota && (
                      <p className="mt-3 whitespace-pre-line text-sm text-ink">
                        <span className="font-medium">Nota:</span> {nota}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={ritiraInvio}
                    disabled={savingPlan}
                    className="btn-ghost ring-1 ring-black/10"
                  >
                    {savingPlan ? 'Attendi…' : 'Ritira invio'}
                  </button>
                </div>
              </div>
            ) : (
              /* Note + invio in fondo */
              <div className="card p-5">
                <label className="block text-sm font-semibold text-ink">
                  Note{' '}
                  <span className="font-normal text-subtle">(opzionale)</span>
                </label>
                <p className="mb-2 text-xs text-subtle">
                  Aggiungi indicazioni per il partner (es. reperibilità,
                  vincoli…).
                </p>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Scrivi qui una nota…"
                  className="w-full resize-none rounded-xl border border-black/10 bg-muted px-4 py-3 text-sm text-ink outline-none transition focus:border-cyan/60 focus:bg-surface"
                />
                <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                  <span
                    className={`text-xs ${complete ? 'text-subtle' : 'text-pink'}`}
                  >
                    {complete
                      ? `Tutti i ${total} giorni compilati`
                      : `Compila tutte le date per inviare — ne mancano ${total - marked}`}
                  </span>
                  <button
                    onClick={inviaPiano}
                    disabled={savingPlan || saving || !complete}
                    className="btn-primary"
                    title={
                      complete
                        ? undefined
                        : 'Compila tutte le date per inviare il piano'
                    }
                  >
                    {savingPlan ? 'Invio…' : 'Salva e invia piano'}
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}
      </main>

      {!inviato && (
        <SelectionBar
          count={selected.size}
          saving={saving}
          onApply={applyTipo}
          onClearEntries={clearSelected}
          onDeselect={() => setSelected(new Set())}
        />
      )}
    </div>
  )
}
