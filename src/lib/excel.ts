import ExcelJS from 'exceljs'
import type { AggregateResult } from './aggregate'
import {
  AUGUST_DAYS,
  TIPO_META,
  YEAR,
  isWeekend,
  weekdayLabel,
} from './august'

const RED_FILL = 'FFF8D0D0'
const HEADER_FILL = 'FF00338D' // Blu KPMG ufficiale
const WEEKEND_FILL = 'FFF0F0F2'
const THIN = { style: 'thin' as const, color: { argb: 'FFE5E5EA' } }
const ALL_BORDERS = { top: THIN, left: THIN, bottom: THIN, right: THIN }

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
  ws.mergeCells('A1:F1')
  const title = ws.getCell('A1')
  title.value = `Ferie Estive ${YEAR} · KPMG PS & HC`
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
      agg.coverage.filter((c) => !c.closed && c.lavoro < threshold).length,
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
    row.alignment = { horizontal: 'center' }

    if (c.closed) {
      // Weekend: ufficio chiuso, non conteggiato.
      ws.mergeCells(
        `C${tableHead + 1 + idx}:F${tableHead + 1 + idx}`
      )
      row.getCell(3).value = 'Chiuso (weekend)'
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: WEEKEND_FILL },
        }
        row.getCell(col).font = { color: { argb: 'FF9A9AA0' }, italic: true }
      }
      return
    }

    row.getCell(3).value = c.lavoro
    row.getCell(4).value = c.ferie_bloccate
    row.getCell(5).value = c.ferie_flessibili
    row.getCell(6).value = c.non_compilato
    // Evidenzia in rosso i giorni lavorativi sotto soglia
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
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }],
  })

  const totCol = AUGUST_DAYS.length + 2 // colonna "Ferie (tot)"
  const DATA_START = 3 // le prime 2 righe sono intestazione (numero + weekday)

  // Riga 1: numero del giorno · Riga 2: giorno della settimana (Lun..Dom)
  const r1 = ws.getRow(1)
  const r2 = ws.getRow(2)
  r1.height = 18
  r2.height = 16

  // Colonna "Dipendente" e "Ferie tot" occupano entrambe le righe di header.
  ws.mergeCells(1, 1, 2, 1)
  ws.mergeCells(1, totCol, 2, totCol)
  ws.getCell(1, 1).value = 'Dipendente'
  ws.getCell(1, totCol).value = 'Ferie tot'

  AUGUST_DAYS.forEach((day, i) => {
    const col = i + 2
    const weekend = isWeekend(day)
    const numCell = r1.getCell(col)
    const wdCell = r2.getCell(col)
    numCell.value = day
    wdCell.value = weekdayLabel(day) // Lun, Mar, ...
    for (const cell of [numCell, wdCell]) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: weekend ? 'FF7A8AA8' : HEADER_FILL },
      }
      cell.border = ALL_BORDERS
    }
    numCell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    wdCell.font = { size: 9, color: { argb: 'FFD6DEEC' } }
  })

  for (const cell of [ws.getCell(1, 1), ws.getCell(1, totCol)]) {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = {
      horizontal: cell === ws.getCell(1, 1) ? 'left' : 'center',
      vertical: 'middle',
    }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.border = ALL_BORDERS
  }

  // Righe dipendenti con celle colorate. Nome esteso: "Cognome Nome/i".
  agg.plans.forEach((p, idx) => {
    const row = ws.getRow(idx + DATA_START)
    row.getCell(1).value = `${p.user.cognome} ${p.user.nome}`
    if (!p.hasResponded) {
      row.getCell(1).font = { color: { argb: 'FFC0392B' }, italic: true }
    }
    let ferieTot = 0
    AUGUST_DAYS.forEach((day, i) => {
      const cell = row.getCell(i + 2)
      cell.alignment = { horizontal: 'center' }
      cell.border = ALL_BORDERS
      if (isWeekend(day)) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WEEKEND_FILL } }
        return
      }
      const tipo = p.byDay[day]
      if (tipo) {
        const meta = TIPO_META[tipo]
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: meta.excelFill } }
        cell.value = meta.short
        cell.font = { size: 9, color: { argb: 'FF6E6E73' } }
        if (tipo !== 'lavoro') ferieTot++
      }
    })
    const tc = row.getCell(totCol)
    tc.value = ferieTot
    tc.alignment = { horizontal: 'center' }
    tc.font = { bold: true }
    tc.border = ALL_BORDERS
  })

  // Riga finale: conteggio "al lavoro" per giorno (verifica incrociata).
  const totalRowIdx = agg.plans.length + DATA_START
  const totalRow = ws.getRow(totalRowIdx)
  totalRow.getCell(1).value = 'Al lavoro (tot)'
  totalRow.getCell(1).font = { bold: true }
  totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF2F7' } }
  AUGUST_DAYS.forEach((day, i) => {
    const c = agg.coverage.find((x) => x.day === day)!
    const cell = totalRow.getCell(i + 2)
    cell.value = c.closed ? '—' : c.lavoro
    cell.font = { bold: true, color: { argb: c.closed ? 'FFB0B0B5' : 'FF1D1D1F' } }
    cell.alignment = { horizontal: 'center' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF2F7' } }
    cell.border = ALL_BORDERS
  })

  // Legenda colorata in basso
  const legendRow = totalRowIdx + 2
  ws.getCell(`A${legendRow}`).value = 'Legenda:'
  ws.getCell(`A${legendRow}`).font = { bold: true, color: { argb: 'FF6E6E73' } }
  ;[
    ['lavoro', 'L — Lavoro'],
    ['ferie_bloccate', 'B — Ferie bloccate'],
    ['ferie_flessibili', 'F — Ferie flessibili'],
  ].forEach(([tipo, label], i) => {
    const r = legendRow + 1 + i
    const swatch = ws.getCell(`A${r}`)
    swatch.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: TIPO_META[tipo as keyof typeof TIPO_META].excelFill },
    }
    swatch.border = ALL_BORDERS
    ws.getCell(`B${r}`).value = label
    ws.getCell(`B${r}`).font = { color: { argb: 'FF6E6E73' } }
  })
  const wr = legendRow + 4
  ws.getCell(`A${wr}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WEEKEND_FILL } }
  ws.getCell(`A${wr}`).border = ALL_BORDERS
  ws.getCell(`B${wr}`).value = 'Weekend — ufficio chiuso'
  ws.getCell(`B${wr}`).font = { color: { argb: 'FF6E6E73' } }

  ws.columns = [
    { width: 26 },
    ...AUGUST_DAYS.map(() => ({ width: 4 })),
    { width: 10 },
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
  // Solo giorni lavorativi: i weekend (ufficio chiuso) non entrano nel grafico.
  const work = agg.coverage.filter((c) => !c.closed)
  const max = Math.max(1, ...work.map((c) => c.lavoro))
  const n = work.length
  const gap = 8
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

  // Barre (solo giorni lavorativi)
  work.forEach((c, i) => {
    const x = padL + i * (barW + gap)
    const h = (c.lavoro / max) * plotH
    const y = padT + plotH - h
    ctx.fillStyle = c.lavoro < threshold ? '#FF9500' : '#34C759'
    ctx.fillRect(x, y, barW, h)
    ctx.fillStyle = '#6E6E73'
    ctx.font = '15px -apple-system, sans-serif'
    ctx.fillText(String(c.day), x + barW / 2 - 7, H - padB + 24)
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
