'use client'

import { useState } from 'react'
import { Eye, Download, Loader2, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'
import { DateRangePicker, type RangeData } from './DateRangePicker'
import { SheetPreviaPDF } from './SheetPreviaPDF'
import { startOfMonth, endOfMonth } from 'date-fns'
import { buscarDadosRelatorioNCs } from '@/actions/relatorios.actions'
import { toast } from 'sonner'
import ExcelJS from 'exceljs'

interface AbaNcsRelatorioProps {
  escolas: { id: string; nome: string }[]
}

const SEVERIDADE_COR: Record<string, string> = {
  CRITICA: '#DC2626',
  ALTA: '#DC2626',
  MEDIA: '#F59E0B',
  BAIXA: '#00963A',
}

export function AbaNcsRelatorio({ escolas }: AbaNcsRelatorioProps) {
  const agora = new Date()
  const [range, setRange] = useState<RangeData>({
    inicio: startOfMonth(agora).toISOString().split('T')[0],
    fim: endOfMonth(agora).toISOString().split('T')[0],
    label: 'Este mês',
  })
  const [sheetAberto, setSheetAberto] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [resumo, setResumo] = useState<Awaited<ReturnType<typeof buscarDadosRelatorioNCs>> | null>(null)
  const [baixandoExcel, setBaixandoExcel] = useState(false)

  async function carregarPrevia() {
    if (!range.inicio) return
    setCarregando(true)
    const dados = await buscarDadosRelatorioNCs({ inicio: range.inicio, fim: range.fim })
    setResumo(dados)
    setCarregando(false)
  }

  async function abrirPrevia() {
    setCarregando(true)
    const url = `/api/relatorios/pdf?tipo=ncs&inicio=${range.inicio}&fim=${range.fim}`
    // NCs usa o mesmo endpoint com tipo=inspecoes por enquanto, mas podemos passar como inspecoes
    // Para NCs, o PDF de inspeções também tem NCs. No futuro pode ter rota própria.
    const urlInsp = `/api/relatorios/pdf?tipo=inspecoes&inicio=${range.inicio}&fim=${range.fim}`
    const dlUrl = `/api/relatorios/pdf?tipo=inspecoes&inicio=${range.inicio}&fim=${range.fim}&download=true`
    setPdfUrl(urlInsp)
    setPdfDownloadUrl(dlUrl)
    setSheetAberto(true)
    setCarregando(false)
  }

  async function baixarExcelNCs() {
    if (!range.inicio) return
    setBaixandoExcel(true)
    try {
      const dados = await buscarDadosRelatorioNCs({ inicio: range.inicio, fim: range.fim })
      if (!dados) throw new Error('Dados não encontrados')

      const wb = new ExcelJS.Workbook()
      wb.creator = 'MerendaCheck'

      const ws = wb.addWorksheet('Não Conformidades')
      ws.columns = [
        { header: 'ID', key: 'id', width: 12 },
        { header: 'Escola', key: 'escola', width: 35 },
        { header: 'Checklist', key: 'checklistNome', width: 30 },
        { header: 'Título', key: 'titulo', width: 40 },
        { header: 'Severidade', key: 'severidade', width: 14 },
        { header: 'Status', key: 'status', width: 16 },
        { header: 'Prazo', key: 'prazo', width: 14 },
        { header: 'Data NC', key: 'criacao', width: 14 },
      ]

      const headerRow = ws.getRow(1)
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0E2E60' } }
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
        cell.alignment = { horizontal: 'center' }
      })
      headerRow.height = 22

      dados.ncs.forEach((nc, idx) => {
        const row = ws.addRow({
          id: nc.id.slice(0, 8).toUpperCase(),
          escola: nc.escola,
          checklistNome: nc.checklistNome,
          titulo: nc.titulo,
          severidade: nc.severidade,
          status: nc.status,
          prazo: nc.prazo ? nc.prazo.split('T')[0] : '—',
          criacao: nc.criacao.split('T')[0],
        })
        if (idx % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF4FD' } }
          })
        }
        const sevCell = row.getCell('severidade')
        const cor = SEVERIDADE_COR[nc.severidade] ?? '#5A7089'
        sevCell.font = { bold: true, color: { argb: `FF${cor.replace('#', '')}` } }
      })

      ws.autoFilter = { from: 'A1', to: 'H1' }

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `nao-conformidades-${range.inicio}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success('Excel de NCs baixado!')
    } catch {
      toast.error('Erro ao gerar Excel de NCs.')
    } finally {
      setBaixandoExcel(false)
    }
  }

  return (
    <>
      <div className="space-y-5">
        {/* Filtros */}
        <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
          <h3 className="text-sm font-semibold text-[#0F1B2D] font-heading mb-4">Relatório de Não Conformidades</h3>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-[#5A7089] block mb-1.5 font-medium">Período</label>
              <DateRangePicker value={range} onChange={(r) => { setRange(r); setResumo(null) }} />
            </div>
            <button
              onClick={carregarPrevia}
              disabled={carregando || !range.inicio}
              className="h-9 flex items-center gap-1.5 px-4 rounded-lg border border-[#D5E3F0] text-sm text-[#0E2E60] font-medium hover:bg-[#EEF4FD] transition-colors disabled:opacity-50"
            >
              {carregando ? <Loader2 size={14} className="animate-spin" /> : null}
              Carregar dados
            </button>
          </div>
        </div>

        {/* Resumo */}
        {resumo && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', valor: resumo.resumo.total, cor: 'text-[#0F1B2D]', icon: AlertTriangle },
              { label: 'Abertas', valor: resumo.resumo.abertas, cor: 'text-[#DC2626]', icon: AlertTriangle },
              { label: 'Resolvidas', valor: resumo.resumo.resolvidas, cor: 'text-[#00963A]', icon: CheckCircle2 },
              { label: 'Vencidas', valor: resumo.resumo.vencidas, cor: 'text-[#F59E0B]', icon: Clock },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
                <p className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider mb-1">{item.label}</p>
                <p className={`text-2xl font-bold font-heading ${item.cor}`}>{item.valor}</p>
              </div>
            ))}
          </div>
        )}

        {resumo && (
          <>
            {/* Por severidade */}
            {resumo.porSeveridade.length > 0 && (
              <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
                <h3 className="text-sm font-semibold text-[#0F1B2D] font-heading mb-3">Por severidade</h3>
                <div className="space-y-2">
                  {resumo.porSeveridade.map((item) => {
                    const taxa = item.total > 0 ? Math.round((item.resolvidas / item.total) * 100) : 0
                    const cor = SEVERIDADE_COR[item.severidade] ?? '#5A7089'
                    return (
                      <div key={item.severidade}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold" style={{ color: cor }}>{item.severidade}</span>
                          <span className="text-[#5A7089]">{item.resolvidas}/{item.total} resolvidas</span>
                        </div>
                        <div className="h-2 bg-[#EEF4FD] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${taxa}%`, backgroundColor: cor }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Exportar */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={baixarExcelNCs}
                disabled={baixandoExcel}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#00963A] text-white text-sm font-semibold hover:bg-[#007a2e] transition-colors disabled:opacity-50"
              >
                {baixandoExcel ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                {baixandoExcel ? 'Gerando...' : '↓ Excel de NCs'}
              </button>
              <a
                href={`/api/relatorios/pdf?tipo=inspecoes&inicio=${range.inicio}&fim=${range.fim}&download=true`}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D5E3F0] text-sm font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
              >
                <Download size={14} />
                PDF completo
              </a>
            </div>
          </>
        )}
      </div>

      <SheetPreviaPDF
        open={sheetAberto}
        onClose={() => setSheetAberto(false)}
        url={pdfUrl}
        downloadUrl={pdfDownloadUrl}
        titulo="Relatório de NCs"
      />
    </>
  )
}
