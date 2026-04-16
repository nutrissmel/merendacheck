import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock,
  School, ClipboardList, User, MapPin, PenLine, Camera,
} from 'lucide-react'
import { getServerUser } from '@/lib/auth'
import { buscarInspecaoCompleta } from '@/actions/inspecao.actions'
import { CATEGORIA_CONFIG } from '@/components/checklists/CategoriaConfig'
import { formatarScore } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { CategoriaChecklist } from '@prisma/client'

export default async function InspecaoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await getServerUser()

  const inspecao = await buscarInspecaoCompleta(id)
  if (!inspecao) notFound()

  const itens = inspecao.checklist.itens
  const respostas = inspecao.respostas
  const ncs = inspecao.naoConformidades

  const totalRespondidos = respostas.filter((r) => r.conforme !== null).length
  const totalConformes = respostas.filter((r) => r.conforme === true).length
  const totalNaoConformes = respostas.filter((r) => r.conforme === false).length

  const scoreConfig = inspecao.score != null && inspecao.scoreStatus
    ? formatarScore(inspecao.score, inspecao.scoreStatus as any)
    : null

  const statusLabel: Record<string, { label: string; icon: typeof CheckCircle2; cor: string }> = {
    EM_ANDAMENTO: { label: 'Em andamento', icon: Clock, cor: 'text-amber-600' },
    FINALIZADA: { label: 'Finalizada', icon: CheckCircle2, cor: 'text-[#00963A]' },
    CANCELADA: { label: 'Cancelada', icon: XCircle, cor: 'text-red-500' },
  }
  const statusInfo = statusLabel[inspecao.status] ?? statusLabel.EM_ANDAMENTO
  const StatusIcon = statusInfo.icon

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href="/inspecoes"
        className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
      >
        <ArrowLeft size={14} /> Inspeções
      </Link>

      {/* Header */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('flex items-center gap-1.5 text-sm font-semibold', statusInfo.cor)}>
                <StatusIcon size={15} /> {statusInfo.label}
              </span>
              {scoreConfig && (
                <span className={cn('text-sm font-bold px-2 py-0.5 rounded-lg', scoreConfig.cor, scoreConfig.bgCor)}>
                  {scoreConfig.valor} — {scoreConfig.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-[#5A7089]">
              <School size={14} />
              <span className="font-semibold text-[#0F1B2D]">{inspecao.escola.nome}</span>
              {inspecao.escola.cidade && <span>· {inspecao.escola.cidade}</span>}
            </div>

            <div className="flex items-center gap-2 text-sm text-[#5A7089]">
              <ClipboardList size={14} />
              <span>{inspecao.checklist.nome}</span>
              <span>·</span>
              <span>{CATEGORIA_CONFIG[inspecao.checklist.categoria as CategoriaChecklist]?.label}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#5A7089]">
              <User size={14} />
              <span>{inspecao.inspetor.nome}</span>
            </div>
          </div>

          {inspecao.status === 'EM_ANDAMENTO' && (
            <Link
              href={`/inspecoes/${id}/responder`}
              className="px-4 py-2 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors shrink-0"
            >
              Continuar →
            </Link>
          )}
        </div>

        {/* Dates */}
        <div className="flex items-center gap-6 pt-3 border-t border-neutral-100 text-sm text-[#5A7089] flex-wrap">
          <div>
            Iniciada em:{' '}
            <span className="font-semibold text-[#0F1B2D]">
              {format(new Date(inspecao.iniciadaEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </span>
          </div>
          {inspecao.finalizadaEm && (
            <div>
              Finalizada em:{' '}
              <span className="font-semibold text-[#0F1B2D]">
                {format(new Date(inspecao.finalizadaEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
          {inspecao.latLng && (
            <div className="flex items-center gap-1">
              <MapPin size={13} />
              <span className="font-mono text-xs">{inspecao.latLng}</span>
            </div>
          )}
          {inspecao.assinaturaUrl && (
            <div className="flex items-center gap-1 text-[#00963A]">
              <PenLine size={13} /> Assinado
            </div>
          )}
        </div>
      </div>

      {/* Score summary */}
      {inspecao.status === 'FINALIZADA' && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Respondidos', value: totalRespondidos, color: 'text-[#0E2E60]' },
            { label: 'Conformes', value: totalConformes, color: 'text-[#00963A]' },
            { label: 'Não conformes', value: totalNaoConformes, color: 'text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-[#D5E3F0] rounded-xl p-4 text-center">
              <div className={cn('text-2xl font-bold', color)}>{value}</div>
              <div className="text-xs text-[#5A7089] mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Items list */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-[#0F1B2D] font-heading">
            Respostas ({totalRespondidos}/{itens.length})
          </h2>
        </div>

        <div className="divide-y divide-neutral-100">
          {itens.map((item, idx) => {
            const resp = respostas.find((r) => r.itemId === item.id)
            const nc = ncs.find((n) => n.itemId === item.id)

            return (
              <div key={item.id} className="px-5 py-4 flex items-start gap-3">
                {/* Status dot */}
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5',
                  resp?.conforme === true ? 'bg-[#D1F7E2] text-[#005C25]' :
                  resp?.conforme === false ? 'bg-red-50 text-red-700' :
                  'bg-neutral-100 text-neutral-400'
                )}>
                  {resp?.conforme === true ? '✓' : resp?.conforme === false ? '✗' : idx + 1}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-[#0F1B2D] flex-1 leading-snug">
                      {item.pergunta}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.isCritico && (
                        <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                          <AlertCircle size={9} /> Crítico
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Answer value */}
                  {resp && (
                    <div className="text-xs text-[#5A7089] space-y-0.5">
                      {resp.respostaSimNao != null && (
                        <span>{resp.respostaSimNao ? 'Sim' : 'Não'}</span>
                      )}
                      {resp.respostaNumerica != null && (
                        <span>{resp.respostaNumerica}{item.unidade ? ` ${item.unidade}` : ''}</span>
                      )}
                      {resp.respostaTexto && <span>{resp.respostaTexto}</span>}
                      {resp.observacao && (
                        <p className="italic">Obs: {resp.observacao}</p>
                      )}
                    </div>
                  )}

                  {/* Photo */}
                  {resp?.fotoUrl && (
                    <a href={resp.fotoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <Camera size={11} /> Ver foto
                    </a>
                  )}

                  {/* NC badge */}
                  {nc && (
                    <span className={cn(
                      'inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded',
                      nc.severidade === 'CRITICA' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    )}>
                      NC {nc.severidade === 'CRITICA' ? 'Crítica' : 'Média'}
                    </span>
                  )}

                  {!resp && (
                    <span className="text-xs text-neutral-400 italic">Não respondido</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* NCs summary */}
      {ncs.length > 0 && (
        <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="font-semibold text-[#0F1B2D] font-heading">
              Não Conformidades ({ncs.length})
            </h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {ncs.map((nc) => (
              <div key={nc.id} className="px-5 py-3 flex items-center gap-3">
                <span className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded shrink-0',
                  nc.severidade === 'CRITICA' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                )}>
                  {nc.severidade === 'CRITICA' ? 'CRÍTICA' : 'MÉDIA'}
                </span>
                <p className="text-sm text-[#0F1B2D] flex-1">{nc.titulo}</p>
                <span className="text-xs text-[#5A7089] shrink-0">
                  {nc.status === 'ABERTA' ? 'Aberta' : nc.status === 'EM_ANDAMENTO' ? 'Em andamento' : 'Resolvida'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
