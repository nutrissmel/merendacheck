import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import { buscarNcById } from '@/actions/naoConformidade.actions'
import { SeveridadeBadge } from '@/components/naoConformidades/SeveridadeBadge'
import { StatusNCBadge } from '@/components/naoConformidades/StatusNCBadge'
import { HistoricoNC } from '@/components/naoConformidades/HistoricoNC'
import { NCDetalheClient } from './NCDetalheClient'
import prisma from '@/lib/prisma'
import {
  ArrowLeft, School, ClipboardCheck, Calendar, Flame, AlertTriangle,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function NCDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getServerUser()

  const [nc, usuarios] = await Promise.all([
    buscarNcById(id),
    prisma.usuario.findMany({
      where: { tenantId: user.tenantId, ativo: true },
      select: { id: true, nome: true, email: true },
      orderBy: { nome: 'asc' },
    }),
  ])

  if (!nc) notFound()

  const agora = new Date()
  const diasAberto = differenceInDays(nc.resolvidaEm ? new Date(nc.resolvidaEm) : agora, new Date(nc.createdAt))
  const prazoVencido = nc.prazoResolucao && new Date(nc.prazoResolucao) < agora && nc.status !== 'RESOLVIDA'

  const podeCriarAcoes = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)
  const podeResolver = podeCriarAcoes
  const podeReabrir = podeResolver && nc.status === 'RESOLVIDA'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/nao-conformidades"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors font-medium"
      >
        <ArrowLeft size={15} />
        Não Conformidades
      </Link>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Left: NC Detail ─────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-[#D5E3F0] shadow-[0_1px_4px_rgba(14,46,96,0.06)] overflow-hidden">
          {/* Header strip */}
          <div className="px-6 pt-6 pb-4 border-b border-[#D5E3F0]">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <SeveridadeBadge severidade={nc.severidade} />
              <StatusNCBadge status={nc.status} />
              {nc.estaVencida && nc.status !== 'RESOLVIDA' && (
                <span className="text-xs text-[#DC2626] font-bold">⚠ Prazo vencido</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#0F1B2D] leading-snug">{nc.titulo}</h1>
            {nc.descricao && (
              <p className="text-sm text-[#5A7089] mt-2">{nc.descricao}</p>
            )}
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Inspeção origem */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#7AAAE3] mb-2">Inspeção origem</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-[#0F1B2D]">
                  <ClipboardCheck size={14} className="text-[#7AAAE3] shrink-0" />
                  <Link href={`/inspecoes/${nc.inspecao.id}`} className="font-semibold hover:underline">
                    {nc.inspecao.checklist.nome}
                  </Link>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5A7089]">
                  <School size={14} className="text-[#7AAAE3] shrink-0" />
                  {nc.escola.nome}
                </div>
                <div className="flex items-center gap-2 text-sm text-[#5A7089]">
                  <Calendar size={14} className="text-[#7AAAE3] shrink-0" />
                  {format(new Date(nc.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>

            {/* Item reprovado */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#7AAAE3] mb-2">Item reprovado</p>
              <blockquote className="border-l-2 border-[#DC2626] pl-3 text-sm text-[#0F1B2D] italic">
                "{nc.itemOrigem.pergunta}"
              </blockquote>
              {nc.itemOrigem.isCritico && (
                <div className="flex items-center gap-1.5 mt-2 text-xs text-[#DC2626] font-semibold">
                  <Flame size={12} />
                  Item crítico
                </div>
              )}
            </div>

            {/* Prazo */}
            <div
              className={`rounded-xl px-4 py-3 ${
                prazoVencido ? 'bg-[#FEE2E2] border border-[#DC2626]/30' : 'bg-[#F5F9FD] border border-[#D5E3F0]'
              }`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-[#7AAAE3] mb-1.5">Prazo de resolução</p>
              {nc.prazoResolucao ? (
                <p className={`text-sm font-semibold ${prazoVencido ? 'text-[#DC2626]' : 'text-[#0F1B2D]'}`}>
                  {format(new Date(nc.prazoResolucao), "dd/MM/yyyy", { locale: ptBR })}
                  {prazoVencido && (
                    <span className="ml-2 font-bold">(vencida!)</span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-[#A8BDD4]">Sem prazo definido</p>
              )}
              <p className="text-xs text-[#5A7089] mt-1">
                Aberta há {diasAberto} dia{diasAberto !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Ações de NC (resolver / reabrir) */}
            {nc.status !== 'RESOLVIDA' && podeResolver && (
              <NCDetalheClient
                nc={{ id: nc.id, titulo: nc.titulo, status: nc.status }}
                usuarios={usuarios}
                acoes={nc.acoes}
                podeCriarAcoes={podeCriarAcoes}
                showNcActions
              />
            )}
            {podeReabrir && (
              <NCDetalheClient
                nc={{ id: nc.id, titulo: nc.titulo, status: nc.status }}
                usuarios={usuarios}
                acoes={nc.acoes}
                podeCriarAcoes={podeCriarAcoes}
                showReabrir
              />
            )}
          </div>
        </div>

        {/* ── Right: Plano de Ação + Histórico ────────────────────── */}
        <div className="space-y-6">
          {/* Plano de ação */}
          <div className="bg-white rounded-2xl border border-[#D5E3F0] shadow-[0_1px_4px_rgba(14,46,96,0.06)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D5E3F0] flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#0F1B2D]">Plano de ação</h2>
                {nc.totalAcoes > 0 && (
                  <p className="text-xs text-[#5A7089] mt-0.5">
                    {nc.totalAcoes} ação{nc.totalAcoes !== 1 ? 'ões' : ''} · {nc.acoesConcluidas} concluída{nc.acoesConcluidas !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              {nc.totalAcoes > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-[#EEF4FD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00963A] rounded-full transition-all"
                      style={{ width: `${(nc.acoesConcluidas / nc.totalAcoes) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#5A7089]">
                    {Math.round((nc.acoesConcluidas / nc.totalAcoes) * 100)}%
                  </span>
                </div>
              )}
            </div>

            <div className="px-6 py-5">
              <NCDetalheClient
                nc={{ id: nc.id, titulo: nc.titulo, status: nc.status }}
                usuarios={usuarios}
                acoes={nc.acoes}
                podeCriarAcoes={podeCriarAcoes}
                userId={user.id}
                userPapel={user.papel}
              />
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white rounded-2xl border border-[#D5E3F0] shadow-[0_1px_4px_rgba(14,46,96,0.06)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#D5E3F0]">
              <h2 className="font-bold text-[#0F1B2D]">Histórico</h2>
            </div>
            <div className="px-6 py-5">
              <HistoricoNC historico={nc.historico} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
