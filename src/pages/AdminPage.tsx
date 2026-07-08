import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppUser, CalendarEntry } from '../types'
import { supabase } from '../lib/supabase'
import { buildAggregate } from '../lib/aggregate'
import {
  DEFAULT_COVERAGE_THRESHOLD,
  EXPECTED_HEADCOUNT,
} from '../lib/august'
import { Header } from '../components/Header'
import { AdminDashboard } from '../components/AdminDashboard'
import { AdminTable } from '../components/AdminTable'
import { Spinner } from '../components/ui/Spinner'
import { ErrorState } from '../components/ui/ErrorState'

export function AdminPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [entries, setEntries] = useState<CalendarEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [threshold, setThreshold] = useState(DEFAULT_COVERAGE_THRESHOLD)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')

    const [usersRes, entriesRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('calendar_entries').select('*'),
    ])

    if (usersRes.error || entriesRes.error) {
      setError(
        'Impossibile caricare i dati aggregati. ' +
          (usersRes.error?.message ?? entriesRes.error?.message ?? '')
      )
      setLoading(false)
      return
    }

    setUsers((usersRes.data ?? []) as AppUser[])
    setEntries((entriesRes.data ?? []) as CalendarEntry[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const agg = useMemo(() => buildAggregate(users, entries), [users, entries])
  const expected = EXPECTED_HEADCOUNT ?? agg.totalUsers

  async function handleExport() {
    setExporting(true)
    try {
      // Import dinamico: exceljs (pesante) viene scaricato solo al primo export.
      const { exportToExcel } = await import('../lib/excel')
      await exportToExcel(agg, { expected, threshold })
    } catch (e) {
      setError('Export non riuscito. ' + (e as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen summer-bg">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
              Dashboard del team
            </h1>
            <p className="mt-1 text-sm text-subtle">
              Piano consolidato di agosto 2026 · copertura giorno per giorno,
              giorni critici ed export.
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || loading}
            className="btn-primary"
          >
            {exporting ? 'Genero il file…' : '⬇ Esporta Excel'}
          </button>
        </div>

        {loading ? (
          <Spinner label="Carico i piani del team…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : (
          <div className="space-y-6">
            <AdminDashboard
              agg={agg}
              expected={expected}
              threshold={threshold}
              onThresholdChange={setThreshold}
            />
            <AdminTable agg={agg} />
          </div>
        )}
      </main>
    </div>
  )
}
