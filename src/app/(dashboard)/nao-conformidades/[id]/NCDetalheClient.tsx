'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resolverNcManualAction, reabrirNcAction, removerAcaoAction } from '@/actions/naoConformidade.actions'
import type { AcaoCompletada } from '@/actions/naoConformidade.actions'
import { ModalAcao } from '@/components/naoConformidades/ModalAcao'
import { ModalConcluirAcao } from '@/components/naoConformidades/ModalConcluirAcao'
import { PrioridadeBadge } from '@/components/naoConformidades/PrioridadeBadge'
import { StatusNCBadge } from '@/components/naoConformidades/StatusNCBadge'
import {
  Plus, CheckCircle2, Pencil, Trash2, Loader2, Image as ImageIcon,
  User, Calendar, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { StatusNC, Papel } from '@prisma/client'

interface NCDetalheClientProps {
  nc: { id: string; titulo: string; status: StatusNC }
  usuarios: { id: string; nome: string; email: string }[]
  acoes: AcaoCompletada[]
  podeCriarAcoes: boolean
  userId?: string
  userPapel?: Papel
  showNcActions?: boolean
  showReabrir?: boolean
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function NCDetalheClient({
  nc,
  usuarios,
  acoes,
  podeCriarAcoes,
  userId,
  userPapel,
  showNcActions,
  showReabrir,
}: NCDetalheClientProps) {
  const router = useRouter()
  const [modalAcao, setModalAcao] = useState<{ open: boolean; acao?: AcaoCompletada }>({ open: false })
  const [modalConcluir, setModalConcluir] = useState<{ open: boolean; acao?: AcaoCompletada }>({ open: false })
  const [isPending, startTransition] = useTransition()
  const [observacaoResolver, setObservacaoResolver] = useState('')
  const [showResolverForm, setShowResolverForm] = useState(false)
  const [motivoReabrir, setMotivoReabrir] = useState('')
  const [showReabrirForm, setShowReabrirForm] = useState(false)

  const handleResolver = () => {
    if (observacaoResolver.trim().length < 10) {
      toast.error('Explique como a NC foi resolvida (mín. 10 caracteres)')
      return
    }
    startTransition(async () => {
      const result = await resolverNcManualAction(nc.id, observacaoResolver)
      if ('erro' in result) { toast.error(result.erro); return }
      toast.success('NC marcada como resolvida ✓')
      router.refresh()
    })
  }

  const handleReabrir = () => {
    if (motivoReabrir.trim().length < 10) {
      toast.error('Informe o motivo da reabertura (mín. 10 caracteres)')
      return
    }
    startTransition(async () => {
      const result = await reabrirNcAction(nc.id, motivoReabrir)
      if ('erro' in result) { toast.error(result.erro); return }
      toast.success('NC reaberta')
      router.refresh()
    })
  }

  const handleRemoverAcao = (acaoId: string) => {
    startTransition(async () => {
      const result = await removerAcaoAction(acaoId)
      if ('erro' in result) { toast.error(result.erro); return }
      toast.success('Ação removida')
      router.refresh()
    })
  }

  const podeResponder = (acao: AcaoCompletada) => {
    if (!userId || !userPapel) return false
    if (['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(userPapel)) return true
    return acao.responsavel?.id === userId
  }

  // ── NC resolver / reabrir buttons (shown in left column) ──────────────────

  if (showNcActions) {
    return (
      <div className="space-y-3">
        {!showResolverForm ? (
          <button
            onClick={() => setShowResolverForm(true)}
            className="w-full h-10 rounded-xl border border-[#00963A] text-[#00963A] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#D1F7E2] transition-colors"
            style={TAP}
          >
            <CheckCircle2 size={15} />
            Resolver manualmente
          </button>
        ) : (
          <div className="space-y-2 bg-[#D1F7E2] rounded-xl p-4 border border-[#00963A]/30">
            <label className="text-xs font-bold text-[#00963A] uppercase tracking-wider">
              Como foi resolvida?
            </label>
            <textarea
              value={observacaoResolver}
              onChange={(e) => setObservacaoResolver(e.target.value)}
              placeholder="Explique como a não conformidade foi resolvida..."
              rows={3}
              className="w-full rounded-xl border border-[#D5E3F0] px-3 py-2 text-sm text-[#0F1B2D] placeholder:text-[#A8BDD4] focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowResolverForm(false)} className="flex-1 h-9 rounded-lg border border-[#D5E3F0] text-sm text-[#5A7089]" style={TAP}>
                Cancelar
              </button>
              <button onClick={handleResolver} disabled={isPending} className="flex-1 h-9 rounded-lg bg-[#00963A] text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60" style={TAP}>
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (showReabrir) {
    return (
      <div className="space-y-3">
        {!showReabrirForm ? (
          <button
            onClick={() => setShowReabrirForm(true)}
            className="w-full h-10 rounded-xl border border-[#D5E3F0] text-[#5A7089] text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#F5F9FD] transition-colors"
            style={TAP}
          >
            Reabrir NC
          </button>
        ) : (
          <div className="space-y-2 bg-[#FEF3C7] rounded-xl p-4 border border-[#F59E0B]/30">
            <label className="text-xs font-bold text-[#D97706] uppercase tracking-wider">Motivo da reabertura</label>
            <textarea
              value={motivoReabrir}
              onChange={(e) => setMotivoReabrir(e.target.value)}
              placeholder="Por que esta NC está sendo reaberta?"
              rows={2}
              className="w-full rounded-xl border border-[#D5E3F0] px-3 py-2 text-sm focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReabrirForm(false)} className="flex-1 h-9 rounded-lg border border-[#D5E3F0] text-sm text-[#5A7089]" style={TAP}>Cancelar</button>
              <button onClick={handleReabrir} disabled={isPending} className="flex-1 h-9 rounded-lg bg-[#D97706] text-white text-sm font-bold flex items-center justify-center gap-1 disabled:opacity-60" style={TAP}>
                {isPending && <Loader2 size={13} className="animate-spin" />}
                Reabrir
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Action list (right column) ────────────────────────────────────────────

  return (
    <div className="space-y-3">
      {acoes.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle size={32} className="mx-auto mb-3 text-[#D5E3F0]" />
          <p className="text-sm font-medium text-[#5A7089]">Nenhuma ação criada</p>
          {podeCriarAcoes && (
            <p className="text-xs text-[#A8BDD4] mt-1">Clique em "+ Adicionar ação" para criar um plano de ação</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {acoes.map((acao, idx) => (
            <div
              key={acao.id}
              id={`acao-${acao.id}`}
              className={`rounded-xl border p-4 space-y-2.5 ${
                acao.status === 'CONCLUIDA'
                  ? 'bg-[#F0FFF7] border-[#00963A]/30'
                  : acao.estaVencida
                  ? 'bg-[#FEF2F2] border-[#DC2626]/30'
                  : 'bg-[#F5F9FD] border-[#D5E3F0]'
              }`}
            >
              {/* Header */}
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-[#7AAAE3] mt-0.5 shrink-0">
                  {String.fromCharCode(9312 + idx)} {/* ①②③ */}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F1B2D]">{acao.descricao}</p>
                </div>
                <PrioridadeBadge prioridade={acao.prioridade} size="sm" />
              </div>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#5A7089]">
                <span className="flex items-center gap-1">
                  <User size={11} />
                  {acao.responsavel?.nome ?? 'Sem responsável'}
                </span>
                {acao.prazo && (
                  <span className={`flex items-center gap-1 ${acao.estaVencida ? 'text-[#DC2626] font-semibold' : ''}`}>
                    <Calendar size={11} />
                    {format(new Date(acao.prazo), 'dd/MM/yyyy', { locale: ptBR })}
                    {acao.estaVencida && ' (vencida)'}
                  </span>
                )}
                <StatusNCBadge status={acao.status as never} size="sm" />
              </div>

              {/* Conclusão */}
              {acao.status === 'CONCLUIDA' && (
                <div className="text-xs text-[#00963A] space-y-1">
                  {acao.observacaoConclusao && (
                    <p className="text-[#5A7089]">✓ {acao.observacaoConclusao}</p>
                  )}
                  {acao.concluidaEm && (
                    <p className="text-[#7AAAE3]">
                      Concluída em {format(new Date(acao.concluidaEm), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  {acao.evidenciaUrl && (
                    <a
                      href={acao.evidenciaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#0E2E60] font-semibold hover:underline"
                    >
                      <ImageIcon size={11} />
                      Ver evidência 📸
                    </a>
                  )}
                </div>
              )}

              {/* Actions */}
              {acao.status !== 'CONCLUIDA' && (
                <div className="flex items-center gap-2 pt-1">
                  {podeResponder(acao) && (
                    <button
                      onClick={() => setModalConcluir({ open: true, acao })}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#00963A] text-white text-xs font-bold hover:bg-[#007A30] transition-colors"
                      style={TAP}
                    >
                      <CheckCircle2 size={12} />
                      Concluir
                    </button>
                  )}
                  {podeCriarAcoes && (
                    <button
                      onClick={() => setModalAcao({ open: true, acao })}
                      className="flex items-center gap-1 h-8 px-3 rounded-lg border border-[#D5E3F0] text-[#5A7089] text-xs font-semibold hover:bg-white transition-colors"
                      style={TAP}
                    >
                      <Pencil size={11} />
                      Editar
                    </button>
                  )}
                  {podeCriarAcoes && acao.status === 'ABERTA' && !acao.evidenciaUrl && (
                    <button
                      onClick={() => {
                        if (confirm('Remover esta ação?')) handleRemoverAcao(acao.id)
                      }}
                      className="flex items-center gap-1 h-8 px-2 rounded-lg text-[#DC2626] text-xs hover:bg-[#FEE2E2] transition-colors ml-auto"
                      style={TAP}
                      aria-label="Remover ação"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add action button */}
      {podeCriarAcoes && nc.status !== 'RESOLVIDA' && (
        <button
          onClick={() => setModalAcao({ open: true })}
          className="w-full h-10 rounded-xl border-2 border-dashed border-[#D5E3F0] text-sm font-semibold text-[#5A7089] flex items-center justify-center gap-2 hover:border-[#0E2E60] hover:text-[#0E2E60] hover:bg-[#EEF4FD] transition-all"
          style={TAP}
        >
          <Plus size={15} />
          Adicionar ação
        </button>
      )}

      {/* Modals */}
      {modalAcao.open && (
        <ModalAcao
          ncId={nc.id}
          tituloNC={nc.titulo}
          acao={modalAcao.acao}
          usuarios={usuarios}
          onClose={() => setModalAcao({ open: false })}
          onSalvo={() => { setModalAcao({ open: false }); router.refresh() }}
        />
      )}

      {modalConcluir.open && modalConcluir.acao && (
        <ModalConcluirAcao
          acaoId={modalConcluir.acao.id}
          descricaoAcao={modalConcluir.acao.descricao}
          ncId={nc.id}
          onClose={() => setModalConcluir({ open: false })}
          onConcluido={() => { setModalConcluir({ open: false }); router.refresh() }}
        />
      )}
    </div>
  )
}
