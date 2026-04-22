import Link from 'next/link'
import { buscarAtividadeEquipe } from '@/actions/dashboard.actions'
import { Avatar } from '@/components/shared/Avatar'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Papel } from '@prisma/client'

const COR_POR_PAPEL: Record<Papel, string> = {
  SUPER_ADMIN: '#7C3AED',
  ADMIN_MUNICIPAL: '#0E2E60',
  NUTRICIONISTA: '#00963A',
  DIRETOR_ESCOLA: '#F59E0B',
  MERENDEIRA: '#7AAAE3',
}

const LABEL_PAPEL: Record<Papel, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_MUNICIPAL: 'Admin',
  NUTRICIONISTA: 'Nutricionista',
  DIRETOR_ESCOLA: 'Diretor',
  MERENDEIRA: 'Merendeira',
}

interface AtividadeEquipeProps {
  periodo: '30d'
  escolaId?: string
}

export async function AtividadeEquipe({ periodo, escolaId }: AtividadeEquipeProps) {
  let membros: Awaited<ReturnType<typeof buscarAtividadeEquipe>>
  try {
    membros = await buscarAtividadeEquipe({ periodo, escolaId })
  } catch (e) {
    return <div className="p-4 text-xs text-red-500 font-mono">AtividadeEquipe erro: {String(e)}</div>
  }

  if (membros.length === 0) return null

  const maximo = membros[0]?.totalInspecoes ?? 1

  return (
    <div className="bg-white rounded-xl border border-[#D5E3F0] shadow-[0_1px_3px_rgba(14,46,96,0.06)] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#D5E3F0]">
        <h3 className="font-semibold text-[#0F1B2D] font-heading">Atividade da Equipe</h3>
        <p className="text-xs text-[#5A7089] mt-0.5">Últimos 30 dias</p>
      </div>

      <div className="divide-y divide-[#EEF4FD]">
        {membros.map((membro) => {
          const pct = Math.round((membro.totalInspecoes / maximo) * 100)
          const corBarra = COR_POR_PAPEL[membro.usuario.papel] ?? '#5A7089'
          const ultimaAtividade = membro.ultimaAtividade
            ? format(membro.ultimaAtividade, "dd/MM 'às' HH:mm", { locale: ptBR })
            : 'Sem atividade'

          const scoreStatus =
            membro.scoreMedio >= 90
              ? 'CONFORME'
              : membro.scoreMedio >= 70
              ? 'ATENCAO'
              : membro.scoreMedio > 0
              ? 'NAO_CONFORME'
              : null

          return (
            <div key={membro.usuario.id} className="px-5 py-3 flex items-center gap-4">
              <div title={`Último acesso: ${ultimaAtividade}`}>
                <Avatar
                  nome={membro.usuario.nome}
                  papel={membro.usuario.papel}
                  size="sm"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="min-w-0">
                    <Link
                      href={`/configuracoes/usuarios/${membro.usuario.id}`}
                      className="text-sm font-semibold text-[#0F1B2D] hover:text-[#0E2E60] transition-colors truncate block"
                    >
                      {membro.usuario.nome}
                    </Link>
                    <p className="text-[10px] text-[#5A7089]">
                      {LABEL_PAPEL[membro.usuario.papel]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {scoreStatus && membro.scoreMedio > 0 && (
                      <ScoreBadge
                        scoreStatus={scoreStatus as any}
                        score={membro.scoreMedio}
                        showScore
                        size="sm"
                      />
                    )}
                    <span className="text-sm font-bold text-[#0E2E60]">
                      {membro.totalInspecoes}
                    </span>
                  </div>
                </div>

                <div className="h-2 bg-[#EEF4FD] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: corBarra }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
