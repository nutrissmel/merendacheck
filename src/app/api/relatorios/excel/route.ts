import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'
import {
  buscarDadosRelatorioInspecoes,
} from '@/actions/relatorios.actions'
import { startOfMonth, endOfMonth } from 'date-fns'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

function formatarData(iso: string) {
  try { return format(new Date(iso), 'dd/MM/yyyy', { locale: ptBR }) } catch { return iso }
}

const AZUL = '0E2E60'
const AZUL_CLARO = 'EEF4FD'
const VERDE = '00963A'
const AMBER = 'F59E0B'
const VERMELHO = 'DC2626'
const CINZA = '5A7089'

function corScore(score: number | null | undefined): string {
  if (!score) return CINZA
  if (score >= 90) return VERDE
  if (score >= 70) return AMBER
  return VERMELHO
}

function aplicarCabecalho(ws: ExcelJS.Worksheet, cols: { header: string; key: string; width: number }[]) {
  ws.columns = cols
  const row = ws.getRow(1)
  row.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${AZUL}` } }
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 10 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
    }
  })
  row.height = 22
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Não autorizado', { status: 401 })

  const sp = request.nextUrl.searchParams
  const agora = new Date()
  const inicio = sp.get('inicio') ?? startOfMonth(agora).toISOString().split('T')[0]
  const fim = sp.get('fim') ?? endOfMonth(agora).toISOString().split('T')[0]
  const escolaId = sp.get('escolaId') ?? undefined

  const dados = await buscarDadosRelatorioInspecoes({ inicio, fim, escolaId })
  if (!dados) return new NextResponse('Dados não encontrados', { status: 404 })

  try {
    const wb = new ExcelJS.Workbook()
    wb.creator = 'MerendaCheck'
    wb.created = new Date()

    // ── ABA 1: Resumo ──────────────────────────────────────────
    const wsResumo = wb.addWorksheet('Resumo', {
      properties: { tabColor: { argb: `FF${AZUL}` } },
    })

    wsResumo.mergeCells('A1:D1')
    const tituloCell = wsResumo.getCell('A1')
    tituloCell.value = `Relatório de Conformidade — ${dados.tenant.nome}`
    tituloCell.font = { bold: true, size: 14, color: { argb: `FF${AZUL}` } }
    tituloCell.alignment = { horizontal: 'center', vertical: 'middle' }
    wsResumo.getRow(1).height = 28

    wsResumo.mergeCells('A2:D2')
    wsResumo.getCell('A2').value = `Período: ${formatarData(inicio)} a ${formatarData(fim)}`
    wsResumo.getCell('A2').font = { size: 10, color: { argb: `FF${CINZA}` } }
    wsResumo.getCell('A2').alignment = { horizontal: 'center' }

    wsResumo.addRow([])

    // KPIs
    const kpiData = [
      ['Total de Inspeções', dados.resumo.totalInspecoes, '', ''],
      ['Escolas Inspecionadas', dados.resumo.totalEscolas, '', ''],
      ['Score Médio', `${dados.resumo.scoreMedio}%`, '', ''],
      ['NCs Abertas', dados.resumo.totalNCs, '', ''],
      ['NCs Resolvidas', dados.resumo.ncsResolvidas, '', ''],
      ['Conformidade', `${dados.resumo.conformidade}%`, '', ''],
    ]

    wsResumo.getCell('A4').value = 'INDICADOR'
    wsResumo.getCell('B4').value = 'VALOR'
    ;['A4', 'B4'].forEach((addr) => {
      const c = wsResumo.getCell(addr)
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${AZUL}` } }
      c.font = { color: { argb: 'FFFFFFFF' }, bold: true }
      c.alignment = { horizontal: 'center' }
    })

    kpiData.forEach(([label, valor], idx) => {
      const row = wsResumo.addRow([label, valor])
      if (idx % 2 === 0) {
        row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${AZUL_CLARO}` } }
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${AZUL_CLARO}` } }
      }
      row.getCell(2).alignment = { horizontal: 'center' }
      row.getCell(2).font = { bold: true }
    })

    wsResumo.columns = [
      { key: 'a', width: 30 },
      { key: 'b', width: 20 },
      { key: 'c', width: 20 },
      { key: 'd', width: 20 },
    ]

    // ── ABA 2: Inspeções ──────────────────────────────────────
    const wsInsp = wb.addWorksheet('Inspeções', {
      properties: { tabColor: { argb: 'FF133878' } },
    })

    aplicarCabecalho(wsInsp, [
      { header: 'Escola', key: 'escola', width: 35 },
      { header: 'Checklist', key: 'checklist', width: 30 },
      { header: 'Inspetor', key: 'inspetor', width: 25 },
      { header: 'Data', key: 'data', width: 14 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Status', key: 'status', width: 16 },
      { header: 'NCs', key: 'totalNCs', width: 8 },
    ])

    dados.inspecoes.forEach((insp, idx) => {
      const row = wsInsp.addRow({
        escola: insp.escola,
        checklist: insp.checklist,
        inspetor: insp.inspetor,
        data: insp.data ? formatarData(insp.data) : '—',
        score: insp.score != null ? `${insp.score}%` : '—',
        status: insp.status,
        totalNCs: insp.totalNCs,
      })

      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${AZUL_CLARO}` } }
        })
      }

      // Colorir score
      const scoreCell = row.getCell('score')
      scoreCell.font = { bold: true, color: { argb: `FF${corScore(insp.score)}` } }
      scoreCell.alignment = { horizontal: 'center' }

      // Colorir NCs
      if (insp.totalNCs > 0) {
        row.getCell('totalNCs').font = { bold: true, color: { argb: `FF${VERMELHO}` } }
      }
      row.getCell('totalNCs').alignment = { horizontal: 'center' }
    })

    // Auto-filtro
    wsInsp.autoFilter = { from: 'A1', to: 'G1' }

    // ── ABA 3: Por Escola ─────────────────────────────────────
    const wsEscola = wb.addWorksheet('Por Escola', {
      properties: { tabColor: { argb: 'FF00963A' } },
    })

    aplicarCabecalho(wsEscola, [
      { header: 'Escola', key: 'nome', width: 40 },
      { header: 'Inspeções', key: 'totalInspecoes', width: 14 },
      { header: 'Score Médio', key: 'scoreMedio', width: 14 },
      { header: 'NCs Abertas', key: 'ncsAbertas', width: 14 },
      { header: 'Situação', key: 'situacao', width: 18 },
    ])

    dados.porEscola.forEach((escola, idx) => {
      const situacao = escola.scoreMedio >= 90 ? 'CONFORME'
        : escola.scoreMedio >= 70 ? 'ATENÇÃO'
        : escola.scoreMedio > 0 ? 'NÃO CONFORME'
        : 'SEM DADOS'

      const row = wsEscola.addRow({
        nome: escola.nome,
        totalInspecoes: escola.totalInspecoes,
        scoreMedio: `${escola.scoreMedio}%`,
        ncsAbertas: escola.ncsAbertas,
        situacao,
      })

      if (idx % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${AZUL_CLARO}` } }
        })
      }

      const scoreCell = row.getCell('scoreMedio')
      scoreCell.font = { bold: true, color: { argb: `FF${corScore(escola.scoreMedio)}` } }
      scoreCell.alignment = { horizontal: 'center' }

      row.getCell('totalInspecoes').alignment = { horizontal: 'center' }
      row.getCell('ncsAbertas').alignment = { horizontal: 'center' }

      const situacaoCell = row.getCell('situacao')
      situacaoCell.alignment = { horizontal: 'center' }
      situacaoCell.font = {
        bold: true,
        color: {
          argb: `FF${situacao === 'CONFORME' ? VERDE : situacao === 'ATENÇÃO' ? AMBER : situacao === 'NÃO CONFORME' ? VERMELHO : CINZA}`,
        },
      }
    })

    wsEscola.autoFilter = { from: 'A1', to: 'E1' }

    // Gerar buffer
    const buffer = await wb.xlsx.writeBuffer()
    const filename = `relatorio-inspecoes-${inicio}-a-${fim}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('[Excel Route Error]', err)
    return new NextResponse('Erro ao gerar Excel', { status: 500 })
  }
}
