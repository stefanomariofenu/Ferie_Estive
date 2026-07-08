import ExcelJS from 'exceljs'
import type { AggregateResult } from './aggregate'
import {
  AUGUST_DAYS,
  TIPO_META,
  YEAR,
  weekdayLabel,
} from './august'

const RED_FILL = 'FFF8D0D0'
const HEADER_FILL = 'FF1D1D1F'

interface ExportOptions {
  expected: number
  threshold: number
}

/**
 * Genera e scarica un file .xlsx con 2 fogli:
 *   1) "Dashboard": KPI, tabella riassuntiva per giorno, grafico (immagine),
 *      giorni sotto soglia evidenziati in rosso.
 *   2) "Dettaglio": griglia dipendenti × giorni con celle colorate + totali.
 *
 * Nota: ExcelJS non supporta la scrittura di grafici NATIVI Excel, quindi il
 * grafico è un'immagine PNG renderizzata su canvas e incorporata nel foglio.
 * La tabella dati resta accanto, così si può ricreare un grafico nativo.
 */
export async function exportToExcel(
  agg: AggregateResult,
  opts: ExportOptions
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ferie Agosto'
  wb.created = new Date()

  buildDashboardSheet(wb, agg, opts)
  buildDetailSheet(wb, agg)

  const buffer = await wb.xlsx.writeBuffer()
  triggerDownload(buffer, `ferie-agosto-${YEAR}.xlsx`)
}

// ---------------------------------------------------------------------
// Foglio 1 — Dashboard
// ---------------------------------------------------------------------

function buildDashboardSheet(
  wb: ExcelJS.Workbook,
  agg: AggregateResult,
  { expected, threshold }: ExportOptions
) {
  const ws = wb.addWorksheet('Dashboard', {
    views: [{ showGridLines: false }],
  })

  const pct = expected > 0 ? Math.round((agg.respondedCount / expected) * 100) : 0

  // Titolo
  ws.mergeCells('A1:E1')
  const title = ws.getCell('A1')
  title.value = `Pianificazione ferie · Agosto ${YEAR}`
  title.font = { size: 16, bold: true, color: { argb: 'FF1D1D1F' } }
  ws.getRow(1).height = 26

  // KPI
  const kpi: [string, string | number][] = [
    ['Dipendenti attesi', expected],
    ['Hanno compilato il piano', agg.respondedCount],
    ['Percentuale di completamento', `${pct}%`],
    ['Soglia minima copertura', threshold],
    [
      'Giorni scoperti (sotto soglia)',
      agg.coverage.filter((c) => c.lavoro < threshold).length,
    ],
  ]
  let r = 3
  for (const [label, value] of kpi) {
    ws.getCell(`A${r}`).value = label
    ws.getCell(`A${r}`).font = { color: { argb: 'FF6E6E73' } }
    ws.getCell(`C${r}`).value = value
    ws.getCell(`C${r}`).font = { bold: true, size: 12 }
    r++
  }

  // Tabella riassuntiva per giorno
  const headerRow = r + 1
  ws.getCell(`A${headerRow}`).value = 'Riepilogo per giorno'
  ws.getCell(`A${headerRow}`).font = { bold: true, size: 13 }

  const tableHead = headerRow + 1
  const headers = [
    'Giorno',
    'Weekday',
    'Al lavoro',
    'Ferie bloccate',
    'Ferie flessibili',
    'Non compilato',
  ]
  headers.forEach((h, i) => {
    const cell = ws.getRow(tableHead).getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    }
    cell.alignment = { horizontal: 'center' }
  })

  agg.coverage.forEach((c, idx) => {
    const row = ws.getRow(tableHead + 1 + idx)
    row.getCell(1).value = `${c.day} ago`
    row.getCell(2).value = weekdayLabel(c.day)
    row.getCell(3).value = c.lavoro
    row.getCell(4).value = c.ferie_bloccate
    row.getCell(5).value = c.ferie_flessibili
    row.getCell(6).value = c.non_compilato
    row.alignment = { horizontal: 'center' }
    // Evidenzia in rosso i giorni sotto soglia
    if (c.lavoro < threshold) {
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: RED_FILL },
        }
      }
      row.getCell(3).font = { bold: true, color: { argb: 'FFC0392B' } }
    }
  })

  ws.columns = [
    { width: 12 },
    { width: 10 },
    { width: 12 },
    { width: 15 },
    { width: 16 },
    { width: 15 },
  ]

  // Grafico "al lavoro per giorno" come immagine incorporata.
  const png = renderCoverageChartPng(agg, threshold)
  if (png) {
    const imageId = wb.addImage({ base64: png, extension: 'png' })
    // Colonna H in poi, all'altezza dei KPI.
    ws.addImage(imageId, {
      tl: { col: 7, row: 2 },
      ext: { width: 560, height: 240 },
    })
    ws.getCell('H2').value = 'Persone al lavoro, giorno per giorno'
    ws.getCell('H2').font = { bold: true, size: 12 }
  }
}

