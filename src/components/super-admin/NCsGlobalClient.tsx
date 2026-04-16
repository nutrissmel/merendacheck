'use client'

import { useRouter } from 'next/navigation'
import { AlertTriangle, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

type NC = {
  id: string
  titulo: string
  severidade: string
  status: string
  prazoResolucao: Date | null
  createdAt: Date
  inspecao: {
    escola: { nome: string; tenant: { nome: string; estado: string } }
    inspetor: { nome: string }
  }
  _count: { acoes: number }
}

const SEV_STYLE: Record<string, string> = {
  BAIXA: 'bg-green-100 text-green-700',
  MEDIA: 'bg-amber-100 text-amber-700',
  ALTA: 'bg-orange-100 text-orange-700',
  CRITICA: 'bg-red-100 text-red-700',
}

const STATUS_STYLE: Record<string, string> = {
  ABERTA: 'bg-red-100 text-red-700',
  EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  RESOLVIDA: 'bg-green-100 text-green-700',
  VENCIDA: 'bg-neutral-100 text-neutral-600',
}

function fmt(d: Date) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function isVencida(prazo: Date | null) {
  return prazo && new Date(prazo) < new Date()
}

export function NCsGlobalClient({
  ncs, total, totalPaginas, paginaAtual, municipios, filtros,
}: {
  ncs: NC[]
  total: number
  totalPaginas: number
  paginaAtual: number
  municipios: { id: string; nome: string; estado: string }[]
  filtros: { tenantId?: string; status?: string; severidade?: string }
}) {
  const router = useRouter()

  function aplicarFiltro(key: string, value: string) {
    const params = new URLSearchParams({ pagina: '1' })
    if (filtros.tenantId && key !== 'tenantId') params.set('tenantId', filtros.tenantId)
    if (filtros.status && key !== 'status') params.set('status', filtros.status)
    if (filtros.severidade && key !== 'severidade') params.set('severidade', filtros.severidade)
    if (value) params.set(key, value)
    router.push(`/super-admin/ncs?${params.toString()}`)
  }

  function irPara(p: number) {
    const params = new URLSearchParams({ pagina: String(p) })
    if (filtros.tenantId) params.set('tenantId', filtros.tenantId)
    if (filtros.status) params.set('status', filtros.status)
    if (filtros.severidade) params.set('severidade', filtros.severidade)
    router.push(`/super-admin/ncs?${params.toString()}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle size={20} className="text-red-500" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">Não Conformidades</h1>
          <p className="text-sm text-[#5A7089]">{total.toLocaleString('pt-BR')} NCs no sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#5A7089]" />
          <span className="text-xs text-[#5A7089] font-medium">Filtros:</span>
        </div>
        <select value={filtros.tenantId ?? ''} onChange={(e) => aplicarFiltro('tenantId', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white">
          <option value="">Todos os municípios</option>
          {municipios.map((m) => <option key={m.id} value={m.id}>{m.nome} ({m.estado})</option>)}
        </select>
        <select value={filtros.status ?? ''} onChange={(e) => aplicarFiltro('status', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white">
          <option value="">Todos os status</option>
          <option value="ABERTA">Aberta</option>
          <option value="EM_ANDAMENTO">Em andamento</option>
          <option value="RESOLVIDA">Resolvida</option>
          <option value="VENCIDA">Vencida</option>
        </select>
        <select value={filtros.severidade ?? ''} onChange={(e) => aplicarFiltro('severidade', e.target.value)}
          className="px-3 py-2 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white">
          <option value="">Todas as severidades</option>
          <option value="BAIXA">Baixa</option>
          <option value="MEDIA">Média</option>
          <option value="ALTA">Alta</option>
          <option value="CRITICA">Crítica</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
              {['Título', 'Município / Escola', 'Severidade', 'Status', 'Prazo', 'Ações', 'Criada em'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-[#5A7089] px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F9FD]">
            {ncs.map((nc) => (
              <tr key={nc.id} className="hover:bg-[#F5F9FD]/50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-[#0F1B2D] max-w-[200px] truncate">{nc.titulo}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm text-[#0F1B2D]">{nc.inspecao.escola.tenant.nome}</p>
                  <p className="text-xs text-[#5A7089]">{nc.inspecao.escola.nome}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${SEV_STYLE[nc.severidade] ?? ''}`}>
                    {nc.severidade}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[nc.status] ?? ''}`}>
                    {nc.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {nc.prazoResolucao ? (
                    <span className={`text-xs font-medium ${isVencida(nc.prazoResolucao) && nc.status !== 'RESOLVIDA' ? 'text-red-600' : 'text-[#5A7089]'}`}>
                      {fmt(nc.prazoResolucao)}
                      {isVencida(nc.prazoResolucao) && nc.status !== 'RESOLVIDA' && ' ⚠️'}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3.5 text-sm text-[#5A7089]">{nc._count.acoes}</td>
                <td className="px-4 py-3.5 text-xs text-[#5A7089] whitespace-nowrap">{fmt(nc.createdAt)}</td>
              </tr>
            ))}
            {ncs.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-12 text-center text-sm text-[#5A7089]">Nenhuma NC encontrada</td></tr>
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
