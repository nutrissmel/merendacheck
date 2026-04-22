'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ThumbsUp, ThumbsDown, Minus, Camera, MessageSquare,
  ChevronRight, CheckCircle2, AlertCircle,
} from 'lucide-react'
import { useInspecao } from '@/hooks/useInspecao'
import { useSwipe } from '@/hooks/useSwipe'
import { cancelarInspecaoAction } from '@/actions/inspecao.actions'
import { ProgressoMobile } from '@/components/inspecao/mobile/ProgressoMobile'
import { ObservacaoBottomSheet } from '@/components/inspecao/ObservacaoBottomSheet'
import { FotoItem } from '@/components/inspecao/FotoItem'
import { RespostaNumerica } from '@/components/inspecao/RespostaNumerica'
import { RespostaTextoLivre } from '@/components/inspecao/RespostaTextoLivre'
import { RespostaMultiplaEscolha } from '@/components/inspecao/RespostaMultiplaEscolha'
import { RespostaEscala } from '@/components/inspecao/RespostaEscala'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
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
}

type TransitionDir = 'left' | 'right' | null

export function MobileInspecao({ inspecao }: Props) {
  const router = useRouter()
  const [obsOpen, setObsOpen] = useState(false)
  const [fotoOpen, setFotoOpen] = useState(false)
  const [transitionDir, setTransitionDir] = useState<TransitionDir>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const {
    respostas,
    scoreAtual,
    itemAtualIndex,
    itemAtual,
    totalItens,
    totalRespondidos,
    responderItem,
    atualizarFoto,
    atualizarObservacao,
    irParaProximo,
    irParaAnterior,
    podeFinalizarInspecao,
  } = useInspecao({
    inspecaoId: inspecao.id,
    itens: inspecao.checklist.itens,
    respostasIniciais: inspecao.respostas as any,
  })

  const percentual = totalItens > 0 ? Math.round((totalRespondidos / totalItens) * 100) : 0

  function animateTransition(dir: TransitionDir, action: () => void) {
    if (isAnimating) return
    setTransitionDir(dir)
    setIsAnimating(true)
    setTimeout(() => {
      action()
      setTransitionDir(null)
      setIsAnimating(false)
    }, 200)
  }

  function handleProximo() {
    if (itemAtualIndex < totalItens - 1) {
      animateTransition('left', irParaProximo)
    }
  }

  function handleAnterior() {
    if (itemAtualIndex > 0) {
      animateTransition('right', irParaAnterior)
    }
  }

  const { onTouchStart, onTouchMove, onTouchEnd, deltaX } = useSwipe(
    handleProximo,
    handleAnterior,
    50
  )

  async function handleCancelar() {
    const result = await cancelarInspecaoAction(inspecao.id)
    if ('erro' in result) {
      toast.error(result.erro)
    } else {
      router.push('/inspecoes')
    }
  }

  const respostaAtual = itemAtual ? respostas.get(itemAtual.id) : undefined
  const conforme = respostaAtual?.conforme

  // Card transform during swipe
  const cardTransform = transitionDir
    ? `translateX(${transitionDir === 'left' ? '-100%' : '100%'})`
    : deltaX !== 0
    ? `translateX(${deltaX}px)`
    : 'translateX(0)'

  const cardOpacity = transitionDir ? 0 : Math.max(0.3, 1 - Math.abs(deltaX) / 300)

  if (!itemAtual) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#5A7089]">Nenhum item disponível.</p>
      </div>
    )
  }

  const TAP_STYLE: React.CSSProperties = {
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  return (
    <div className="min-h-screen bg-[#F5F9FD] flex flex-col" style={{ userSelect: 'none' }}>
      {/* Fixed header + progress */}
      <ProgressoMobile
        itemAtual={itemAtualIndex + 1}
        totalItens={totalItens}
        escola={inspecao.escola.nome}
        percentual={percentual}
        onCancelar={handleCancelar}
      />

      {/* Spacer for fixed header (56px header + 4px progress bar) */}
      <div className="h-[60px] shrink-0" />

      {/* Scrollable content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Item card — swipeable */}
        <div
          className="flex-1 flex flex-col px-4 pt-5 pb-4 overflow-y-auto"
          style={{
            transform: cardTransform,
            opacity: cardOpacity,
            transition: isAnimating ? 'transform 200ms ease-out, opacity 200ms ease-out' : 'none',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {itemAtual.isCritico && (
              <span
                role="status"
                className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg"
              >
                <AlertCircle size={12} /> Item Crítico
              </span>
            )}
            {itemAtual.fotoObrigatoria && (
              <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                <Camera size={12} /> Foto obrigatória
              </span>
            )}
          </div>

          {/* Question */}
          <h2
            className="font-bold text-[#0F1B2D] leading-snug mb-2"
            style={{ fontSize: 20, fontFamily: 'var(--font-heading)' }}
          >
            {itemAtual.pergunta}
            {itemAtual.obrigatorio && (
              <span className="text-red-400 ml-1" aria-hidden="true">*</span>
            )}
          </h2>

          {itemAtual.descricao && (
            <p className="text-[#5A7089] leading-relaxed mb-4" style={{ fontSize: 14 }}>
              {itemAtual.descricao}
            </p>
          )}

          {/* Score pill */}
          <div
            className="flex items-center gap-2 mb-5"
            aria-live="polite"
            aria-label={`Score atual: ${scoreAtual}%`}
          >
            <span className="text-xs text-[#5A7089]">Score:</span>
            <span className="text-sm font-bold text-[#0E2E60]">{scoreAtual}%</span>
          </div>

          {/* Response area */}
          <div className="space-y-3">
            {itemAtual.tipoResposta === 'SIM_NAO' && (
              <>
                {/* SIM */}
                <button
                  onClick={() => responderItem(itemAtual.id, {
                    respostaSimNao: true, conforme: true,
                    observacao: respostaAtual?.observacao,
                    fotoUrl: respostaAtual?.fotoUrl,
                  })}
                  aria-label="Responder Sim para este item"
                  aria-pressed={conforme === true}
                  className={cn(
                    'w-full rounded-2xl flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98]',
                    conforme === true
                      ? 'bg-[#00963A] text-white'
                      : 'bg-[#D1F7E2] text-[#00963A] border-2 border-[#00963A]'
                  )}
                  style={{ minHeight: 80, fontSize: 20, ...TAP_STYLE }}
                >
                  <ThumbsUp size={24} /> SIM
                </button>

                {/* NÃO */}
                <button
                  onClick={() => responderItem(itemAtual.id, {
                    respostaSimNao: false, conforme: false,
                    observacao: respostaAtual?.observacao,
                    fotoUrl: respostaAtual?.fotoUrl,
                  })}
                  aria-label="Responder Não para este item"
                  aria-pressed={conforme === false}
                  className={cn(
                    'w-full rounded-2xl flex items-center justify-center gap-3 font-bold transition-all active:scale-[0.98]',
                    conforme === false
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-[#FEE2E2] text-[#DC2626] border-2 border-[#DC2626]'
                  )}
                  style={{ minHeight: 80, fontSize: 20, ...TAP_STYLE }}
                >
                  <ThumbsDown size={24} /> NÃO
                </button>

                {/* N/A */}
                <button
                  onClick={() => responderItem(itemAtual.id, {
                    respostaSimNao: undefined, conforme: null,
                    observacao: respostaAtual?.observacao,
                    fotoUrl: respostaAtual?.fotoUrl,
                  })}
                  aria-label="Marcar como não aplicável"
                  className={cn(
                    'w-full rounded-2xl flex items-center justify-center gap-2 font-medium transition-all active:scale-[0.98]',
                    conforme === null && respostaAtual !== undefined
                      ? 'bg-neutral-200 text-neutral-600 border-2 border-neutral-400'
                      : 'bg-[#EEF4FD] text-[#5A7089] border-2 border-[#D5E3F0]'
                  )}
                  style={{ minHeight: 56, fontSize: 16, ...TAP_STYLE }}
                >
                  <Minus size={18} /> Não se aplica
                </button>
              </>
            )}

            {itemAtual.tipoResposta === 'NUMERICO' && (
              <RespostaNumerica
                valor={respostaAtual?.respostaNumerica}
                valorMinimo={itemAtual.valorMinimo}
                valorMaximo={itemAtual.valorMaximo}
                unidade={itemAtual.unidade}
                onChange={(v, conf) => responderItem(itemAtual.id, {
                  respostaNumerica: v, conforme: conf,
                  observacao: respostaAtual?.observacao,
                  fotoUrl: respostaAtual?.fotoUrl,
                })}
              />
            )}

            {itemAtual.tipoResposta === 'TEXTO_LIVRE' && (
              <RespostaTextoLivre
                valor={respostaAtual?.respostaTexto}
                onChange={(v, conf) => responderItem(itemAtual.id, {
                  respostaTexto: v, conforme: conf,
                  observacao: respostaAtual?.observacao,
                  fotoUrl: respostaAtual?.fotoUrl,
                })}
              />
            )}

            {itemAtual.tipoResposta === 'MULTIPLA_ESCOLHA' && (
              <RespostaMultiplaEscolha
                opcoes={itemAtual.opcoes}
                valor={respostaAtual?.respostaTexto}
                onChange={(v, conf) => responderItem(itemAtual.id, {
                  respostaTexto: v, conforme: conf,
                  observacao: respostaAtual?.observacao,
                  fotoUrl: respostaAtual?.fotoUrl,
                })}
              />
            )}

            {itemAtual.tipoResposta === 'FOTO' && (
              <FotoItem
                inspecaoId={inspecao.id}
                itemId={itemAtual.id}
                fotoUrlInicial={respostaAtual?.fotoUrl}
                onFotoSalva={(url) => {
                  atualizarFoto(itemAtual.id, url)
                  if (!respostaAtual?.conforme) {
                    responderItem(itemAtual.id, { conforme: true, fotoUrl: url })
                  }
                }}
              />
            )}

            {itemAtual.tipoResposta === 'ESCALA' && (
              <RespostaEscala
                valor={respostaAtual?.respostaNumerica}
                min={itemAtual.valorMinimo ?? 1}
                max={itemAtual.valorMaximo ?? 5}
                onChange={(v, conf) => responderItem(itemAtual.id, {
                  respostaNumerica: v, conforme: conf,
                  observacao: respostaAtual?.observacao,
                  fotoUrl: respostaAtual?.fotoUrl,
                })}
              />
            )}

            {/* Conformity feedback */}
            {conforme !== undefined && conforme !== null && (
              <div
                role="status"
                aria-live="polite"
                className={cn(
                  'px-4 py-2.5 rounded-xl text-sm font-semibold',
                  conforme ? 'bg-[#D1F7E2] text-[#005C25]' : 'bg-[#FEE2E2] text-[#DC2626]'
                )}
              >
                {conforme ? '✓ Conforme' : '✗ Não conforme'}
                {!conforme && itemAtual.isCritico && ' — Gera NC Crítica'}
              </div>
            )}
          </div>
        </div>

        {/* Bottom toolbar */}
        <div className="shrink-0 bg-white border-t border-[#D5E3F0] safe-area-bottom">
          <div className="flex items-center px-4 gap-2" style={{ height: 56 }}>
            {/* Obs button */}
            <button
              onClick={() => setObsOpen(true)}
              aria-label="Adicionar observação"
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border border-[#D5E3F0] text-[#5A7089] text-sm font-medium"
              style={TAP_STYLE}
            >
              <MessageSquare size={16} />
              {respostaAtual?.observacao ? 'Obs ✓' : 'Obs'}
            </button>

            {/* Foto button */}
            <button
              onClick={() => setFotoOpen(true)}
              aria-label="Adicionar foto"
              className={cn(
                'flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-medium',
                respostaAtual?.fotoUrl
                  ? 'border-blue-400 text-blue-600 bg-blue-50'
                  : 'border-[#D5E3F0] text-[#5A7089]'
              )}
              style={TAP_STYLE}
            >
              <Camera size={16} />
              {respostaAtual?.fotoUrl ? 'Foto ✓' : 'Foto'}
            </button>

            {/* Next / Finalize */}
            {itemAtualIndex < totalItens - 1 ? (
              <button
                onClick={handleProximo}
                aria-label="Próximo item"
                className="flex items-center justify-center gap-1 px-4 h-10 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl"
                style={TAP_STYLE}
              >
                Próx <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={() => router.push(`/inspecoes/${inspecao.id}/finalizar`)}
                disabled={!podeFinalizarInspecao}
                aria-label="Finalizar inspeção"
                className={cn(
                  'flex items-center justify-center gap-1 px-3 h-10 text-sm font-semibold rounded-xl',
                  podeFinalizarInspecao
                    ? 'bg-[#00963A] text-white'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                )}
                style={TAP_STYLE}
              >
                <CheckCircle2 size={15} /> Finalizar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Observação bottom sheet */}
      <ObservacaoBottomSheet
        aberto={obsOpen}
        valorInicial={respostaAtual?.observacao}
        onFechar={() => setObsOpen(false)}
        onSalvar={(obs) => atualizarObservacao(itemAtual.id, obs)}
      />

      {/* Foto bottom sheet */}
      {fotoOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setFotoOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-5 space-y-4 shadow-2xl">
            <div className="w-10 h-1 bg-neutral-300 rounded-full mx-auto" />
            <h3 className="text-base font-bold text-[#0F1B2D]">Foto do item</h3>
            <FotoItem
              inspecaoId={inspecao.id}
              itemId={itemAtual.id}
              fotoUrlInicial={respostaAtual?.fotoUrl}
              onFotoSalva={(url) => {
                atualizarFoto(itemAtual.id, url)
                setFotoOpen(false)
              }}
            />
            <button
              onClick={() => setFotoOpen(false)}
              className="w-full h-12 border border-neutral-200 text-[#5A7089] font-medium rounded-xl"
              style={TAP_STYLE}
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  )
}
