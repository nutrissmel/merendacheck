'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ClipboardPlus, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { CategoriaBadge } from '@/components/checklists/CategoriaBadge'
import type { ScoreStatus, CategoriaChecklist } from '@prisma/client'

interface Inspecao {
  id: string
  status: string
  score: number | null
  scoreStatus: ScoreStatus | null
  iniciadaEm: Date
  finalizadaEm: Date | null
  inspetorNome: string
  checklistNome: string
  checklistCategoria: CategoriaChecklist
  totalNCs: number
}

interface AbaInspecoesProps {
  escolaId: string
  escolaNome: string
  inspecoes: { inspecoes: Inspecao[]; total: number; paginas: number; pagina: number } | null
  periodo: string
}

const SCORE_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os scores' },
  { value: 'CONFORME', label: 'Conforme' },
  { value: 'ATENCAO', label: 'Atenção' },
  { value: 'NAO_CONFORME', label: 'Não Conforme' },
  { value: 'REPROVADO', label: 'Reprovado' },
]

export function AbaInspecoes({ escolaId, escolaNome, inspecoes, periodo }: AbaInspecoesProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function filtrar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('aba', 'inspecoes')
    if (valor) params.set(chave, valor)
    else params.delete(chave)
    router.replace(`/escolas/${escolaId}?${params.toString()}`)
  }

  function paginar(pagina: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('pagina', String(pagina))
    router.replace(`/escolas/${escolaId}?${params.toString()}`)
  }

  const scoreStatusAtual = searchParams.get('scoreStatus') ?? ''
  const lista = inspecoes?.inspecoes ?? []

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <select
            value={scoreStatusAtual}
            onChange={(e) => filtrar('scoreStatus', e.target.value)}
            className="h-9 rounded-lg border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 cursor-pointer"
          >
            {SCORE_STATUS_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>{op.label}</option>
            ))}
          </select>
          {inspecoes && (
            <span className="text-sm text-[#5A7089]">
              {inspecoes.total} inspeç{inspecoes.total !== 1 ? 'ões' : 'ão'}
            </span>
          )}
        </div>

        <Link
          href={`/inspecoes/nova?escola=${escolaId}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
        >
          <ClipboardPlus size={15} />
          + Nova inspeção nesta escola
        </Link>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-[#D5E3F0] overflow-hidden shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
        {lista.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-[#5A7089]">
            Nenhuma inspeção encontrada para este filtro.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#EEF4FD] border-b border-[#D5E3F0]">
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Checklist</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider hidden sm:table-cell">Inspetor</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Score</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider hidden md:table-cell">NCs</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((insp, idx) => (
                    <tr
                      key={insp.id}
                      className={`border-b border-[#EEF4FD] hover:bg-[#F5F9FD] transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F9FD]/50'}`}
                      onClick={() => router.push(`/inspecoes/${insp.id}`)}
                    >
                      <td className="px-4 py-3 text-[#5A7089] text-xs whitespace-nowrap">
                        {insp.finalizadaEm
                          ? format(new Date(insp.finalizadaEm), 'dd/MM/yyyy', { locale: ptBR })
                          : <span className="text-amber-600 font-medium">Em andamento</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#0F1B2D] text-sm truncate max-w-[180px]">{insp.checklistNome}</p>
                        <CategoriaBadge categoria={insp.checklistCategoria} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-[#5A7089] text-xs hidden sm:table-cell">{insp.inspetorNome}</td>
                      <td className="px-4 py-3">
                        {insp.scoreStatus ? (
                          <ScoreBadge scoreStatus={insp.scoreStatus} score={insp.score ?? undefined} showScore size="sm" />
                        ) : (
                          <span className="text-xs text-amber-600">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {insp.totalNCs > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-semibold text-[#DC2626]">
                            <AlertTriangle size={11} /> {insp.totalNCs}
                          </span>
                        ) : (
                          <span className="text-xs text-[#A8BDD4]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {inspecoes && inspecoes.paginas > 1 && (
              <div className="px-4 py-3 border-t border-[#EEF4FD] flex items-center justify-between">
                <p className="text-xs text-[#5A7089]">
                  Página {inspecoes.pagina} de {inspecoes.paginas}
                </p>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(inspecoes.paginas, 7) }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => paginar(p)}
                      className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                        p === inspecoes.pagina
                          ? 'bg-[#0E2E60] text-white'
                          : 'text-[#5A7089] hover:bg-[#EEF4FD]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
