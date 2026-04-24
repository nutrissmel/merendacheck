'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  MoreHorizontal,
  Pencil,
  Eye,
  Copy,
  Power,
  PowerOff,
  Shield,
  ChevronRight,
  Trash2,
  X,
  Loader2,
  AlertCircle,
  CheckSquare,
  Hash,
  AlignLeft,
  List,
  Camera,
  BarChart2,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CategoriaBadge } from './CategoriaBadge'
import { CATEGORIA_CONFIG, FREQUENCIA_LABEL } from './CategoriaConfig'
import {
  toggleChecklistAtivoAction,
  duplicarChecklistAction,
  excluirChecklistAction,
  buscarChecklistById,
} from '@/actions/checklist.actions'
import type { ChecklistComContagem, ChecklistDetalhado } from '@/actions/checklist.actions'
import { ModalConfirmarExclusao } from '@/components/shared/ModalConfirmarExclusao'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const TIPO_LABEL: Record<string, { label: string; icon: React.ElementType }> = {
  SIM_NAO:          { label: 'Sim/Não',  icon: CheckSquare },
  NUMERICO:         { label: 'Numérico', icon: Hash },
  TEXTO_LIVRE:      { label: 'Texto',    icon: AlignLeft },
  MULTIPLA_ESCOLHA: { label: 'Múltipla', icon: List },
  FOTO:             { label: 'Foto',     icon: Camera },
  ESCALA:           { label: 'Escala',   icon: BarChart2 },
}

interface ChecklistCardProps {
  checklist: ChecklistComContagem
  podeEditar: boolean
  isSuperAdmin?: boolean
  onPreview?: (id: string) => void
}

