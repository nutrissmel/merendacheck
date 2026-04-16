import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Pencil } from 'lucide-react'
import { buscarUsuarioById } from '@/actions/usuario.actions'
import { getServerUser } from '@/lib/auth'
import { Avatar } from '@/components/shared/Avatar'
import { PapelBadge } from '@/components/shared/PapelBadge'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { EscolaChips } from '@/components/shared/EscolaChips'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { TempoRelativo } from '@/components/shared/TempoRelativo'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, ClipboardCheck, AlertTriangle, Calendar } from 'lucide-react'
import type { ScoreStatus } from '@prisma/client'

export default async function UsuarioDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const logado = await getServerUser()

  if (!['ADMIN_MUNICIPAL', 'SUPER_ADMIN', 'NUTRICIONISTA'].includes(logado.papel)) {
    redirect('/configuracoes/usuarios')
  }

  const usuario = await buscarUsuarioById(id)
  if (!usuario) notFound()

  const diasAtivo = differenceInDays(new Date(), new Date(usuario.createdAt))
  const membroDesde = format(new Date(usuario.createdAt), "dd/MM/yyyy", { locale: ptBR })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/configuracoes/usuarios"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
      >
        <ArrowLeft size={14} /> Usuários
      </Link>

      {/* Header do usuário */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Avatar nome={usuario.nome} papel={usuario.papel} size="lg" />
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#0F1B2D] font-heading">{usuario.nome}</h1>
                {!usuario.ativo && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full border border-red-200">
                    Inativo
                  </span>
                )}
              </div>
              <PapelBadge papel={usuario.papel} size="md" />
              <p className="text-sm text-[#5A7089]">{usuario.email}</p>
              <p className="text-xs text-neutral-400">
                Membro desde {membroDesde} · {diasAtivo} dias ativo
              </p>
              <p className="text-xs text-neutral-400 flex items-center gap-1">
                Último acesso: <TempoRelativo data={usuario.ultimaInspecao} nullLabel="Nunca inspecionou" />
              </p>
            </div>
          </div>

          {['ADMIN_MUNICIPAL', 'SUPER_ADMIN'].includes(logado.papel) && (
            <Link
              href={`/configuracoes/usuarios`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D5E3F0] text-sm font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors shrink-0"
            >
              <Pencil size={13} /> Editar
            </Link>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          titulo="Total inspeções"
          valor={usuario.totalInspecoes}
          subtitulo="Desde o cadastro"
          icone={ClipboardCheck}
          corIcone="blue"
        />
        <StatsCard
          titulo="Este mês"
          valor={usuario.inspecoesMes}
          subtitulo="Inspeções no mês"
          icone={Calendar}
          corIcone="green"
        />
        <StatsCard
          titulo="Score médio"
          valor={usuario.mediascore !== null ? `${Math.round(usuario.mediascore)}%` : '—'}
          subtitulo="Média das inspeções"
          icone={TrendingUp}
          corIcone={
            usuario.mediascore === null ? 'blue'
            : usuario.mediascore >= 90 ? 'green'
            : usuario.mediascore >= 70 ? 'amber'
            : 'red'
          }
        />
        <StatsCard
          titulo="NCs geradas"
          valor={usuario.ncsGeradas}
          subtitulo="Não conformidades"
          icone={AlertTriangle}
          corIcone={usuario.ncsGeradas > 0 ? 'amber' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspeções recentes */}
        <div className="lg:col-span-2 bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#EEF4FD] flex items-center justify-between">
            <h2 className="font-semibold text-[#0F1B2D] font-heading flex items-center gap-2">
              <ClipboardList size={16} className="text-[#0E2E60]" />
              Últimas inspeções
            </h2>
            <Link
              href={`/inspecoes?inspetor=${id}`}
              className="text-xs text-[#0E2E60] font-semibold hover:underline"
            >
              Ver todas →
            </Link>
          </div>

          {usuario.inspecoesRecentes.length === 0 ? (
            <p className="px-5 py-10 text-sm text-neutral-400 italic text-center">
              Nenhuma inspeção realizada
            </p>
          ) : (
            <div className="divide-y divide-[#EEF4FD]">
              {usuario.inspecoesRecentes.map((insp) => (
                <div key={insp.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0F1B2D]">{insp.checklist.nome}</p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {insp.finalizadaEm
                        ? format(new Date(insp.finalizadaEm), "dd/MM/yyyy", { locale: ptBR })
                        : 'Em andamento'}
                    </p>
                  </div>
                  {insp.scoreStatus ? (
                    <ScoreBadge
                      scoreStatus={insp.scoreStatus as ScoreStatus}
                      score={insp.score ?? undefined}
                      showScore
                      size="sm"
                    />
                  ) : (
                    <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-1 rounded-lg">
                      Em andamento
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Escolas */}
        <div className="bg-white border border-[#D5E3F0] rounded-xl p-5">
          <h2 className="font-semibold text-[#0F1B2D] font-heading mb-4 text-sm">
            Escolas atribuídas
          </h2>
          {usuario.escolas.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">Nenhuma escola atribuída</p>
          ) : (
            <EscolaChips escolas={usuario.escolas} size="md" />
          )}
        </div>
      </div>
    </div>
  )
}
