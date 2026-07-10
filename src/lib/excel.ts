import ExcelJS from 'exceljs'
import type { AggregateResult } from './aggregate'
import { DAYS, TIPO_META, PERIOD_LABEL } from './august'

const RED_FILL = 'FFF8D0D0'
const HEADER_FILL = 'FF00338D' // Blu KPMG ufficiale
const WEEKEND_FILL = 'FFF0F0F2'
const THIN = { style: 'thin' as const, color: { argb: 'FFE5E5EA' } }
const ALL_BORDERS = { top: THIN, left: THIN, bottom: THIN, right: THIN }

interface ExportOptions {
  expected: number
  threshold: number
}

function nowLabel(): string {
  return new Date().toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function exportToExcel(
  agg: AggregateResult,
  opts: ExportOptions
): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ferie Estive 2026'
  wb.created = new Date()

  buildDashboardSheet(wb, agg, opts)
  buildDetailSheet(wb, agg)

  const buffer = await wb.xlsx.writeBuffer()
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  triggerDownload(buffer, `ferie-estive-2026_${stamp}.xlsx`)
}

// ---------------------------------------------------------------------
// Foglio 1 — Dashboard
// ---------------------------------------------------------------------

function buildDashboardSheet(
  wb: ExcelJS.Workbook,
  agg: AggregateResult,
  { expected, threshold }: ExportOptions
) {
  const ws = wb.addWorksheet('Dashboard', { views: [{ showGridLines: false }] })
  const pct = expected > 0 ? Math.round((agg.respondedCount / expected) * 100) : 0

  ws.mergeCells('A1:F1')
  const title = ws.getCell('A1')
  title.value = `Ferie Estive 2026 · KPMG PS & HC`
  title.font = { size: 16, bold: true, color: { argb: 'FF00338D' } }
  ws.getRow(1).height = 26

  ws.mergeCells('A2:F2')
  ws.getCell('A2').value = `Periodo ${PERIOD_LABEL} · Estratto il ${nowLabel()}`
  ws.getCell('A2').font = { italic: true, color: { argb: 'FF6E6E73' } }

  const kpi: [string, string | number][] = [
    ['Persone attese', expected],
    ['Hanno inviato il piano', agg.respondedCount],
    ['Non hanno ancora inviato', expected - agg.respondedCount],
    ['Percentuale di completamento', `${pct}%`],
    ['Soglia minima copertura', threshold],
    [
      'Giorni scoperti (sotto soglia)',
      agg.coverage.filter((c) => !c.weekend && c.lavoro < threshold).length,
    ],
  ]
  let r = 4
  for (const [label, value] of kpi) {
    ws.getCell(`A${r}`).value = label
    ws.getCell(`A${r}`).font = { color: { argb: 'FF6E6E73' } }
    ws.getCell(`C${r}`).value = value
    ws.getCell(`C${r}`).font = { bold: true, size: 12 }
    r++
  }

  const headerRow = r + 1
  ws.getCell(`A${headerRow}`).value = 'Riepilogo per giorno'
  ws.getCell(`A${headerRow}`).font = { bold: true, size: 13 }

  const tableHead = headerRow + 1
  const headers = ['Giorno', 'Giorno sett.', 'Al lavoro', 'Ferie bloccate', 'Ferie flessibili', 'Non compilato']
  headers.forEach((h, i) => {
    const cell = ws.getRow(tableHead).getCell(i + 1)
    cell.value = h
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { horizontal: 'center' }
  })

  agg.coverage.forEach((c, idx) => {
    const rowIdx = tableHead + 1 + idx
    const row = ws.getRow(rowIdx)
    row.getCell(1).value = `${c.dom} ${c.monthShort.toLowerCase()}`
    row.getCell(2).value = c.wLabel
    row.alignment = { horizontal: 'center' }

    if (c.weekend) {
      ws.mergeCells(`C${rowIdx}:F${rowIdx}`)
      row.getCell(3).value = 'Chiuso (weekend)'
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WEEKEND_FILL } }
        row.getCell(col).font = { color: { argb: 'FF9A9AA0' }, italic: true }
      }
      return
    }
    row.getCell(3).value = c.lavoro
    row.getCell(4).value = c.ferie_bloccate
    row.getCell(5).value = c.ferie_flessibili
    row.getCell(6).value = c.non_compilato
    if (c.lavoro < threshold) {
      for (let col = 1; col <= 6; col++) {
        row.getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: RED_FILL } }
      }
      row.getCell(3).font = { bold: true, color: { argb: 'FFC0392B' } }
    }
  })

  ws.columns = [{ width: 12 }, { width: 12 }, { width: 12 }, { width: 15 }, { width: 16 }, { width: 15 }]

  const png = renderCoverageChartPng(agg, threshold)
  if (png) {
    const imageId = wb.addImage({ base64: png, extension: 'png' })
    ws.addImage(imageId, { tl: { col: 7, row: 3 }, ext: { width: 620, height: 250 } })
    ws.getCell('H3').value = 'Persone al lavoro, giorno per giorno'
    ws.getCell('H3').font = { bold: true, size: 12 }
  }
}

// ---------------------------------------------------------------------
// Foglio 2 — Dettaglio
// ---------------------------------------------------------------------