export function ChecklistCard({ checklist, podeEditar, isSuperAdmin, onPreview }: ChecklistCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ativo, setAtivo] = useState(checklist.ativo)
  const [modalExclusao, setModalExclusao] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  // Preview
  const [previewAberto, setPreviewAberto] = useState(false)
  const [previewData, setPreviewData] = useState<ChecklistDetalhado | null>(null)
  const [carregandoPreview, setCarregandoPreview] = useState(false)

  const catConfig = CATEGORIA_CONFIG[checklist.categoria]
  const corBorda = catConfig.cor

  function handleToggleAtivo() {
    startTransition(async () => {
      const result = await toggleChecklistAtivoAction(checklist.id)
      if ('erro' in result) {
        toast.error(result.erro)
      } else {
        setAtivo(result.ativo)
        toast.success(result.ativo ? 'Checklist ativado!' : 'Checklist desativado.')
      }
    })
  }

  function handleDuplicar() {
    startTransition(async () => {
      const result = await duplicarChecklistAction(checklist.id)
      if ('erro' in result) {
        toast.error(result.erro)
      } else {
        toast.success('Checklist duplicado!')
        router.push(`/checklists/${result.checklistId}/editar`)
      }
    })
  }

  async function handlePreview() {
    if (onPreview) {
      onPreview(checklist.id)
      return
    }
    setCarregandoPreview(true)
    const data = await buscarChecklistById(checklist.id)
    setCarregandoPreview(false)
    if (data) {
      setPreviewData(data)
      setPreviewAberto(true)
    } else {
      toast.error('Não foi possível carregar o checklist.')
    }
  }

  async function handleExcluir(justificativa: string) {
    setExcluindo(true)
    const result = await excluirChecklistAction(checklist.id, justificativa)
    setExcluindo(false)
    if ('erro' in result) {
      toast.error(result.erro)
    } else {
      toast.success('Checklist excluído.')
      setModalExclusao(false)
      router.refresh()
    }
  }

  // Agrupa itens por seção
  const secoes = previewData
    ? Array.from(
        previewData.itens.reduce((map, item) => {
          const sec = item.secao ?? ''
          if (!map.has(sec)) map.set(sec, [])
          map.get(sec)!.push(item)
          return map
        }, new Map<string, typeof previewData.itens>())
      )
    : []

  return (
    <>
      <div
        className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(14,46,96,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(14,46,96,0.12)] transition-all duration-200 flex flex-col"
        style={{ borderLeftWidth: 4, borderLeftColor: corBorda }}
      >
        {/* Header card */}
        <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
          <CategoriaBadge categoria={checklist.categoria} categoriaPersonalizada={checklist.categoriaPersonalizada} size="sm" />

          <DropdownMenu>
            <DropdownMenuTrigger className="w-7 h-7 rounded-lg flex items-center justify-center text-[#5A7089] hover:bg-[#EEF4FD] hover:text-[#0E2E60] transition-colors shrink-0">
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {podeEditar && !checklist.isTemplate && (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={() => router.push(`/checklists/${checklist.id}/editar`)}
                >
                  <Pencil size={14} /> Editar checklist
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="flex items-center gap-2 cursor-pointer"
                onSelect={handlePreview}
                disabled={carregandoPreview}
              >
                {carregandoPreview ? (
                  <><Loader2 size={14} className="animate-spin" /> Carregando...</>
                ) : (
                  <><Eye size={14} /> Pré-visualizar</>
                )}
              </DropdownMenuItem>
              {podeEditar && (
                <DropdownMenuItem
                  className="flex items-center gap-2 cursor-pointer"
                  onSelect={handleDuplicar}
                  disabled={isPending}
                >
                  <Copy size={14} /> Duplicar
                </DropdownMenuItem>
              )}
              {podeEditar && !checklist.isTemplate && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onSelect={handleToggleAtivo}
                    disabled={isPending}
                  >
                    {ativo ? (
                      <><PowerOff size={14} className="text-red-500" /> Desativar</>
                    ) : (
                      <><Power size={14} className="text-green-600" /> Ativar</>
                    )}
                  </DropdownMenuItem>
                </>
              )}
              {isSuperAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                    onSelect={() => setModalExclusao(true)}
                  >
                    <Trash2 size={14} /> Excluir checklist
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Corpo */}
        <div className="px-4 pb-3 flex-1">
          <h3 className="font-bold text-[#0F1B2D] font-heading leading-snug mb-1">
            {checklist.nome}
          </h3>
          {checklist.descricao && (
            <p className="text-xs text-[#5A7089] line-clamp-2 leading-relaxed">
              {checklist.descricao}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-t border-neutral-100">
          <div className="flex items-center gap-3 text-xs text-[#5A7089] mb-2">
            <span className="font-medium">{checklist.totalItens} {checklist.totalItens === 1 ? 'item' : 'itens'}</span>
            {checklist.itensCriticos > 0 && (
              <span className="text-red-600 font-semibold">
                · {checklist.itensCriticos} crítico{checklist.itensCriticos !== 1 ? 's' : ''}
              </span>
            )}
            <span>· {FREQUENCIA_LABEL[checklist.frequencia]}</span>
          </div>

          {checklist.totalItens > 0 && checklist.itensCriticos > 0 && (
            <div className="h-1 bg-neutral-100 rounded-full overflow-hidden mb-3">
              <div
                className="h-full bg-red-400 rounded-full"
                style={{ width: `${Math.round((checklist.itensCriticos / checklist.totalItens) * 100)}%` }}
              />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[#5A7089]">
              {checklist.totalInspecoes} inspeç{checklist.totalInspecoes !== 1 ? 'ões' : 'ão'}
            </span>

            {checklist.isTemplate ? (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#0E2E60] bg-[#EEF4FD] px-1.5 py-0.5 rounded-md">
                <Shield size={9} /> Template PNAE
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-[#005C25] bg-[#D1F7E2] px-1.5 py-0.5 rounded-md">
                Personalizado
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
          {!checklist.isTemplate && podeEditar ? (
            <button
              onClick={handleToggleAtivo}
              disabled={isPending}
              className={cn(
                'flex items-center gap-1.5 text-xs font-semibold transition-colors',
                ativo ? 'text-[#00963A]' : 'text-[#5A7089]'
              )}
            >
              <span className={cn('w-3 h-3 rounded-full', ativo ? 'bg-[#00963A]' : 'bg-neutral-300')} />
              {ativo ? 'Ativo' : 'Inativo'}
            </button>
          ) : (
            <span className={cn('flex items-center gap-1.5 text-xs font-semibold', ativo ? 'text-[#00963A]' : 'text-[#5A7089]')}>
              <span className={cn('w-3 h-3 rounded-full', ativo ? 'bg-[#00963A]' : 'bg-neutral-300')} />
              {ativo ? 'Ativo' : 'Inativo'}
            </span>
          )}

          <Link
            href={`/checklists/${checklist.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-[#0E2E60] hover:text-[#133878] transition-colors"
          >
            Usar <ChevronRight size={14} />
          </Link>
        </div>
      </div>

      {/* Modal de pré-visualização */}
      <AnimatePresence>
        {previewAberto && previewData && (
          <>
            <motion.div
              key="preview-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setPreviewAberto(false)}
            />
            <motion.div
              key="preview-modal"
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl pointer-events-auto flex flex-col max-h-[85vh]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-6 pt-5 pb-4 border-b border-neutral-100 shrink-0">
                  <button
                    onClick={() => setPreviewAberto(false)}
                    className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded-lg hover:bg-neutral-100"
                  >
                    <X size={16} />
                  </button>
                  <CategoriaBadge categoria={previewData.categoria} categoriaPersonalizada={previewData.categoriaPersonalizada} size="sm" />
                  <h2 className="text-base font-bold text-[#0F1B2D] mt-2 pr-8 font-heading leading-tight">
                    {previewData.nome}
                  </h2>
                  {previewData.descricao && (
                    <p className="text-xs text-[#5A7089] mt-1 leading-relaxed">{previewData.descricao}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#5A7089]">
                    <span>{previewData.totalItens} itens</span>
                    {previewData.itensCriticos > 0 && (
                      <span className="text-red-600 font-semibold flex items-center gap-0.5">
                        <AlertCircle size={11} /> {previewData.itensCriticos} crítico{previewData.itensCriticos !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span>· {FREQUENCIA_LABEL[previewData.frequencia]}</span>
                  </div>
                </div>

                {/* Items list */}
                <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
                  {previewData.itens.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-8">Nenhum item cadastrado.</p>
                  ) : (
                    secoes.map(([secao, itens]) => (
                      <div key={secao}>
                        {secao && (
                          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5A7089] mb-2 pb-1 border-b border-neutral-100">
                            {secao}
                          </div>
                        )}
                        <div className="space-y-2">
                          {itens.map((item, idx) => {
                            const tipo = TIPO_LABEL[item.tipoResposta]
                            const TipoIcon = tipo?.icon
                            return (
                              <div key={item.id} className="flex items-start gap-3 py-2 border-b border-neutral-50 last:border-0">
                                <span className="w-5 h-5 rounded-full bg-[#EEF4FD] text-[#0E2E60] text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[#0F1B2D] leading-snug">{item.pergunta}</p>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    {TipoIcon && (
                                      <span className="flex items-center gap-1 text-[10px] text-[#5A7089] bg-neutral-100 px-1.5 py-0.5 rounded">
                                        <TipoIcon size={9} /> {tipo.label}
                                      </span>
                                    )}
                                    {item.isCritico && (
                                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                        <AlertCircle size={9} /> Crítico
                                      </span>
                                    )}
                                    {!item.obrigatorio && (
                                      <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">Opcional</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 shrink-0 flex gap-3">
                  <button
                    onClick={() => setPreviewAberto(false)}
                    className="flex-1 py-2 rounded-xl border border-neutral-200 text-sm font-semibold text-[#5A7089] hover:bg-neutral-50 transition-colors"
                  >
                    Fechar
                  </button>
                  <Link
                    href={`/checklists/${previewData.id}`}
                    onClick={() => setPreviewAberto(false)}
                    className="flex-1 py-2 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold text-center hover:bg-[#133878] transition-colors"
                  >
                    Usar este checklist →
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ModalConfirmarExclusao
        aberto={modalExclusao}
        titulo={`Excluir "${checklist.nome}"?`}
        descricao="Todas as inspeções, respostas, não conformidades e agendamentos vinculados a este checklist também serão excluídos permanentemente."
        placeholder="Ex: Checklist duplicado, criado por engano, substituído por versão atualizada..."
        carregando={excluindo}
        onFechar={() => setModalExclusao(false)}
        onConfirmar={handleExcluir}
      />
    </>
  )
}
