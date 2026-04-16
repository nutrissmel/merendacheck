'use client'

import { useState } from 'react'
import { Eye, Download, Loader2, CheckCircle2, XCircle, Building2 } from 'lucide-react'
import { DateRangePicker, type RangeData } from './DateRangePicker'
import { SheetPreviaPDF } from './SheetPreviaPDF'
import { buscarDadosFNDE } from '@/actions/relatorios.actions'
import { startOfMonth, endOfMonth } from 'date-fns'

export function AbaFNDE() {
  const agora = new Date()
  const [range, setRange] = useState<RangeData>({
    inicio: startOfMonth(agora).toISOString().split('T')[0],
    fim: endOfMonth(agora).toISOString().split('T')[0],
    label: 'Este mês',
  })
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof buscarDadosFNDE>> | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [sheetAberto, setSheetAberto] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null)

  async function carregar() {
    if (!range.inicio) return
    setCarregando(true)
    const dados = await buscarDadosFNDE({ inicio: range.inicio, fim: range.fim })
    setPreview(dados)
    setCarregando(false)
  }

  function abrirPrevia() {
    const url = `/api/relatorios/pdf?tipo=fnde&inicio=${range.inicio}&fim=${range.fim}`
    const dlUrl = `${url}&download=true`
    setPdfUrl(url)
    setPdfDownloadUrl(dlUrl)
    setSheetAberto(true)
  }

  const taxaCertificacao = preview
    ? preview.totalEscolas > 0
      ? Math.round((preview.escolasCertificadas / preview.totalEscolas) * 100)
      : 0
    : 0

  return (
    <>
      <div className="space-y-5">
        {/* Cabeçalho */}
        <div className="bg-white rounded-xl border border-[#D5E3F0] p-5 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#EEF4FD] flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-[#0E2E60]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#0F1B2D] font-heading">Relatório FNDE / PNAE</h3>
              <p className="text-xs text-[#5A7089] mt-0.5">
                Relatório formal para prestação de contas ao PNAE com campo de assinatura do nutricionista
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-[#5A7089] block mb-1.5 font-medium">Período de referência</label>
              <DateRangePicker value={range} onChange={(r) => { setRange(r); setPreview(null) }} />
            </div>
            <button
              onClick={carregar}
              disabled={carregando || !range.inicio}
              className="h-9 flex items-center gap-1.5 px-4 rounded-lg border border-[#D5E3F0] text-sm font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors disabled:opacity-50"
            >
              {carregando ? <Loader2 size={14} className="animate-spin" /> : null}
              Pré-visualizar dados
            </button>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <>
            {/* Resumo certificação */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)] text-center">
                <p className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider mb-1">Total de Escolas</p>
                <p className="text-3xl font-bold text-[#0F1B2D] font-heading">{preview.totalEscolas}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)] text-center">
                <p className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider mb-1">Certificadas (≥70%)</p>
                <p className="text-3xl font-bold text-[#00963A] font-heading">{preview.escolasCertificadas}</p>
              </div>
              <div className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)] text-center">
                <p className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider mb-1">Taxa Certificação</p>
                <p className={`text-3xl font-bold font-heading ${taxaCertificacao >= 80 ? 'text-[#00963A]' : taxaCertificacao >= 50 ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`}>
                  {taxaCertificacao}%
                </p>
              </div>
            </div>

            {/* Tabela de escolas */}
            <div className="bg-white rounded-xl border border-[#D5E3F0] shadow-[0_1px_3px_rgba(14,46,96,0.06)] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#EEF4FD]">
                <h3 className="font-semibold text-[#0F1B2D] text-sm font-heading">Situação por escola</h3>
              </div>
              <div className="overflow-x-auto max-h-80">
                <table className="w-full text-sm">
                  <thead className="sticky top-0">
                    <tr className="bg-[#EEF4FD]">
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Escola</th>
                      <th className="px-4 py-2.5 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">INEP</th>
                      <th className="px-4 py-2.5 text-center text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Insp.</th>
                      <th className="px-4 py-2.5 text-center text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Score</th>
                      <th className="px-4 py-2.5 text-center text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.escolas.map((escola, idx) => (
                      <tr
                        key={escola.id}
                        className={`border-b border-[#EEF4FD] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F9FD]/50'}`}
                      >
                        <td className="px-4 py-2.5 text-sm font-medium text-[#0F1B2D]">{escola.nome}</td>
                        <td className="px-4 py-2.5 text-xs text-[#5A7089] font-mono">{escola.codigoInep ?? '—'}</td>
                        <td className="px-4 py-2.5 text-center text-xs text-[#5A7089]">{escola.totalInspecoes}</td>
                        <td className={`px-4 py-2.5 text-center text-xs font-bold ${
                          escola.scoreMedio >= 90 ? 'text-[#00963A]'
                          : escola.scoreMedio >= 70 ? 'text-[#F59E0B]'
                          : escola.scoreMedio > 0 ? 'text-[#DC2626]'
                          : 'text-[#A8BDD4]'
                        }`}>
                          {escola.scoreMedio > 0 ? `${escola.scoreMedio}%` : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {escola.totalInspecoes === 0 ? (
                            <span className="text-xs text-[#A8BDD4]">Sem dados</span>
                          ) : escola.certificada ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00963A]">
                              <CheckCircle2 size={12} /> CERTIFICADA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626]">
                              <XCircle size={12} /> NÃO CERTIFICADA
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={abrirPrevia}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
              >
                <Eye size={14} /> Pré-visualizar PDF FNDE
              </button>
              <a
                href={`/api/relatorios/pdf?tipo=fnde&inicio=${range.inicio}&fim=${range.fim}&download=true`}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D5E3F0] text-sm font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
              >
                <Download size={14} /> Baixar PDF FNDE
              </a>
            </div>

            <p className="text-xs text-[#A8BDD4]">
              O PDF inclui campos de assinatura para o nutricionista responsável e a autoridade municipal.
            </p>
          </>
        )}
      </div>

      <SheetPreviaPDF
        open={sheetAberto}
        onClose={() => setSheetAberto(false)}
        url={pdfUrl}
        downloadUrl={pdfDownloadUrl}
        titulo="Relatório FNDE / PNAE"
      />
    </>
  )
}
