'use client'

import { useState } from 'react'
import {
  Eye, Download, FileSpreadsheet, Loader2,
  FileText, CheckCircle2, School, TrendingUp,
  AlertCircle, List, BarChart2, ArrowRight,
} from 'lucide-react'
import { DateRangePicker, type RangeData } from './DateRangePicker'
import { SheetPreviaPDF } from './SheetPreviaPDF'
import { startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Escola {
  id: string
  nome: string
}

interface KpisMes {
  totalInspecoes: number
  totalEscolas: number
  scoreMedio: number
  totalNCs: number
  ncsResolvidas: number
  conformidade: number
}

interface Props {
  escolas: Escola[]
  kpisMes?: KpisMes | null
}

const PDF_CONTEUDO = [
  { icon: FileText,    texto: 'Capa com identificação do município e período' },
  { icon: BarChart2,   texto: 'Painel de KPIs: score médio, NCs e conformidade' },
  { icon: School,      texto: 'Tabela de desempenho por escola' },
  { icon: List,        texto: 'Lista detalhada de todas as inspeções' },
]

const EXCEL_CONTEUDO = [
  { icon: CheckCircle2, texto: 'Aba Resumo — KPIs consolidados do período' },
  { icon: List,         texto: 'Aba Inspeções — dados individuais com filtros' },
  { icon: School,       texto: 'Aba Por Escola — médias e NCs por unidade' },
]

export function AbaInspecoesRelatorio({ escolas, kpisMes }: Props) {
  const agora = new Date()
  const [range, setRange] = useState<RangeData>({
    inicio: startOfMonth(agora).toISOString().split('T')[0],
    fim: endOfMonth(agora).toISOString().split('T')[0],
    label: 'Este mês',
  })
  const [escolaId, setEscolaId] = useState('')
  const [sheetAberto, setSheetAberto] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null)
  const [baixandoExcel, setBaixandoExcel] = useState(false)
  const [carregandoPdf, setCarregandoPdf] = useState(false)

  function buildParams(extra?: Record<string, string>) {
    const p = new URLSearchParams({
      inicio: range.inicio,
      fim: range.fim,
      ...(escolaId ? { escolaId } : {}),
      ...extra,
    })
    return p.toString()
  }

  async function abrirPrevia() {
    setCarregandoPdf(true)
    const url = `/api/relatorios/pdf?${buildParams({ tipo: 'inspecoes' })}`
    const downloadUrl = `/api/relatorios/pdf?${buildParams({ tipo: 'inspecoes', download: 'true' })}`
    setPdfUrl(url)
    setPdfDownloadUrl(downloadUrl)
    setSheetAberto(true)
    setCarregandoPdf(false)
    salvarHistorico({ tipo: 'Inspeções', range, url: downloadUrl })
  }

  async function baixarExcel() {
    setBaixandoExcel(true)
    try {
      const url = `/api/relatorios/excel?${buildParams()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Erro ao gerar Excel')
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `relatorio-inspecoes-${range.inicio}.xlsx`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success('Planilha Excel baixada com sucesso!')
      salvarHistorico({ tipo: 'Excel', range, url })
    } catch {
      toast.error('Erro ao baixar Excel. Tente novamente.')
    } finally {
      setBaixandoExcel(false)
    }
  }

  function salvarHistorico(item: { tipo: string; range: RangeData; url: string }) {
    try {
      const key = 'mc_relatorios_historico'
      const existentes = JSON.parse(localStorage.getItem(key) ?? '[]')
      const novo = {
        id: Date.now().toString(),
        tipo: item.tipo,
        label: `${item.tipo} — ${item.range.label}`,
        periodo: { inicio: item.range.inicio, fim: item.range.fim },
        url: item.url,
        geradoEm: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify([novo, ...existentes].slice(0, 20)))
    } catch {}
  }

  const escolaSelecionada = escolas.find(e => e.id === escolaId)

  return (
    <>
      <div className="space-y-4">

        {/* ── Configuração ── */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-800" />
            <h3 className="text-sm font-bold text-neutral-900">Configurar relatório</h3>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Período</label>
              <DateRangePicker value={range} onChange={setRange} />
            </div>
            <div className="space-y-1.5 flex-1 min-w-50">
              <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Escola</label>
              <select
                value={escolaId}
                onChange={(e) => setEscolaId(e.target.value)}
                className="w-full h-9 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
              >
                <option value="">Todas as escolas</option>
                {escolas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resumo da seleção */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-1 rounded-full font-medium">
              <CheckCircle2 size={11} />
              {range.label}
            </span>
            {escolaSelecionada ? (
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 text-blue-800 border border-blue-100 px-2.5 py-1 rounded-full font-medium">
                <School size={11} />
                {escolaSelecionada.nome}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs bg-neutral-50 text-neutral-500 border border-neutral-200 px-2.5 py-1 rounded-full">
                <School size={11} />
                Todas as escolas
              </span>
            )}
          </div>

          {/* KPIs do período selecionado (mês atual pré-carregado) */}
          {kpisMes && !escolaId && range.label === 'Este mês' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-neutral-100">
              {[
                { label: 'Inspeções', valor: kpisMes.totalInspecoes, icon: List },
                { label: 'Score médio', valor: `${kpisMes.scoreMedio.toFixed(1)}%`, icon: TrendingUp,
                  cor: kpisMes.scoreMedio >= 90 ? 'text-green-600' : kpisMes.scoreMedio >= 70 ? 'text-amber-600' : 'text-red-500' },
                { label: 'Escolas', valor: kpisMes.totalEscolas, icon: School },
                { label: 'NCs abertas', valor: kpisMes.totalNCs - kpisMes.ncsResolvidas, icon: AlertCircle,
                  cor: (kpisMes.totalNCs - kpisMes.ncsResolvidas) > 0 ? 'text-red-500' : 'text-green-600' },
              ].map((k) => {
                const Icon = k.icon
                return (
                  <div key={k.label} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 rounded-lg">
                    <Icon size={13} className={k.cor ?? 'text-neutral-400'} />
                    <div>
                      <p className={cn('text-sm font-bold', k.cor ?? 'text-neutral-800')}>{k.valor}</p>
                      <p className="text-[10px] text-neutral-400">{k.label}</p>
                    </div>
                  </div>
                )
              })}
              <p className="col-span-full text-[10px] text-neutral-400">
                Prévia baseada nos dados do mês atual. Os valores finais são calculados ao gerar.
              </p>
            </div>
          )}
        </div>

        {/* ── Cards de Exportação ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* PDF */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Header do card */}
            <div className="bg-linear-to-br from-blue-800 to-blue-700 p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileText size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-base">Relatório PDF</p>
                  <p className="text-xs text-blue-200">Documento profissional para impressão</p>
                </div>
              </div>
              {/* O que inclui */}
              <ul className="space-y-1.5">
                {PDF_CONTEUDO.map(({ icon: Icon, texto }) => (
                  <li key={texto} className="flex items-start gap-2 text-xs text-blue-100">
                    <Icon size={11} className="text-blue-300 shrink-0 mt-0.5" />
                    {texto}
                  </li>
                ))}
              </ul>
            </div>
            {/* Ações */}
            <div className="p-4 flex gap-2 mt-auto">
              <button
                onClick={abrirPrevia}
                disabled={carregandoPdf || !range.inicio}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-800 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {carregandoPdf ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
                {carregandoPdf ? 'Carregando...' : 'Pré-visualizar'}
              </button>
              <a
                href={`/api/relatorios/pdf?${buildParams({ tipo: 'inspecoes', download: 'true' })}`}
                download
                onClick={() => salvarHistorico({ tipo: 'Inspeções', range, url: `/api/relatorios/pdf?${buildParams({ tipo: 'inspecoes', download: 'true' })}` })}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm font-semibold text-blue-800 hover:bg-blue-50 transition-colors"
              >
                <Download size={14} />
                PDF
              </a>
            </div>
          </div>

          {/* Excel */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
            {/* Header do card */}
            <div className="bg-linear-to-br from-green-600 to-green-500 p-5 text-white">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <FileSpreadsheet size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-base">Planilha Excel</p>
                  <p className="text-xs text-green-100">3 abas, formatadas e com filtros</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {EXCEL_CONTEUDO.map(({ icon: Icon, texto }) => (
                  <li key={texto} className="flex items-start gap-2 text-xs text-green-100">
                    <Icon size={11} className="text-green-300 shrink-0 mt-0.5" />
                    {texto}
                  </li>
                ))}
              </ul>
            </div>
            {/* Ação */}
            <div className="p-4 mt-auto">
              <button
                onClick={baixarExcel}
                disabled={baixandoExcel || !range.inicio}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {baixandoExcel
                  ? <><Loader2 size={14} className="animate-spin" /> Gerando planilha...</>
                  : <><Download size={14} /> Baixar Excel (.xlsx)</>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-400">
          <ArrowRight size={11} />
          <span>Os relatórios incluem apenas inspeções <strong className="text-neutral-500">finalizadas</strong> no período selecionado.</span>
        </div>
      </div>

      <SheetPreviaPDF
        open={sheetAberto}
        onClose={() => setSheetAberto(false)}
        url={pdfUrl}
        downloadUrl={pdfDownloadUrl}
        titulo="Relatório de Inspeções"
      />
    </>
  )
}
