'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, AlertCircle,
  Loader2, Trash2,
} from 'lucide-react'
import { finalizarInspecaoAction } from '@/actions/inspecao.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ItemReprovado {
  id: string
  pergunta: string
  isCritico: boolean
}

interface Props {
  inspecaoId: string
  escolaNome: string
  checklistNome: string
  score: number
  scoreStatus: string
  totalConformes: number
  totalNaoConformes: number
  totalNA: number
  itensReprovados: ItemReprovado[]
  itensPendentes: { id: string; pergunta: string }[]
}

const scoreStatusConfig: Record<string, { label: string; cor: string }> = {
  CONFORME:    { label: 'Conforme',     cor: 'text-[#00963A]' },
  ATENCAO:     { label: 'Atenção',      cor: 'text-amber-500' },
  NAO_CONFORME:{ label: 'Não Conforme', cor: 'text-red-600'   },
  REPROVADO:   { label: 'Reprovado',    cor: 'text-red-800'   },
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function FinalizacaoMobile({
  inspecaoId,
  score,
  scoreStatus,
  totalConformes,
  totalNaoConformes,
  totalNA,
  itensReprovados,
  itensPendentes,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [assinaturaDataUrl, setAssinaturaDataUrl] = useState<string | null>(null)

  const statusConfig = scoreStatusConfig[scoreStatus] ?? scoreStatusConfig.NAO_CONFORME
  const podeFinalizar = itensPendentes.length === 0

  function finalizar() {
    startTransition(async () => {
      const result = await finalizarInspecaoAction({
        inspecaoId,
        assinaturaUrl: assinaturaDataUrl ?? undefined,
      })

      if ('erro' in result) {
        toast.error(result.erro)
        return
      }

      router.push(`/inspecoes/${inspecaoId}`)
    })
  }

  return (
    <div className="min-h-screen bg-[#F5F9FD] flex flex-col">
      {/* Header */}
      <div className="bg-[#0E2E60] flex items-center justify-between px-4 h-14 shrink-0">
        <button
          onClick={() => router.push(`/inspecoes/${inspecaoId}/responder`)}
          className="flex items-center gap-1.5 text-white/80 text-sm font-medium"
          style={TAP}
          aria-label="Voltar para revisar"
        >
          <ArrowLeft size={18} /> Revisar
        </button>
        <span className="text-white font-semibold text-sm">Finalizar</span>
        <div className="w-20" />
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Score hero */}
        <div className="bg-white px-4 py-8 text-center border-b border-[#D5E3F0]">
          <div
            className={cn('text-6xl font-bold mb-1', statusConfig.cor)}
            aria-live="polite"
          >
            {score}%
          </div>
          <div className={cn('text-lg font-bold mb-4', statusConfig.cor)}>
            {statusConfig.label}
          </div>
          <div className="flex items-center justify-center gap-4 text-sm text-[#5A7089]">
            <span className="text-[#00963A] font-semibold">✓ {totalConformes}</span>
            <span className="text-red-600 font-semibold">✗ {totalNaoConformes}</span>
            {totalNA > 0 && <span className="text-neutral-400">— {totalNA}</span>}
          </div>
        </div>

        {/* Pending items warning */}
        {itensPendentes.length > 0 && (
          <div className="mx-4 mt-4 p-4 bg-[#FEF3C7] border border-amber-300 rounded-xl" role="alert">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
              <AlertCircle size={16} aria-hidden="true" />
              {itensPendentes.length} item(ns) obrigatório(s) sem resposta
            </div>
            {itensPendentes.slice(0, 3).map((item) => (
              <p key={item.id} className="text-xs text-amber-700 ml-6 line-clamp-1">· {item.pergunta}</p>
            ))}
            <button
              onClick={() => router.push(`/inspecoes/${inspecaoId}/responder`)}
              className="text-xs font-semibold text-amber-800 underline mt-2"
              style={TAP}
            >
              Voltar e responder →
            </button>
          </div>
        )}

        {/* Non-conforming items */}
        {itensReprovados.length > 0 && (
          <div className={cn(
            'mx-4 mt-4 p-4 rounded-xl border',
            scoreStatus === 'REPROVADO' || scoreStatus === 'NAO_CONFORME'
              ? 'bg-[#FEE2E2] border-red-300'
              : 'bg-[#FEF3C7] border-amber-300'
          )}>
            <p className={cn(
              'text-sm font-semibold mb-2',
              scoreStatus === 'REPROVADO' ? 'text-red-800' : 'text-amber-800'
            )}>
              ⚠ {itensReprovados.length} item(ns) reprovado(s)
            </p>
            {itensReprovados.slice(0, 3).map((item) => (
              <p key={item.id} className="text-xs text-red-700 line-clamp-1">
                · {item.pergunta}{item.isCritico ? ' (CRÍTICO)' : ''}
              </p>
            ))}
          </div>
        )}

        {/* Signature */}
        <div className="mx-4 mt-4 bg-white rounded-xl border border-[#D5E3F0] overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-semibold text-[#0F1B2D]">Assinatura (opcional)</p>
          </div>
          <div className="p-4">
            <AssinaturaMobile
              onAssinado={setAssinaturaDataUrl}
              onLimpar={() => setAssinaturaDataUrl(null)}
            />
          </div>
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#D5E3F0] p-4"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={finalizar}
          disabled={!podeFinalizar || isPending}
          aria-label="Finalizar inspeção"
          className={cn(
            'w-full font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
            podeFinalizar
              ? 'bg-[#00963A] text-white'
              : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
          )}
          style={{ height: 64, fontSize: 18, ...TAP }}
        >
          {isPending ? (
            <><Loader2 size={20} className="animate-spin" /> Finalizando...</>
          ) : (
            <><CheckCircle2 size={20} /> Finalizar Inspeção</>
          )}
        </button>
        {!podeFinalizar && (
          <p className="text-center text-xs text-[#5A7089] mt-2" role="alert">
            Responda todos os itens obrigatórios para finalizar.
          </p>
        )}
      </div>
    </div>
  )
}

// Touch-optimized signature canvas component
function AssinaturaMobile({
  onAssinado,
  onLimpar,
}: {
  onAssinado: (url: string) => void
  onLimpar: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const lastPtRef = useRef<{ x: number; y: number } | null>(null)
  const isDrawingRef = useRef(false)
  const [hasSignature, setHasSignature] = useState(false)

  function drawPlaceholder(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#D5E3F0'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Assine aqui', canvas.width / 2, canvas.height / 2)
  }

  function initCanvas(node: HTMLCanvasElement | null) {
    if (!node) return
    canvasRef.current = node
    drawPlaceholder(node)
  }

  function getCtx() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.strokeStyle = '#0E2E60'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    return ctx
  }

  function ptFrom(e: React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const t = e.touches[0]
    return {
      x: ((t.clientX - rect.left) * canvas.width) / rect.width,
      y: ((t.clientY - rect.top) * canvas.height) / rect.height,
    }
  }

  function handleTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    if (!hasSignature) {
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    const pt = ptFrom(e)
    lastPtRef.current = pt
    isDrawingRef.current = true
    const ctx = getCtx()
    if (ctx) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y) }
    setHasSignature(true)
  }

  function handleTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    if (!isDrawingRef.current) return
    const ctx = getCtx()
    if (!ctx) return
    const pt = ptFrom(e)
    const last = lastPtRef.current
    if (!last) return
    const midX = (last.x + pt.x) / 2
    const midY = (last.y + pt.y) / 2
    ctx.quadraticCurveTo(last.x, last.y, midX, midY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(midX, midY)
    lastPtRef.current = pt
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault()
    isDrawingRef.current = false
    const canvas = canvasRef.current
    if (canvas && hasSignature) {
      onAssinado(canvas.toDataURL('image/png'))
    }
  }

  function limpar() {
    const canvas = canvasRef.current
    if (!canvas) return
    setHasSignature(false)
    drawPlaceholder(canvas)
    onLimpar()
  }

  return (
    <div className="space-y-3">
      <div className="relative border-2 border-[#D5E3F0] rounded-xl overflow-hidden bg-neutral-50">
        <div className="absolute bottom-2 left-4 right-4 border-b border-dashed border-neutral-200 pointer-events-none" />
        <canvas
          ref={initCanvas}
          width={600}
          height={160}
          className="w-full block touch-none"
          style={{ height: 120, cursor: 'crosshair' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          aria-label="Canvas para assinatura"
        />
      </div>
      {hasSignature && (
        <button
          onClick={limpar}
          className="flex items-center gap-1.5 text-sm text-[#5A7089] border border-neutral-200 px-3 py-2 rounded-lg"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          aria-label="Limpar assinatura"
        >
          <Trash2 size={14} aria-hidden="true" /> Limpar assinatura
        </button>
      )}
    </div>
  )
}
