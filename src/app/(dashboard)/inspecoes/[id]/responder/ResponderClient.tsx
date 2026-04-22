'use client'

import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, CheckCircle2, AlertCircle,
  Loader2, List, X,
} from 'lucide-react'
import { useInspecao } from '@/hooks/useInspecao'
import { useIsMobile } from '@/hooks/useIsMobile'
import { ItemInspecao } from '@/components/inspecao/ItemInspecao'
import { MobileInspecao } from './MobileInspecao'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import type { ChecklistItem, RespostaItem } from '@prisma/client'

type InspecaoData = {
  id: string
  status: string
  inspetorId: string
  escola: { id: string; nome: string }
  checklist: {
    id: string
    nome: string
    categoria: string
    itens: ChecklistItem[]
  }
  respostas: Pick<RespostaItem, 'id' | 'itemId' | 'respostaSimNao' | 'respostaNumerica' | 'respostaTexto' | 'conforme' | 'fotoUrl' | 'observacao'>[]
}

interface Props {
  inspecao: InspecaoData
  usuarioId: string
}

export function ResponderClient({ inspecao, usuarioId }: Props) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [mostrarNavegacao, setMostrarNavegacao] = useState(false)

  // Render full-screen mobile UX on small screens
  if (isMobile) {
    return <MobileInspecao inspecao={inspecao} />
  }

  const {
    respostas,
    scoreAtual,
    itemAtualIndex,
    itemAtual,
    totalItens,
    totalRespondidos,
    itensPendentes,
    salvando,
    responderItem,
    atualizarFoto,
    atualizarObservacao,
    irParaProximo,
    irParaAnterior,
    irParaItem,
    podeFinalizarInspecao,
  } = useInspecao({
    inspecaoId: inspecao.id,
    itens: inspecao.checklist.itens,
    respostasIniciais: inspecao.respostas as any,
  })

  const progressoPct = totalItens > 0 ? Math.round((totalRespondidos / totalItens) * 100) : 0

  if (!itemAtual) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center text-neutral-400">
        <p>Nenhum item disponível neste checklist.</p>
      </div>
    )
  }

  const respostaAtual = respostas.get(itemAtual.id)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-[#5A7089] truncate">{inspecao.escola.nome}</p>
          <p className="text-sm font-semibold text-[#0F1B2D] truncate">{inspecao.checklist.nome}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {salvando && <Loader2 size={14} className="animate-spin text-[#5A7089]" />}
          <button
            onClick={() => setMostrarNavegacao(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#D5E3F0] rounded-lg text-xs font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
          >
            <List size={13} /> Itens
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-[#5A7089]">
          <span>{itemAtualIndex + 1} / {totalItens}</span>
          <span>{totalRespondidos} respondido{totalRespondidos !== 1 ? 's' : ''} · {progressoPct}%</span>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#0E2E60] rounded-full transition-all duration-300"
            style={{ width: `${progressoPct}%` }}
          />
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-[#D5E3F0] rounded-xl">
        <div className="text-2xl font-bold text-[#0E2E60]">{scoreAtual}%</div>
        <div className="text-xs text-[#5A7089]">Score atual de conformidade</div>
      </div>

      {/* Item card */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-5">
        <ItemInspecao
          item={itemAtual}
          resposta={respostaAtual}
          inspecaoId={inspecao.id}
          onResponder={(r) => responderItem(itemAtual.id, r)}
          onAtualizarFoto={(url) => atualizarFoto(itemAtual.id, url)}
          onAtualizarObservacao={(obs) => atualizarObservacao(itemAtual.id, obs)}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={irParaAnterior}
          disabled={itemAtualIndex === 0}
          className="flex items-center gap-1 px-4 py-2.5 border border-[#D5E3F0] rounded-xl text-sm font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        {itemAtualIndex < totalItens - 1 ? (
          <button
            onClick={irParaProximo}
            className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors"
          >
            Próximo <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => router.push(`/inspecoes/${inspecao.id}/finalizar`)}
            disabled={!podeFinalizarInspecao}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-colors',
              podeFinalizarInspecao
                ? 'bg-[#00963A] text-white hover:bg-[#007830]'
                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
            )}
          >
            <CheckCircle2 size={16} />
            {podeFinalizarInspecao ? 'Finalizar Inspeção' : `${itensPendentes.length} pendente${itensPendentes.length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-400">
        <span>S = Sim</span>
        <span>N = Não</span>
        <span>A = N/A</span>
        <span>← → Navegar</span>
      </div>

      {/* Navigation drawer */}
      {mostrarNavegacao && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMostrarNavegacao(false)} />
          <div className="relative ml-auto w-72 bg-white h-full shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-100 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-[#0F1B2D]">Itens ({totalItens})</h3>
              <button onClick={() => setMostrarNavegacao(false)}>
                <X size={18} className="text-[#5A7089]" />
              </button>
            </div>

            <div className="divide-y divide-neutral-100">
              {inspecao.checklist.itens.map((item, idx) => {
                const r = respostas.get(item.id)
                const respondido = r && r.conforme !== undefined
                const conforme = r?.conforme

                return (
                  <button
                    key={item.id}
                    onClick={() => { irParaItem(idx); setMostrarNavegacao(false) }}
                    className={cn(
                      'w-full px-4 py-3 text-left flex items-start gap-3 transition-colors',
                      idx === itemAtualIndex ? 'bg-[#EEF4FD]' : 'hover:bg-neutral-50'
                    )}
                  >
                    <span className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5',
                      conforme === true ? 'bg-[#D1F7E2] text-[#005C25]' :
                      conforme === false ? 'bg-red-50 text-red-700' :
                      idx === itemAtualIndex ? 'bg-[#0E2E60] text-white' :
                      'bg-neutral-100 text-neutral-500'
                    )}>
                      {conforme === true ? '✓' : conforme === false ? '✗' : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#0F1B2D] line-clamp-2 leading-snug">
                        {item.pergunta}
                        {item.obrigatorio && <span className="text-red-400 ml-0.5">*</span>}
                      </p>
                      {item.isCritico && (
                        <span className="text-[10px] text-red-600 flex items-center gap-0.5 mt-0.5">
                          <AlertCircle size={8} /> Crítico
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-neutral-100 p-4">
              <button
                onClick={() => { router.push(`/inspecoes/${inspecao.id}/finalizar`); setMostrarNavegacao(false) }}
                disabled={!podeFinalizarInspecao}
                className={cn(
                  'w-full py-2.5 text-sm font-semibold rounded-xl transition-colors',
                  podeFinalizarInspecao
                    ? 'bg-[#00963A] text-white hover:bg-[#007830]'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                )}
              >
                Finalizar Inspeção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
