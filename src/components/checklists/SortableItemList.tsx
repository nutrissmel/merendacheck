'use client'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Plus, AlertCircle, Camera, Layers } from 'lucide-react'
import type { ChecklistItem } from '@prisma/client'
import { TIPO_RESPOSTA_LABEL } from './CategoriaConfig'
import { cn } from '@/lib/utils'

type ItemComSecao = ChecklistItem & { secao?: string | null }

interface SortableItemListProps {
  itens: ItemComSecao[]
  itemSelecionadoId: string | null
  onSelecionar: (itemId: string) => void
  onReordenar: (idsNaOrdem: string[]) => Promise<void>
  onAdicionar: () => void
  isSaving?: boolean
}

export function SortableItemList({
  itens,
  itemSelecionadoId,
  onSelecionar,
  onReordenar,
  onAdicionar,
  isSaving,
}: SortableItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = itens.findIndex((i) => i.id === active.id)
    const newIdx = itens.findIndex((i) => i.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const novosIds = arrayMove(itens, oldIdx, newIdx).map((i) => i.id)
    await onReordenar(novosIds)
  }

  // Agrupar itens por seção mantendo a ordem original
  const grupos: { secao: string | null; itens: ItemComSecao[] }[] = []
  for (const item of itens) {
    const secao = item.secao ?? null
    const ultimo = grupos[grupos.length - 1]
    if (ultimo && ultimo.secao === secao) {
      ultimo.itens.push(item)
    } else {
      grupos.push({ secao, itens: [item] })
    }
  }

  const temSecoes = itens.some((i) => i.secao)

  return (
    <div className="flex flex-col h-full">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itens.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {temSecoes ? (
              grupos.map((grupo, gi) => (
                <div key={gi}>
                  {/* Cabeçalho de seção */}
                  <div className={cn(
                    'flex items-center gap-2 px-2 mb-1',
                    gi > 0 && 'mt-3'
                  )}>
                    {grupo.secao ? (
                      <>
                        <Layers size={11} className="text-[#0E2E60] shrink-0" />
                        <span className="text-[10px] font-bold text-[#0E2E60] uppercase tracking-widest truncate">
                          {grupo.secao}
                        </span>
                        <div className="flex-1 h-px bg-[#D5E3F0]" />
                        <span className="text-[10px] text-[#5A7089] shrink-0">{grupo.itens.length}</span>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 h-px bg-neutral-200" />
                        <span className="text-[10px] text-neutral-400 shrink-0">Sem seção</span>
                        <div className="flex-1 h-px bg-neutral-200" />
                      </>
                    )}
                  </div>
                  {/* Itens do grupo */}
                  <div className="space-y-1">
                    {grupo.itens.map((item, idx) => {
                      const idxGlobal = itens.findIndex((i) => i.id === item.id)
                      return (
                        <SortableItem
                          key={item.id}
                          item={item}
                          index={idxGlobal}
                          isSelected={itemSelecionadoId === item.id}
                          onSelect={() => onSelecionar(item.id)}
                        />
                      )
                    })}
                  </div>
                </div>
              ))
            ) : (
              itens.map((item, idx) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  index={idx}
                  isSelected={itemSelecionadoId === item.id}
                  onSelect={() => onSelecionar(item.id)}
                />
              ))
            )}
          </div>
        </SortableContext>
      </DndContext>

      {itens.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-center py-12">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#EEF4FD] flex items-center justify-center mx-auto mb-3">
              <Plus size={20} className="text-[#0E2E60]" />
            </div>
            <p className="text-sm font-semibold text-[#0F1B2D]">Nenhum item ainda</p>
            <p className="text-xs text-[#5A7089] mt-1">Clique em "+ Adicionar item" para começar</p>
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-neutral-100 mt-3">
        <button
          onClick={onAdicionar}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border-2 border-dashed border-[#D5E3F0] text-sm font-medium text-[#5A7089] hover:border-[#0E2E60] hover:text-[#0E2E60] transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          Adicionar item
        </button>
      </div>
    </div>
  )
}

export function SortableItem({
  item,
  index,
  isSelected,
  onSelect,
}: {
  item: ItemComSecao
  index: number
  isSelected: boolean
  onSelect: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const perguntaTruncada =
    item.pergunta.length > 60 ? item.pergunta.slice(0, 60) + '…' : item.pergunta

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all select-none',
        isSelected
          ? 'border-[#0E2E60] bg-[#EEF4FD]'
          : 'border-neutral-200 bg-white hover:border-[#A8BDD4] hover:bg-[#F5F9FD]',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="mt-0.5 shrink-0 text-neutral-300 hover:text-[#5A7089] cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
        title="Arrastar para reordenar"
      >
        <GripVertical size={16} />
      </button>

      {/* Número */}
      <span className="w-6 h-6 rounded-full bg-[#0E2E60] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {index + 1}
      </span>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0F1B2D] leading-snug">{perguntaTruncada}</p>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-[#5A7089] bg-neutral-100 px-1.5 py-0.5 rounded">
            {TIPO_RESPOSTA_LABEL[item.tipoResposta] ?? item.tipoResposta}
          </span>
          {item.isCritico && (
            <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
              <AlertCircle size={10} /> Crítico
            </span>
          )}
          {item.fotoObrigatoria && (
            <span className="text-[10px] font-medium text-blue-600 flex items-center gap-0.5">
              <Camera size={10} /> Foto
            </span>
          )}
          {item.secao && (
            <span className="text-[10px] font-medium text-violet-600 flex items-center gap-0.5">
              <Layers size={10} /> {item.secao}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
