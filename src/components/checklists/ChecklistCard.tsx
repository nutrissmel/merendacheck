'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
} from '@/actions/checklist.actions'
import type { ChecklistComContagem } from '@/actions/checklist.actions'
import { ModalConfirmarExclusao } from '@/components/shared/ModalConfirmarExclusao'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

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
              onSelect={() => onPreview?.(checklist.id)}
            >
              <Eye size={14} /> Pré-visualizar
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

        {/* Barra de críticos */}
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
        {/* Toggle ativo */}
        {!checklist.isTemplate && podeEditar ? (
          <button
            onClick={handleToggleAtivo}
            disabled={isPending}
            className={cn(
              'flex items-center gap-1.5 text-xs font-semibold transition-colors',
              ativo ? 'text-[#00963A]' : 'text-[#5A7089]'
            )}
          >
            <span className={cn(
              'w-3 h-3 rounded-full',
              ativo ? 'bg-[#00963A]' : 'bg-neutral-300'
            )} />
            {ativo ? 'Ativo' : 'Inativo'}
          </button>
        ) : (
          <span className={cn(
            'flex items-center gap-1.5 text-xs font-semibold',
            ativo ? 'text-[#00963A]' : 'text-[#5A7089]'
          )}>
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

    <ModalConfirmarExclusao
      aberto={modalExclusao}
      titulo={`Excluir "${checklist.nome}"?`}
      descricao={`Todas as inspeções, respostas, não conformidades e agendamentos vinculados a este checklist também serão excluídos permanentemente.`}
      placeholder="Ex: Checklist duplicado, criado por engano, substituído por versão atualizada..."
      carregando={excluindo}
      onFechar={() => setModalExclusao(false)}
      onConfirmar={handleExcluir}
    />
    </>
  )
}