// ---------------------------------------------------------------------
// Foglio 2 — Dettaglio
// ---------------------------------------------------------------------

function buildDetailSheet(wb: ExcelJS.Workbook, agg: AggregateResult) {
  const ws = wb.addWorksheet('Dettaglio', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }],
  })

  // Intestazione: Dipendente + giorni 1..31
  const head = ws.getRow(1)
  head.getCell(1).value = 'Dipendente'
  head.getCell(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  head.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: HEADER_FILL },
  }
  AUGUST_DAYS.forEach((day, i) => {
    const cell = head.getCell(i + 2)
    cell.value = day
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: 'center' }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: HEADER_FILL },
    }
  })

  // Righe dipendenti con celle colorate
  agg.plans.forEach((p, idx) => {
    const row = ws.getRow(idx + 2)
    row.getCell(1).value = `${p.user.cognome} ${p.user.nome}`
    AUGUST_DAYS.forEach((day, i) => {
      const cell = row.getCell(i + 2)
      const tipo = p.byDay[day]
      cell.alignment = { horizontal: 'center' }
      if (tipo) {
        const meta = TIPO_META[tipo]
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: meta.excelFill },
        }
        // Sigla: L / B / F
        cell.value =
          tipo === 'lavoro' ? 'L' : tipo === 'ferie_bloccate' ? 'B' : 'F'
        cell.font = { size: 9, color: { argb: 'FF6E6E73' } }
      }
    })
  })

  // Riga finale: conteggio "al lavoro" per giorno (verifica incrociata).
  const totalRowIdx = agg.plans.length + 2
  const totalRow = ws.getRow(totalRowIdx)
  totalRow.getCell(1).value = 'Al lavoro (tot)'
  totalRow.getCell(1).font = { bold: true }
  AUGUST_DAYS.forEach((day, i) => {
    const c = agg.coverage.find((x) => x.day === day)!
    const cell = totalRow.getCell(i + 2)
    cell.value = c.lavoro
    cell.font = { bold: true }
    cell.alignment = { horizontal: 'center' }
  })

  // Legenda
  const legendRow = totalRowIdx + 2
  ws.getCell(`A${legendRow}`).value =
    'Legenda: L = Lavoro · B = Ferie bloccate · F = Ferie flessibili'
  ws.getCell(`A${legendRow}`).font = { italic: true, color: { argb: 'FF6E6E73' } }

  ws.columns = [
    { width: 24 },
    ...AUGUST_DAYS.map(() => ({ width: 4 })),
  ]
}

// ---------------------------------------------------------------------
// Grafico → PNG (canvas). Ritorna una data URL base64 o null se il DOM
// non è disponibile (es. rendering server-side).
// ---------------------------------------------------------------------

function renderCoverageChartPng(
  agg: AggregateResult,
  threshold: number
): string | null {
  if (typeof document === 'undefined') return null
  const W = 1120
  const H = 480
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)

  const padL = 60
  const padR = 20
  const padT = 20
  const padB = 50
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const max = Math.max(1, ...agg.coverage.map((c) => c.lavoro))
  const n = agg.coverage.length
  const gap = 6
  const barW = (plotW - gap * (n - 1)) / n

  // Assi + gridlines
  ctx.strokeStyle = '#E5E5EA'
  ctx.fillStyle = '#6E6E73'
  ctx.font = '18px -apple-system, sans-serif'
  ctx.lineWidth = 1
  const ticks = 4
  for (let i = 0; i <= ticks; i++) {
    const val = Math.round((max / ticks) * i)
    const y = padT + plotH - (plotH * i) / ticks
    ctx.beginPath()
    ctx.moveTo(padL, y)
    ctx.lineTo(W - padR, y)
    ctx.stroke()
    ctx.fillText(String(val), 20, y + 6)
  }

  // Barre
  agg.coverage.forEach((c, i) => {
    const x = padL + i * (barW + gap)
    const h = (c.lavoro / max) * plotH
    const y = padT + plotH - h
    ctx.fillStyle = c.lavoro < threshold ? '#C9622A' : '#1E8E4E'
    ctx.fillRect(x, y, barW, h)
    // Etichette giorno (ogni 2 per non affollare)
    if (c.day % 2 === 1) {
      ctx.fillStyle = '#6E6E73'
      ctx.font = '16px -apple-system, sans-serif'
      ctx.fillText(String(c.day), x + barW / 2 - 6, H - padB + 24)
    }
  })

  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------

function triggerDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
