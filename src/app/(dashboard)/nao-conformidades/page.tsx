import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import { listarNaoConformidades, buscarMetricasNC } from '@/actions/naoConformidade.actions'
import { SeveridadeBadge } from '@/components/naoConformidades/SeveridadeBadge'
import { StatusNCBadge } from '@/components/naoConformidades/StatusNCBadge'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { PageHeader } from '@/components/shared/PageHeader'
import prisma from '@/lib/prisma'
import {
  AlertTriangle, CheckCircle2, Clock, TrendingDown, School, Download,
  ChevronRight,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { StatusNC, Severidade } from '@prisma/client'

// ─── Prazo badge ──────────────────────────────────────────────────────────────

function PrazoBadge({ prazo, status }: { prazo: Date | null; status: StatusNC }) {
  if (!prazo) return <span className="text-[#A8BDD4] text-sm">—</span>

  const agora = new Date()
  const dias = differenceInDays(new Date(prazo), agora)

  if (status === 'RESOLVIDA') {
    return (
      <span className="text-sm text-[#5A7089]">
        {format(new Date(prazo), 'dd/MM/yyyy')}
      </span>
    )
  }

  if (dias < 0) {
    return (
      <span className="text-sm text-[#DC2626] font-bold">
        Vencida há {Math.abs(dias)} dia{Math.abs(dias) !== 1 ? 's' : ''}
      </span>
    )
  }

  if (dias === 0) {
    return <span className="text-sm text-[#D97706] font-bold">Vence hoje</span>
  }

  if (dias <= 2) {
    return (
      <span className="text-sm text-[#D97706] font-semibold">
        Vence em {dias} dia{dias !== 1 ? 's' : ''}
      </span>
    )
  }

  return (
    <span className="text-sm text-[#5A7089]">
      {format(new Date(prazo), 'dd/MM/yyyy')}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NaoConformidadesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: StatusNC
    severidade?: Severidade
    escolaId?: string
    pagina?: string
    busca?: string
  }>
}) {
  const user = await getServerUser()
  const params = await searchParams

  const pagina = parseInt(params.pagina ?? '1', 10)

  const [dados, metricas, escolas] = await Promise.all([
    listarNaoConformidades({
      status: params.status,
      severidade: params.severidade,
      escolaId: params.escolaId,
      busca: params.busca,
      pagina,
      porPagina: 25,
      ordenarPor: 'createdAt',
      ordem: 'desc',
    }),
    buscarMetricasNC(),
    prisma.escola.findMany({
      where: { tenantId: user.tenantId, ativa: true },
      select: { id: true, nome: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  const podeCriarAcoes = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)
  const podeExportar = podeCriarAcoes

  const statusTabs: { label: string; value: StatusNC | undefined; count: number }[] = [
    { label: 'Todas', value: undefined, count: dados.total },
    { label: 'Abertas', value: 'ABERTA', count: metricas.totalAberta },
    { label: 'Vencidas', value: 'VENCIDA', count: metricas.totalVencida },
    { label: 'Em andamento', value: 'EM_ANDAMENTO', count: 0 },
    { label: 'Resolvidas', value: 'RESOLVIDA', count: metricas.totalResolvida },
  ]

  const buildUrl = (extra: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    const merged = { status: params.status, severidade: params.severidade, escolaId: params.escolaId, busca: params.busca, ...extra }
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v) })
    const qs = p.toString()
    return `/nao-conformidades${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader
          titulo="Não Conformidades"
          subtitulo="Gerencie e resolva os problemas detectados nas inspeções"
        />
        {podeExportar && (
          <a
            href={`/api/nao-conformidades/exportar${params.status ? `?status=${params.status}` : ''}${params.escolaId ? `&escolaId=${params.escolaId}` : ''}`}
            className="flex items-center gap-2 h-9 px-4 rounded-xl border border-[#D5E3F0] text-sm font-semibold text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
          >
            <Download size={14} />
            Exportar CSV
          </a>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          titulo="Abertas"
          valor={metricas.totalAberta}
          subtitulo="Aguardando resolução"
          icone={AlertTriangle}
          corIcone={metricas.totalAberta > 0 ? 'red' : 'green'}
        />
        <StatsCard
          titulo="Vencidas"
          valor={metricas.totalVencida}
          subtitulo={metricas.totalVencida > 0 ? 'Ação urgente necessária!' : 'Nenhuma vencida'}
          icone={Clock}
          corIcone={metricas.totalVencida > 0 ? 'red' : 'green'}
        />
        <StatsCard
          titulo="Resolvidas"
          valor={metricas.totalResolvida}
          subtitulo="Total histórico"
          icone={CheckCircle2}
          corIcone="green"
        />
        <StatsCard
          titulo="Tempo médio"
          valor={metricas.tempMedioResolucaoDias > 0 ? `${metricas.tempMedioResolucaoDias}d` : '—'}
          subtitulo="Para resolução"
          icone={TrendingDown}
          corIcone="blue"
        />
      </div>

      {/* Tabs de status */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const isActive = params.status === tab.value || (!params.status && !tab.value)
          return (
            <Link
              key={tab.label}
              href={buildUrl({ status: tab.value, pagina: undefined })}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#0E2E60] text-white shadow-sm'
                  : 'bg-white border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD]'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#EEF4FD] text-[#0E2E60]'
                }`}>
                  {tab.count}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 flex-wrap">
        <form method="GET" action="/nao-conformidades" className="flex items-center gap-3 flex-wrap flex-1">
          {params.status && <input type="hidden" name="status" value={params.status} />}

          <select
            name="escolaId"
            defaultValue={params.escolaId ?? ''}
            className="h-9 rounded-xl border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20"
          >
            <option value="">Todas as escolas</option>
            {escolas.map((e) => (
              <option key={e.id} value={e.id}>{e.nome}</option>
            ))}
          </select>

          <select
            name="severidade"
            defaultValue={params.severidade ?? ''}
            className="h-9 rounded-xl border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20"
          >
            <option value="">Todas as severidades</option>
            <option value="CRITICA">Crítica</option>
            <option value="ALTA">Alta</option>
            <option value="MEDIA">Média</option>
            <option value="BAIXA">Baixa</option>
          </select>

          <input
            type="text"
            name="busca"
            defaultValue={params.busca ?? ''}
            placeholder="Buscar NC..."
            className="h-9 rounded-xl border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] placeholder:text-[#A8BDD4] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 flex-1 min-w-40"
          />

          <button
            type="submit"
            className="h-9 px-4 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-[#D5E3F0] rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(14,46,96,0.06)]">
        {dados.ncs.length === 0 ? (
          <EmptyState
            icone={CheckCircle2}
            titulo="Nenhuma não conformidade encontrada"
            descricao="Tente ajustar os filtros ou aguarde novas inspeções."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#EEF4FD] border-b border-[#D5E3F0]">
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">NC</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider hidden md:table-cell">Escola</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Severidade</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider hidden lg:table-cell">Prazo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider hidden lg:table-cell">Ações</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider hidden xl:table-cell">Aberta</th>
                  <th className="px-4 py-3" aria-label="Ver detalhe" />
                </tr>
              </thead>
              <tbody>
                {dados.ncs.map((nc, idx) => (
                  <tr
                    key={nc.id}
                    className={`border-b border-[#D5E3F0]/60 hover:bg-[#EEF4FD] transition-colors cursor-pointer ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F9FD]'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <Link
                          href={`/nao-conformidades/${nc.id}`}
                          className="text-sm font-semibold text-[#0F1B2D] hover:text-[#0E2E60] line-clamp-1 block"
                        >
                          {nc.titulo.length > 60 ? `${nc.titulo.slice(0, 60)}…` : nc.titulo}
                        </Link>
                        <p className="text-xs text-[#5A7089] mt-0.5 md:hidden">{nc.escola.nome}</p>
                        <p className="text-xs text-[#7AAAE3] mt-0.5">{nc.inspecao.checklist.categoria}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <School size={13} className="text-[#7AAAE3] shrink-0" />
                        <span className="text-sm text-[#5A7089] truncate max-w-[140px]">{nc.escola.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <SeveridadeBadge severidade={nc.severidade} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusNCBadge status={nc.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <PrazoBadge prazo={nc.prazoResolucao} status={nc.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {nc.totalAcoes > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#EEF4FD] rounded-full overflow-hidden w-20">
                            <div
                              className="h-full bg-[#00963A] rounded-full"
                              style={{ width: `${(nc.acoesConcluidas / nc.totalAcoes) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#5A7089] shrink-0">
                            {nc.acoesConcluidas}/{nc.totalAcoes}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#A8BDD4]">Sem ações</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#EEF4FD] text-[#0E2E60]"
                        title={format(new Date(nc.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      >
                        {nc.diasEmAberto}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/nao-conformidades/${nc.id}`}
                        className="text-[#5A7089] hover:text-[#0E2E60] transition-colors inline-flex"
                        aria-label={`Ver detalhe de NC: ${nc.titulo}`}
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {dados.paginas > 1 && (
          <div className="px-4 py-3 border-t border-[#D5E3F0] flex items-center justify-between">
            <p className="text-xs text-[#5A7089]">
              {dados.total} resultados · Página {pagina} de {dados.paginas}
            </p>
            <div className="flex gap-2">
              {pagina > 1 && (
                <Link
                  href={buildUrl({ pagina: String(pagina - 1) })}
                  className="h-8 px-3 rounded-lg border border-[#D5E3F0] text-sm text-[#0E2E60] font-semibold hover:bg-[#EEF4FD] transition-colors"
                >
                  ← Anterior
                </Link>
              )}
              {pagina < dados.paginas && (
                <Link
                  href={buildUrl({ pagina: String(pagina + 1) })}
                  className="h-8 px-3 rounded-lg border border-[#D5E3F0] text-sm text-[#0E2E60] font-semibold hover:bg-[#EEF4FD] transition-colors"
                >
                  Próxima →
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
