'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Eye, Pencil } from 'lucide-react'
import type { ChecklistItem } from '@prisma/client'
import type { ChecklistDetalhado, CriarItemInput } from '@/actions/checklist.actions'
import {
  adicionarItemAction,
  atualizarItemAction,
  removerItemAction,
  reordenarItensAction,
  atualizarChecklistAction,
} from '@/actions/checklist.actions'
import { SortableItemList } from '@/components/checklists/SortableItemList'
import { ItemConfigPanel } from '@/components/checklists/ItemConfigPanel'
import { PreviewChecklist } from '@/components/checklists/PreviewChecklist'
import { SaveIndicator } from '@/components/checklists/SaveIndicator'
import { CategoriaBadge } from '@/components/checklists/CategoriaBadge'
import { FREQUENCIA_LABEL } from '@/components/checklists/CategoriaConfig'
import { toast } from 'sonner'
import type { AutoSaveStatus } from '@/hooks/useAutoSave'

interface BuilderClientProps {
  checklist: ChecklistDetalhado
}

const ITEM_PADRAO: CriarItemInput = {
  pergunta: 'Nova pergunta',
  tipoResposta: 'SIM_NAO',
  obrigatorio: true,
  isCritico: false,
  fotoObrigatoria: false,
  peso: 1.0,
}

