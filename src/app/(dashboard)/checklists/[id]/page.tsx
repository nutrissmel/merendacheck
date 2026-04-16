import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, Camera, Pencil, Shield } from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import { buscarChecklistById } from '@/actions/checklist.actions'
import { CategoriaBadge } from '@/components/checklists/CategoriaBadge'
import { FREQUENCIA_LABEL, TIPO_RESPOSTA_LABEL } from '@/components/checklists/CategoriaConfig'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import prisma from '@/lib/prisma'

export default async function ChecklistDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getServerUser()
  const podeEditar = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)

  const checklist = await buscarChecklistById(id)
  if (!checklist) notFound()

  // Última inspeção com este checklist
  const ultimaInspecao = await prisma.inspecao.findFirst({
    where: { checklistId: id, tenantId: user.tenantId },
    orderBy: { iniciadaEm: 'desc' },
    select: { iniciadaEm: true },
  })

  const totalCriticos = checklist.itens.filter((i) => i.isCritico).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/checklists"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
      >
        <ArrowLeft size={14} /> Checklists
      </Link>

      {/* Header */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-3 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CategoriaBadge categoria={checklist.categoria} />
              {checklist.isTemplate ? (
                <span className="flex items-center gap-1 text-xs font-semibold text-[#0E2E60] bg-[#EEF4FD] px-2 py-0.5 rounded-md">
                  <Shield size={11} /> Template PNAE
                </span>
              ) : (
                <span className="text-xs font-semibold text-[#005C25] bg-[#D1F7E2] px-2 py-0.5 rounded-md">
                  Personalizado
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                checklist.ativo
                  ? 'text-[#00963A] bg-[#D1F7E2]'
                  : 'text-neutral-500 bg-neutral-100'
              }`}>
                {checklist.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">{checklist.nome}</h1>

            <div className="flex items-center gap-3 text-sm text-[#5A7089] flex-wrap">
              <span>{FREQUENCIA_LABEL[checklist.frequencia]}</span>
              <span>·</span>
              <span>{checklist.totalItens} {checklist.totalItens === 1 ? 'item' : 'itens'}</span>
              {totalCriticos > 0 && (
                <>
                  <span>·</span>
                  <span className="text-red-600 font-semibold">{totalCriticos} crítico{totalCriticos !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {podeEditar && !checklist.isTemplate && (
              <Link
                href={`/checklists/${id}/editar`}
                className="flex items-center gap-1.5 px-3 py-2 border border-[#D5E3F0] rounded-xl text-sm font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
              >
                <Pencil size={13} /> Editar
              </Link>
            )}
            <Link
              href={`/inspecoes/nova?checklistId=${id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors"
            >
              Usar →
            </Link>
          </div>
        </div>

        {checklist.descricao && (
          <div className="mt-4 pt-4 border-t border-neutral-100">
            <p className="text-sm text-[#5A7089] leading-relaxed italic">"{checklist.descricao}"</p>
          </div>
        )}
      </div>

      {/* Lista de itens */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-[#0F1B2D] font-heading">
            Itens ({checklist.itens.length})
          </h2>
        </div>

        {checklist.itens.length === 0 ? (
          <p className="px-5 py-10 text-sm text-neutral-400 italic text-center">
            Nenhum item cadastrado neste checklist.
          </p>
        ) : (
          <div className="divide-y divide-neutral-100">
            {checklist.itens.map((item, idx) => (
              <div key={item.id} className="px-5 py-3.5 flex items-start gap-3">
                {/* Número */}
                <span className="w-6 h-6 rounded-full bg-[#EEF4FD] text-[#0E2E60] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#0F1B2D] leading-snug flex-1">
                      {item.pergunta}
                      {item.obrigatorio && <span className="text-red-400 ml-0.5">*</span>}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      {item.isCritico && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          <AlertCircle size={9} /> Crítico
                        </span>
                      )}
                      {item.fotoObrigatoria && (
                        <span className="flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          <Camera size={9} /> Foto
                        </span>
                      )}
                      <span className="text-[10px] text-[#5A7089] bg-neutral-100 px-1.5 py-0.5 rounded font-medium">
                        {TIPO_RESPOSTA_LABEL[item.tipoResposta] ?? item.tipoResposta}
                      </span>
                      {item.tipoResposta === 'NUMERICO' && (item.valorMinimo != null || item.valorMaximo != null) && (
                        <span className="text-[10px] text-[#5A7089]">
                          {item.valorMinimo ?? '?'}–{item.valorMaximo ?? '?'}{item.unidade ? ` ${item.unidade}` : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.descricao && (
                    <p className="text-xs text-[#5A7089] mt-0.5 leading-relaxed">{item.descricao}</p>
                  )}
                  {item.tipoResposta === 'MULTIPLA_ESCOLHA' && item.opcoes.length > 0 && (
                    <p className="text-xs text-[#5A7089] mt-1">
                      Opções: {item.opcoes.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats rodapé */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl px-5 py-4 flex items-center gap-8 flex-wrap text-sm text-[#5A7089]">
        <div>
          <span className="font-semibold text-[#0F1B2D]">{checklist.totalInspecoes}</span>
          {' '}inspeç{checklist.totalInspecoes !== 1 ? 'ões' : 'ão'} realizadas
        </div>
        {ultimaInspecao && (
          <div>
            Última inspeção:{' '}
            <span className="font-semibold text-[#0F1B2D]">
              {format(new Date(ultimaInspecao.iniciadaEm), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
        )}
        <div>
          Criado em:{' '}
          <span className="font-semibold text-[#0F1B2D]">
            {format(new Date(checklist.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
          </span>
        </div>
      </div>
    </div>
  )
}
