'use client'

import { useRouter } from 'next/navigation'
import { ClipboardCheck, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

type Inspecao = {
  id: string
  status: string
  score: number | null
  scoreStatus: string | null
  iniciadaEm: Date
  finalizadaEm: Date | null
  escola: { nome: string; tenant: { nome: string; estado: string } }
  checklist: { nome: string; categoria: string }
  inspetor: { nome: string }
  _count: { naoConformidades: number }
}

const STATUS_STYLE: Record<string, string> = {
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  FINALIZADA: 'bg-green-100 text-green-700',
  CANCELADA: 'bg-neutral-100 text-neutral-500',
}

const SCORE_STYLE: Record<string, string> = {
  CONFORME: 'bg-green-100 text-green-700',
  ATENCAO: 'bg-amber-100 text-amber-700',
  NAO_CONFORME: 'bg-orange-100 text-orange-700',
  REPROVADO: 'bg-red-100 text-red-700',
}

const SCORE_LABEL: Record<string, string> = {
  CONFORME: 'Conforme', ATENCAO: 'Atenção', NAO_CONFORME: 'Não Conforme', REPROVADO: 'Reprovado',
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function InspecoesGlobalClient({
  inspecoes, total, totalPaginas, paginaAtual, municipios, filtros,
}: {
  inspecoes: Inspecao[]
  total: number
  totalPaginas: number
  paginaAtual: number
  municipios: { id: string; nome: string; estado: string }[]
  filtros: { tenantId?: string; status?: string; scoreStatus?: string }
}) {
  const router = useRouter()

  function aplicarFiltro(key: string, value: string) {
    const params = new URLSearchParams()
    params.set('pagina', '1')
    if (filtros.tenantId && key !== 'tenantId') params.set('tenantId', filtros.tenantId)
    if (filtros.status && key !== 'status') params.set('status', filtros.status)
    if (filtros.scoreStatus && key !== 'scoreStatus') params.set('scoreStatus', filtros.scoreStatus)
    if (value) params.set(key, value)
    router.push(`/super-admin/inspecoes?${params.toString()}`)
  }

  function irPara(p: number) {
    const params = new URLSearchParams()
    params.set('pagina', String(p))
    if (filtros.tenantId) params.set('tenantId', filtros.tenantId)
    if (filtros.status) params.set('status', filtros.status)
    if (filtros.scoreStatus) params.set('scoreStatus', filtros.scoreStatus)
    router.push(`/super-admin/inspecoes?${params.toString()}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardCheck size={20} className="text-[#0E2E60]" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">Inspeções</h1>
          <p className="text-sm text-[#5A7089]">{total.toLocaleString('pt-BR')} inspeções no sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#5A7089]" />
          <span className="text-xs text-[#5A7089] font-medium">Filtros:</span>
        </div>

        <select
          value={filtros.tenantId ?? ''}
          onChange={(e) => aplicarFiltro('tenantId', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
        >
          <option value="">Todos os municípios</option>
          {municipios.map((m) => (
            <option key={m.id} value={m.id}>{m.nome} ({m.estado})</option>
          ))}
        </select>

        <select
          value={filtros.status ?? ''}
          onChange={(e) => aplicarFiltro('status', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
        >
          <option value="">Todos os status</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="FINALIZADA">Finalizada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>

        <select
          value={filtros.scoreStatus ?? ''}
          onChange={(e) => aplicarFiltro('scoreStatus', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
        >
          <option value="">Todos os scores</option>
          <option value="CONFORME">Conforme</option>
          <option value="ATENCAO">Atenção</option>
          <option value="NAO_CONFORME">Não Conforme</option>
          <option value="REPROVADO">Reprovado</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
              {['Escola / Checklist', 'Município', 'Inspetor', 'Data', 'Status', 'Score', 'NCs'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-[#5A7089] px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F9FD]">
            {inspecoes.map((i) => (
              <tr key={i.id} className="hover:bg-[#F5F9FD]/50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-[#0F1B2D]">{i.escola.nome}</p>
                  <p className="text-xs text-[#5A7089]">{i.checklist.nome}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm text-[#0F1B2D]">{i.escola.tenant.nome}</p>
                  <p className="text-xs text-[#5A7089]">{i.escola.tenant.estado}</p>
                </td>
                <td className="px-4 py-3.5 text-sm text-[#5A7089]">{i.inspetor.nome}</td>
                <td className="px-4 py-3.5 text-xs text-[#5A7089] whitespace-nowrap">{fmt(i.iniciadaEm)}</td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[i.status] ?? ''}`}>
                    {i.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {i.scoreStatus ? (
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${SCORE_STYLE[i.scoreStatus] ?? ''}`}>
                        {SCORE_LABEL[i.scoreStatus]}
                      </span>
                      {i.score !== null && (
                        <p className="text-xs text-[#5A7089] mt-0.5">{i.score.toFixed(1)}%</p>
                      )}
                    </div>
                  ) : '—'}
                </td>
                <td className="px-4 py-3.5">
                  {i._count.naoConformidades > 0 ? (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {i._count.naoConformidades}
                    </span>
                  ) : (
                    <span className="text-xs text-[#5A7089]">0</span>
                  )}
                </td>
              </tr>
            ))}
            {inspecoes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-sm text-[#5A7089]">
                  Nenhuma inspeção encontrada
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#EEF4FD]">
            <p className="text-xs text-[#5A7089]">Página {paginaAtual} de {totalPaginas} · {total.toLocaleString('pt-BR')} registros</p>
            <div className="flex gap-2">
              <button onClick={() => irPara(paginaAtual - 1)} disabled={paginaAtual <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] disabled:opacity-40">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => irPara(paginaAtual + 1)} disabled={paginaAtual >= totalPaginas}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] disabled:opacity-40">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
