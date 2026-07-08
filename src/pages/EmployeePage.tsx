import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CalendarEntry, Tipo } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  dateISO,
  dayFromISO,
  isSuggested,
  isWeekend,
  SUGGESTED_START,
  SUGGESTED_END,
  TIPO_ORDER,
  WORKING_DAYS,
} from '../lib/august'
import { Header } from '../components/Header'
import { SummaryBar } from '../components/SummaryBar'
import { CalendarGrid } from '../components/CalendarGrid'
import { SelectionBar } from '../components/SelectionBar'
import { CompletionOverlay } from '../components/CompletionOverlay'
import { Spinner } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'

export function EmployeePage() {
  const { session, profile } = useAuth()
  const userId = session!.user.id

  const [entries, setEntries] = useState<Record<number, CalendarEntry>>({})
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
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
    const map: Record<number, CalendarEntry> = {}
    for (const row of (data ?? []) as CalendarEntry[]) {
      map[dayFromISO(row.data)] = row
    }
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
    for (const day of Object.keys(entries)) {
      c[entries[Number(day)].tipo]++
    }
    return c
  }, [entries])

  const selectedDays = useMemo(() => [...selected].sort((a, b) => a - b), [selected])

  async function applyTipo(tipo: Tipo) {
    if (selectedDays.length === 0) return
    setSaving(true)
    setError('')
    const rows = selectedDays.map((day) => ({
      user_id: userId,
      data: dateISO(day),
      tipo,
      note: entries[day]?.note ?? null,
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

    // Il piano diventa "completo" ora? (tutti i giorni lavorativi coperti)
    const wasComplete = WORKING_DAYS.every((d) => entries[d])
    const markedAfter = new Set(Object.keys(entries).map(Number))
    selectedDays.forEach((d) => markedAfter.add(d))
    const nowComplete = WORKING_DAYS.every((d) => markedAfter.has(d))

    setEntries((prev) => {
      const next = { ...prev }
      for (const row of (data ?? []) as CalendarEntry[]) {
        next[dayFromISO(row.data)] = row
      }
      return next
    })
    setSelected(new Set())

    if (nowComplete && !wasComplete) {
      setCelebrate(true)
    }
  }

  async function clearSelected() {
    if (selectedDays.length === 0) return
    const toDelete = selectedDays.filter((d) => entries[d])
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
      .in(
        'data',
        toDelete.map((d) => dateISO(d))
      )

    setSaving(false)
    if (sbError) {
      setError('Cancellazione non riuscita. ' + sbError.message)
      return
    }
    setEntries((prev) => {
      const next = { ...prev }
      for (const d of toDelete) delete next[d]
      return next
    })
    setSelected(new Set())
  }

  function selectSuggested() {
    setSelected(
      new Set(WORKING_DAYS.filter((d) => isSuggested(d) && !isWeekend(d)))
    )
  }
  function selectAll() {
    setSelected(new Set(WORKING_DAYS))
  }

  const marked = TIPO_ORDER.reduce((s, t) => s + counts[t], 0)

  return (
    <div className="min-h-screen summer-bg">
      <Header />
      {celebrate && (
        <CompletionOverlay
          nome={profile?.nome || ''}
          onClose={() => setCelebrate(false)}
        />
      )}

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            Ciao {profile?.nome || ''} 👋
          </h1>
          <p className="mt-1 max-w-xl text-sm text-subtle">
            Seleziona i giorni — anche{' '}
            <span className="font-medium text-ink">trascinando</span> — e
            colorali in blocco. Il periodo {SUGGESTED_START}–{SUGGESTED_END} è
            quello caldamente consigliato da KPMG per le ferie.
          </p>
        </section>

        {loading ? (
          <Spinner label="Carico il tuo piano…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="space-y-5">
            <SummaryBar counts={counts} />

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-subtle">Azioni rapide:</span>
              <button onClick={selectSuggested} className="btn-ghost !bg-white !px-3 ring-1 ring-black/5">
                Seleziona 10–28
              </button>
              <button onClick={selectAll} className="btn-ghost !bg-white !px-3 ring-1 ring-black/5">
                Seleziona tutti i lavorativi
              </button>
              {marked > 0 && (
                <span className="ml-auto text-xs text-subtle">
                  {WORKING_DAYS.length - marked} giorni ancora da compilare
                </span>
              )}
            </div>

            <CalendarGrid
              entries={entries}
              selected={selected}
              onSelectionChange={setSelected}
            />
          </div>
        )}
      </main>

      <SelectionBar
        count={selected.size}
        saving={saving}
        onApply={applyTipo}
        onClearEntries={clearSelected}
        onDeselect={() => setSelected(new Set())}
      />
    </div>
  )
}
