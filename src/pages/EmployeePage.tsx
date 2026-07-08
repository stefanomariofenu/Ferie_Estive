import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CalendarEntry, Tipo } from '../types'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { dateISO, dayFromISO, TIPO_ORDER } from '../lib/august'
import { Header } from '../components/Header'
import { SummaryBar } from '../components/SummaryBar'
import { CalendarGrid } from '../components/CalendarGrid'
import { DayModal } from '../components/DayModal'
import { Spinner } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'

export function EmployeePage() {
  const { session } = useAuth()
  const userId = session!.user.id

  const [entries, setEntries] = useState<Record<number, CalendarEntry>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDay, setOpenDay] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

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

  async function handleSave(tipo: Tipo, note: string) {
    if (openDay == null) return
    setSaving(true)
    const payload = {
      user_id: userId,
      data: dateISO(openDay),
      tipo,
      note: note || null,
    }
    const { data, error: sbError } = await supabase
      .from('calendar_entries')
      .upsert(payload, { onConflict: 'user_id,data' })
      .select()
      .single()

    setSaving(false)
    if (sbError) {
      setError('Salvataggio non riuscito. ' + sbError.message)
      return
    }
    setEntries((prev) => ({ ...prev, [openDay]: data as CalendarEntry }))
    setOpenDay(null)
  }

  async function handleDelete() {
    if (openDay == null) return
    const existing = entries[openDay]
    if (!existing) {
      setOpenDay(null)
      return
    }
    setSaving(true)
    const { error: sbError } = await supabase
      .from('calendar_entries')
      .delete()
      .eq('id', existing.id)

    setSaving(false)
    if (sbError) {
      setError('Cancellazione non riuscita. ' + sbError.message)
      return
    }
    setEntries((prev) => {
      const next = { ...prev }
      delete next[openDay]
      return next
    })
    setOpenDay(null)
  }

  const marked = TIPO_ORDER.reduce((s, t) => s + counts[t], 0)

  return (
    <div className="min-h-screen bg-canvas">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Il mio piano di agosto
          </h1>
          <p className="mt-1 text-sm text-subtle">
            Tocca un giorno per indicare se lavori o sei in ferie. Il periodo
            10–28 è quello consigliato da KPMG.
          </p>
        </div>

        {loading ? (
          <Spinner label="Carico il tuo piano…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="space-y-6">
            <SummaryBar counts={counts} />
            {marked < 5 && (
              <p className="rounded-2xl bg-accent/5 px-4 py-3 text-sm text-accent">
                Suggerimento: compila almeno i giorni consigliati (10–28 agosto)
                così il partner ha una fotografia completa della copertura.
              </p>
            )}
            <CalendarGrid entries={entries} onDayClick={setOpenDay} />
          </div>
        )}
      </main>

      {openDay != null && (
        <DayModal
          day={openDay}
          currentTipo={entries[openDay]?.tipo}
          currentNote={entries[openDay]?.note}
          saving={saving}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setOpenDay(null)}
        />
      )}
    </div>
  )
}
