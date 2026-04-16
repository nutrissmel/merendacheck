'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Camera } from 'lucide-react'
import type { ChecklistItem } from '@prisma/client'
import { TIPO_RESPOSTA_LABEL } from './CategoriaConfig'

interface PreviewChecklistProps {
  nome: string
  itens: ChecklistItem[]
  aberto: boolean
  onFechar: () => void
}

export function PreviewChecklist({ nome, itens, aberto, onFechar }: PreviewChecklistProps) {
  const [itemAtual, setItemAtual] = useState(0)
  const [respostas, setRespostas] = useState<Record<string, unknown>>({})

  if (!aberto) return null

  const item = itens[itemAtual]
  if (!item) return null

  const progresso = Math.round(((itemAtual + 1) / itens.length) * 100)

  function avancar() {
    if (itemAtual < itens.length - 1) setItemAtual((i) => i + 1)
  }

  function voltar() {
    if (itemAtual > 0) setItemAtual((i) => i - 1)
  }

  function setResposta(valor: unknown) {
    setRespostas((prev) => ({ ...prev, [item.id]: valor }))
  }

  const resposta = respostas[item.id]

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 flex items-center justify-center p-4">
      {/* Container mobile simulado */}
      <div className="relative bg-[#F5F9FD] rounded-2xl overflow-hidden shadow-2xl w-full max-w-[390px]">
        {/* Badge MODO PREVIEW */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10">
          <span className="px-3 py-1 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wide">
            Modo Preview
          </span>
        </div>

        {/* Header */}
        <div className="bg-[#0E2E60] px-4 pt-8 pb-4 text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/70 font-medium">
              Item {itemAtual + 1} de {itens.length}
            </span>
            <button
              onClick={onFechar}
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${progresso}%` }}
            />
          </div>

          <p className="text-xs text-white/70 mt-1">{progresso}% concluído</p>
        </div>

        {/* Corpo do item */}
        <div className="p-5 min-h-[320px]">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-3">
            {item.isCritico && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full">
                🔴 Crítico
              </span>
            )}
            {item.fotoObrigatoria && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">
                📸 Foto obrigatória
              </span>
            )}
          </div>

          {/* Pergunta */}
          <h2 className="text-base font-semibold text-[#0F1B2D] leading-snug mb-2">
            {item.pergunta}
            {item.obrigatorio && <span className="text-red-500 ml-1">*</span>}
          </h2>

          {item.descricao && (
            <p className="text-sm text-[#5A7089] mb-4 leading-relaxed">{item.descricao}</p>
          )}

          {/* Controle de resposta */}
          <div className="mt-4">
            <PreviewControle item={item} resposta={resposta} onChange={setResposta} />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <button
            onClick={voltar}
            disabled={itemAtual === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#D5E3F0] text-sm font-medium text-[#5A7089] disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0E2E60] hover:text-[#0E2E60] transition-colors"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>

          <button
            onClick={avancar}
            disabled={itemAtual === itens.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2E60] text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#133878] transition-colors"
          >
            Próximo
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewControle({
  item,
  resposta,
  onChange,
}: {
  item: ChecklistItem
  resposta: unknown
  onChange: (v: unknown) => void
}) {
  if (item.tipoResposta === 'SIM_NAO') {
    return (
      <div className="flex gap-2">
        {['SIM', 'NÃO', 'N/A'].map((op) => (
          <button
            key={op}
            onClick={() => onChange(op)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
              resposta === op
                ? op === 'SIM'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : op === 'NÃO'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-neutral-400 bg-neutral-100 text-neutral-600'
                : 'border-[#D5E3F0] text-[#5A7089] hover:border-[#0E2E60]'
            }`}
          >
            {op}
          </button>
        ))}
      </div>
    )
  }

  if (item.tipoResposta === 'NUMERICO') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={typeof resposta === 'number' ? resposta : ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          min={item.valorMinimo ?? undefined}
          max={item.valorMaximo ?? undefined}
          placeholder="0"
          className="flex-1 h-12 px-4 text-lg border-2 border-[#D5E3F0] rounded-xl focus:outline-none focus:border-[#0E2E60] text-center font-semibold"
        />
        {item.unidade && (
          <span className="text-sm font-semibold text-[#5A7089]">{item.unidade}</span>
        )}
      </div>
    )
  }

  if (item.tipoResposta === 'TEXTO_LIVRE') {
    return (
      <textarea
        value={typeof resposta === 'string' ? resposta : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Digite sua observação..."
        rows={4}
        className="w-full px-4 py-3 border-2 border-[#D5E3F0] rounded-xl text-sm focus:outline-none focus:border-[#0E2E60] resize-none"
      />
    )
  }

  if (item.tipoResposta === 'MULTIPLA_ESCOLHA') {
    return (
      <div className="space-y-2">
        {item.opcoes.map((op) => (
          <button
            key={op}
            onClick={() => onChange(op)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm text-left transition-all ${
              resposta === op
                ? 'border-[#0E2E60] bg-[#EEF4FD] font-semibold text-[#0E2E60]'
                : 'border-[#D5E3F0] text-[#0F1B2D] hover:border-[#0E2E60]/50'
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                resposta === op ? 'border-[#0E2E60] bg-[#0E2E60]' : 'border-[#A8BDD4]'
              }`}
            />
            {op}
          </button>
        ))}
      </div>
    )
  }

  if (item.tipoResposta === 'FOTO') {
    return (
      <div className="flex items-center justify-center h-32 border-2 border-dashed border-[#D5E3F0] rounded-xl bg-white">
        <div className="text-center">
          <Camera size={28} className="text-[#A8BDD4] mx-auto mb-2" />
          <p className="text-sm text-[#5A7089] font-medium">Tirar foto</p>
        </div>
      </div>
    )
  }

  if (item.tipoResposta === 'ESCALA') {
    const escala = [1, 2, 3, 4, 5]
    return (
      <div>
        <div className="flex gap-2">
          {escala.map((v) => (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={`flex-1 h-12 rounded-xl border-2 text-sm font-bold transition-all ${
                resposta === v
                  ? 'border-[#0E2E60] bg-[#0E2E60] text-white'
                  : 'border-[#D5E3F0] text-[#5A7089] hover:border-[#0E2E60]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-neutral-400">
          <span>Ruim</span>
          <span>Ótimo</span>
        </div>
      </div>
    )
  }

  return null
}