export function BuilderClient({ checklist: inicial }: BuilderClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [itens, setItens] = useState<ChecklistItem[]>(inicial.itens)
  const [itemSelecionadoId, setItemSelecionadoId] = useState<string | null>(
    inicial.itens[0]?.id ?? null
  )
  const [previewAberto, setPreviewAberto] = useState(false)
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle')

  const itemSelecionado = itens.find((i) => i.id === itemSelecionadoId) ?? null
  const totalCriticos = itens.filter((i) => i.isCritico).length
  const secoesDisponiveis = [...new Set(itens.map((i) => (i as any).secao).filter(Boolean))] as string[]

  async function withSaveStatus(fn: () => Promise<void>) {
    setSaveStatus('saving')
    try {
      await fn()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('erro')
    }
  }

  async function handleAdicionar() {
    await withSaveStatus(async () => {
      const result = await adicionarItemAction(inicial.id, ITEM_PADRAO)
      if ('erro' in result) throw new Error(result.erro)
      setItens((prev) => [...prev, result.item])
      setItemSelecionadoId(result.item.id)
      toast.success('Item adicionado!')
    })
  }

  async function handleSalvarItem(data: Partial<CriarItemInput>) {
    if (!itemSelecionadoId) return
    await withSaveStatus(async () => {
      const result = await atualizarItemAction(itemSelecionadoId, data)
      if ('erro' in result) throw new Error(result.erro)
      // Optimistic update
      setItens((prev) =>
        prev.map((it) =>
          it.id === itemSelecionadoId
            ? {
                ...it,
                pergunta: data.pergunta ?? it.pergunta,
                descricao: data.descricao !== undefined ? (data.descricao ?? null) : it.descricao,
                tipoResposta: data.tipoResposta ?? it.tipoResposta,
                obrigatorio: data.obrigatorio ?? it.obrigatorio,
                isCritico: data.isCritico ?? it.isCritico,
                fotoObrigatoria: data.fotoObrigatoria ?? it.fotoObrigatoria,
                valorMinimo: data.valorMinimo !== undefined ? data.valorMinimo ?? null : it.valorMinimo,
                valorMaximo: data.valorMaximo !== undefined ? data.valorMaximo ?? null : it.valorMaximo,
                unidade: data.unidade !== undefined ? (data.unidade ?? null) : it.unidade,
                opcoes: data.opcoes ?? it.opcoes,
                peso: data.peso ?? it.peso,
              }
            : it
        )
      )
    })
  }

  async function handleRemoverItem() {
    if (!itemSelecionadoId) return
    await withSaveStatus(async () => {
      const result = await removerItemAction(itemSelecionadoId)
      if ('erro' in result) throw new Error(result.erro)
      setItens((prev) => {
        const novos = prev.filter((it) => it.id !== itemSelecionadoId)
        setItemSelecionadoId(novos[0]?.id ?? null)
        return novos
      })
      toast.success('Item removido.')
    })
  }

  async function handleReordenar(idsNaOrdem: string[]) {
    // Optimistic update
    const mapaOrdem = new Map(idsNaOrdem.map((id, idx) => [id, idx]))
    setItens((prev) =>
      [...prev].sort((a, b) => (mapaOrdem.get(a.id) ?? 0) - (mapaOrdem.get(b.id) ?? 0))
    )

    await withSaveStatus(async () => {
      const result = await reordenarItensAction(inicial.id, idsNaOrdem)
      if ('erro' in result) throw new Error(result.erro)
    })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header do builder */}
      <div className="shrink-0 bg-white border-b border-neutral-200 px-5 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/checklists"
              className="flex items-center gap-1 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Checklists</span>
            </Link>
            <span className="text-neutral-300">/</span>
            <div className="flex items-center gap-2 min-w-0">
              <Pencil size={14} className="text-[#5A7089] shrink-0" />
              <h1 className="font-bold text-[#0F1B2D] font-heading truncate">{inicial.nome}</h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <SaveIndicator
              status={saveStatus}
              onRetry={() => setSaveStatus('idle')}
            />
            <button
              onClick={() => setPreviewAberto(true)}
              disabled={itens.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-neutral-200 rounded-xl text-sm font-medium text-[#5A7089] hover:border-[#0E2E60] hover:text-[#0E2E60] transition-colors disabled:opacity-40"
            >
              <Eye size={14} />
              Pré-visualizar
            </button>
          </div>
        </div>

        {/* Subtítulo */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <CategoriaBadge categoria={inicial.categoria} size="sm" />
          <span className="text-xs text-[#5A7089]">
            {FREQUENCIA_LABEL[inicial.frequencia]}
          </span>
          <span className="text-xs text-[#5A7089]">·</span>
          <span className="text-xs text-[#5A7089] font-medium">
            {itens.length} {itens.length === 1 ? 'item' : 'itens'}
          </span>
          {totalCriticos > 0 && (
            <>
              <span className="text-xs text-[#5A7089]">·</span>
              <span className="text-xs text-red-600 font-semibold">
                {totalCriticos} crítico{totalCriticos !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Layout split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Coluna esquerda — lista de itens */}
        <div className="w-[340px] shrink-0 border-r border-neutral-200 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-[10px] font-bold text-[#5A7089] uppercase tracking-widest">
              Itens do checklist
            </p>
          </div>
          <div className="flex-1 overflow-hidden px-3 py-3">
            <SortableItemList
              itens={itens}
              itemSelecionadoId={itemSelecionadoId}
              onSelecionar={setItemSelecionadoId}
              onReordenar={handleReordenar}
              onAdicionar={handleAdicionar}
              isSaving={isPending || saveStatus === 'saving'}
            />
          </div>
        </div>

        {/* Coluna direita — configurar item */}
        <div className="flex-1 bg-[#F5F9FD] overflow-hidden flex flex-col">
          {itemSelecionado ? (
            <>
              <div className="px-5 py-3 border-b border-neutral-200 bg-white shrink-0">
                <p className="text-[10px] font-bold text-[#5A7089] uppercase tracking-widest">
                  Configurar item
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ItemConfigPanel
                  key={itemSelecionado.id}
                  item={itemSelecionado}
                  onSalvar={handleSalvarItem}
                  onRemover={handleRemoverItem}
                  isSaving={saveStatus === 'saving'}
                  secoesDisponiveis={secoesDisponiveis}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-white border border-neutral-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Pencil size={24} className="text-[#A8BDD4]" />
                </div>
                <p className="font-semibold text-[#0F1B2D]">Selecione um item</p>
                <p className="text-sm text-[#5A7089] mt-1">
                  Clique em um item à esquerda para configurá-lo,<br />
                  ou adicione um novo item.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview modal */}
      <PreviewChecklist
        nome={inicial.nome}
        itens={itens}
        aberto={previewAberto}
        onFechar={() => setPreviewAberto(false)}
      />
    </div>
  )
}