function buildDetailSheet(wb: ExcelJS.Workbook, agg: AggregateResult) {
  const ws = wb.addWorksheet('Dettaglio', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 2 }],
  })

  const nDays = DAYS.length
  const ferieCol = nDays + 2 // "Ferie tot"
  const noteCol = nDays + 3 // "Note"
  const DATA_START = 3

  const r1 = ws.getRow(1)
  const r2 = ws.getRow(2)
  r1.height = 18
  r2.height = 16

  ws.mergeCells(1, 1, 2, 1)
  ws.mergeCells(1, ferieCol, 2, ferieCol)
  ws.mergeCells(1, noteCol, 2, noteCol)
  ws.getCell(1, 1).value = 'Dipendente'
  ws.getCell(1, ferieCol).value = 'Ferie tot'
  ws.getCell(1, noteCol).value = 'Note'

  DAYS.forEach((g, i) => {
    const col = i + 2
    const numCell = r1.getCell(col)
    const wdCell = r2.getCell(col)
    numCell.value = g.dom
    wdCell.value = g.wLabel
    for (const cell of [numCell, wdCell]) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: g.weekend ? 'FF7A8AA8' : HEADER_FILL },
      }
      cell.border = ALL_BORDERS
    }
    numCell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    wdCell.font = { size: 9, color: { argb: 'FFD6DEEC' } }
  })

  for (const cell of [ws.getCell(1, 1), ws.getCell(1, ferieCol), ws.getCell(1, noteCol)]) {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.alignment = { horizontal: cell === ws.getCell(1, 1) || cell === ws.getCell(1, noteCol) ? 'left' : 'center', vertical: 'middle' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.border = ALL_BORDERS
  }

  agg.plans.forEach((p, idx) => {
    const row = ws.getRow(idx + DATA_START)
    row.getCell(1).value = `${p.user.cognome} ${p.user.nome}`.trim()
    if (!p.hasResponded) {
      row.getCell(1).font = { color: { argb: 'FFC0392B' }, italic: true }
    }
    let ferieTot = 0
    DAYS.forEach((g, i) => {
      const cell = row.getCell(i + 2)
      cell.alignment = { horizontal: 'center' }
      cell.border = ALL_BORDERS
      if (g.weekend) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: WEEKEND_FILL } }
        return
      }
      const tipo = p.byDay[g.iso]
      if (tipo) {
        const meta = TIPO_META[tipo]
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: meta.excelFill } }
        cell.value = meta.short
        cell.font = { size: 9, color: { argb: 'FF6E6E73' } }
        if (tipo !== 'lavoro') ferieTot++
      }
    })
    const tc = row.getCell(ferieCol)
    tc.value = p.hasResponded ? ferieTot : ''
    tc.alignment = { horizontal: 'center' }
    tc.font = { bold: true }
    tc.border = ALL_BORDERS
    const nc = row.getCell(noteCol)
    nc.value = p.nota ?? ''
    nc.alignment = { horizontal: 'left', wrapText: true }
    nc.border = ALL_BORDERS
  })

  // Riga finale: conteggio "al lavoro" per giorno.
  const totalRowIdx = agg.plans.length + DATA_START
  const totalRow = ws.getRow(totalRowIdx)
  totalRow.getCell(1).value = 'Al lavoro (tot)'
  totalRow.getCell(1).font = { bold: true }
  totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF2F7' } }
  DAYS.forEach((g, i) => {
    const c = agg.coverage.find((x) => x.iso === g.iso)!
    const cell = totalRow.getCell(i + 2)
    cell.value = g.weekend ? '—' : c.lavoro
    cell.font = { bold: true, color: { argb: g.weekend ? 'FFB0B0B5' : 'FF1D1D1F' } }
    cell.alignment = { horizontal: 'center' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF2F7' } }
    cell.border = ALL_BORDERS
  })

  // Legenda
  const legendRow = totalRowIdx + 2
  ws.getCell(`A${legendRow}`).value = 'Legenda:'
  ws.getCell(`A${legendRow}`).font = { bold: true, color: { argb: 'FF6E6E73' } }
  ;[
    ['lavoro', 'L — Lavoro'],
    ['ferie_bloccate', 'B — Ferie bloccate'],
    ['ferie_flessibili', 'F — Ferie flessibili'],
  ].forEach(([tipo, label], i) => {
    const rr = legendRow + 1 + i
    const swatch = ws.getCell(`A${rr}`)
    swatch.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: TIPO_META[tipo as keyof typeof TIPO_META].excelFill },
    }
    swatch.border = ALL_BORDERS
    ws.getCell(`B${rr}`).value = label
    ws.getCell(`B${rr}`).font = { color: { argb: 'FF6E6E73' } }
  })

  ws.columns = [
    { width: 26 },
    ...DAYS.map(() => ({ width: 3.6 })),
    { width: 9 },
    { width: 30 },
  ]
}

// ---------------------------------------------------------------------
// Grafico → PNG (canvas)
// ---------------------------------------------------------------------

function renderCoverageChartPng(agg: AggregateResult, threshold: number): string | null {
  if (typeof document === 'undefined') return null
  const W = 1240
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
  const work = agg.coverage.filter((c) => !c.weekend)
  const max = Math.max(1, ...work.map((c) => c.lavoro))
  const n = work.length
  const gap = 8
  const barW = (plotW - gap * (n - 1)) / n

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

  work.forEach((c, i) => {
    const x = padL + i * (barW + gap)
    const h = (c.lavoro / max) * plotH
    const y = padT + plotH - h
    ctx.fillStyle = c.lavoro < threshold ? '#C6007E' : '#005EB8'
    ctx.fillRect(x, y, barW, h)
    ctx.fillStyle = '#6E6E73'
    ctx.font = '14px -apple-system, sans-serif'
    ctx.fillText(String(c.dom), x + barW / 2 - 7, H - padB + 24)
  })

  return canvas.toDataURL('image/png')
}

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
