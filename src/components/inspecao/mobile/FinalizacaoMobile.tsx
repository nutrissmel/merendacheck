'use client'

import { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, CheckCircle2, AlertCircle,
  Loader2, Trash2, AlertTriangle, FileText, User, Stethoscope,
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

const STATUS_CONFIG: Record<string, { label: string; color: string; ring: string }> = {
  CONFORME:     { label: 'Conforme',     color: '#00963A', ring: '#34D399' },
  ATENCAO:      { label: 'Atenção',      color: '#D97706', ring: '#FCD34D' },
  NAO_CONFORME: { label: 'Não Conforme', color: '#DC2626', ring: '#FCA5A5' },
  REPROVADO:    { label: 'Reprovado',    color: '#991B1B', ring: '#F87171' },
}

const CIRCUNF = 2 * Math.PI * 44

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

  const [relatorioFinal, setRelatorioFinal] = useState('')
  const [assinaturaDiretorDataUrl, setAssinaturaDiretorDataUrl] = useState<string | null>(null)
  const [assinaturaNutricionistaDataUrl, setAssinaturaNutricionistaDataUrl] = useState<string | null>(null)

  const statusCfg = STATUS_CONFIG[scoreStatus] ?? STATUS_CONFIG.NAO_CONFORME
  const podeFinalizar = itensPendentes.length === 0
  const dashOffset = CIRCUNF - (score / 100) * CIRCUNF

  function finalizar() {
    startTransition(async () => {
      const result = await finalizarInspecaoAction({
        inspecaoId,
        assinaturaDiretorUrl: assinaturaDiretorDataUrl ?? undefined,
        assinaturaNutricionistaUrl: assinaturaNutricionistaDataUrl ?? undefined,
        relatorioFinal: relatorioFinal.trim() || undefined,
      })

      if ('erro' in result) {
        toast.error(result.erro)
        return
      }

      router.push(`/inspecoes/${inspecaoId}`)
    })
  }

  return (
    <div className="min-h-screen bg-[#EEF4FD] flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 h-[54px] shrink-0"
        style={{ background: 'linear-gradient(145deg, #0B2550 0%, #0E2E60 60%, #133878 100%)' }}
      >
        <button
          onClick={() => router.push(`/inspecoes/${inspecaoId}/responder`)}
          className="flex items-center gap-1.5 text-white/75 text-sm font-medium"
          style={TAP}
          aria-label="Voltar para revisar"
        >
          <ArrowLeft size={16} /> Revisar
        </button>
        <span className="text-white font-bold text-sm">Revisão Final</span>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto pb-36">

        {/* ── Score hero ─────────────────────────────────────────── */}
        <div
          className="bg-white mx-4 mt-4 rounded-2xl border border-[#D5E3F0] p-5 flex items-center gap-4"
          style={{ boxShadow: '0 2px 16px rgba(14,46,96,0.07)' }}
        >
          <div className="shrink-0 relative" style={{ width: 96, height: 96 }}>
            <svg width="96" height="96" viewBox="0 0 96 96" className="absolute inset-0 -rotate-90">
              <circle cx="48" cy="48" r="44" fill="none" stroke="#EEF4FD" strokeWidth="6" />
              <circle
                cx="48" cy="48" r="44"
                fill="none"
                stroke={statusCfg.ring}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={CIRCUNF}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-bold leading-none" style={{ fontSize: 22, color: statusCfg.color }}>{score}%</span>
              <span className="text-[9px] text-[#9DAFC4] font-medium uppercase tracking-wider mt-0.5">score</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-none mb-1" style={{ color: statusCfg.color }}>
              {statusCfg.label}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-[#00963A]">
                <CheckCircle2 size={12} /> {totalConformes}
              </span>
              <span className="text-[#C8D9EC] text-xs">·</span>
              <span className="text-xs font-semibold text-red-600">✗ {totalNaoConformes}</span>
              {totalNA > 0 && (
                <>
                  <span className="text-[#C8D9EC] text-xs">·</span>
                  <span className="text-xs text-[#9DAFC4]">— {totalNA} N/A</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Pending items warning ───────────────────────────────── */}
        {itensPendentes.length > 0 && (
          <div
            className="mx-4 mt-3 rounded-2xl border border-amber-300 p-4"
            style={{ backgroundColor: '#FFFBEB' }}
            role="alert"
          >
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
              <AlertCircle size={16} />
              {itensPendentes.length} item{itensPendentes.length !== 1 ? 'ns' : ''} obrigatório{itensPendentes.length !== 1 ? 's' : ''} sem resposta
            </div>
            {itensPendentes.slice(0, 3).map((item) => (
              <p key={item.id} className="text-xs text-amber-700 ml-6 line-clamp-1 mb-0.5">· {item.pergunta}</p>
            ))}
            <button
              onClick={() => router.push(`/inspecoes/${inspecaoId}/responder`)}
              className="text-xs font-bold text-amber-800 underline mt-2 ml-6"
              style={TAP}
            >
              Voltar e responder →
            </button>
          </div>
        )}

        {/* ── Non-conforming items ────────────────────────────────── */}
        {itensReprovados.length > 0 && (
          <div
            className="mx-4 mt-3 rounded-2xl border border-red-200 p-4"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
              <AlertTriangle size={16} />
              {itensReprovados.length} item{itensReprovados.length !== 1 ? 'ns' : ''} reprovado{itensReprovados.length !== 1 ? 's' : ''}
            </div>
            {itensReprovados.slice(0, 4).map((item) => (
              <p key={item.id} className="text-xs text-red-600 ml-6 line-clamp-1 mb-0.5">
                · {item.pergunta}{item.isCritico ? ' · CRÍTICO' : ''}
              </p>
            ))}
          </div>
        )}

        {/* ── Relatório Final ─────────────────────────────────────── */}
        <div
          className="mx-4 mt-3 bg-white rounded-2xl border border-[#D5E3F0] overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(14,46,96,0.06)' }}
        >
          <div className="px-4 py-3 border-b border-[#EEF4FD] flex items-center gap-2">
            <FileText size={14} className="text-[#0E2E60]" />
            <p className="text-sm font-bold text-[#0F1B2D]">
              Relatório Final <span className="text-[#9DAFC4] font-normal">(opcional)</span>
            </p>
          </div>
          <div className="p-4">
            <textarea
              value={relatorioFinal}
              onChange={(e) => setRelatorioFinal(e.target.value)}
              placeholder="Descreva as observações gerais da inspeção, condições encontradas, recomendações e ocorrências relevantes..."
              maxLength={3000}
              rows={5}
              className="w-full resize-none rounded-xl border border-[#D5E3F0] bg-[#F8FBFF] px-3 py-2.5 text-sm text-[#0F1B2D] placeholder-[#9DAFC4] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] transition-colors"
            />
            <p className="text-right text-xs text-[#9DAFC4] mt-1">{relatorioFinal.length}/3000</p>
          </div>
        </div>

        {/* ── Assinatura Diretor/Supervisor ───────────────────────── */}
        <div
          className="mx-4 mt-3 bg-white rounded-2xl border border-[#D5E3F0] overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(14,46,96,0.06)' }}
        >
          <div className="px-4 py-3 border-b border-[#EEF4FD] flex items-center gap-2">
            <User size={14} className="text-[#0E2E60]" />
            <p className="text-sm font-bold text-[#0F1B2D]">
              Assinatura Diretor/Supervisor <span className="text-[#9DAFC4] font-normal">(opcional)</span>
            </p>
          </div>
          <div className="p-4">
            <AssinaturaMobile
              onAssinado={setAssinaturaDiretorDataUrl}
              onLimpar={() => setAssinaturaDiretorDataUrl(null)}
            />
          </div>
        </div>

        {/* ── Assinatura Nutricionista ────────────────────────────── */}
        <div
          className="mx-4 mt-3 bg-white rounded-2xl border border-[#D5E3F0] overflow-hidden"
          style={{ boxShadow: '0 2px 12px rgba(14,46,96,0.06)' }}
        >
          <div className="px-4 py-3 border-b border-[#EEF4FD] flex items-center gap-2">
            <Stethoscope size={14} className="text-[#0E2E60]" />
            <p className="text-sm font-bold text-[#0F1B2D]">
              Assinatura Nutricionista <span className="text-[#9DAFC4] font-normal">(opcional)</span>
            </p>
          </div>
          <div className="p-4">
            <AssinaturaMobile
              onAssinado={setAssinaturaNutricionistaDataUrl}
              onLimpar={() => setAssinaturaNutricionistaDataUrl(null)}
            />
          </div>
        </div>

      </div>

      {/* ── Fixed bottom CTA ───────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-[#EEF4FD] px-4 pt-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))', boxShadow: '0 -4px 20px rgba(14,46,96,0.10)' }}
      >
        <button
          onClick={finalizar}
          disabled={!podeFinalizar || isPending}
          aria-label="Finalizar inspeção"
          className={cn(
            'w-full font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]',
            podeFinalizar ? 'text-white' : 'text-[#9DAFC4] cursor-not-allowed',
          )}
          style={{
            height: 56,
            fontSize: 16,
            background: podeFinalizar
              ? 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)'
              : '#EEF4FD',
            boxShadow: podeFinalizar ? '0 4px 16px rgba(6,78,59,0.30)' : 'none',
            ...TAP,
          }}
        >
          {isPending ? (
            <><Loader2 size={20} className="animate-spin" /> Finalizando...</>
          ) : (
            <><CheckCircle2 size={20} /> Finalizar Inspeção</>
          )}
        </button>
        {!podeFinalizar && (
          <p className="text-center text-xs text-[#9DAFC4] mt-2" role="alert">
            Responda todos os itens obrigatórios para finalizar.
          </p>
        )}
      </div>
    </div>
  )
}

// ── Touch-optimized signature canvas ────────────────────────
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
    ctx.fillStyle = '#C8D9EC'
    ctx.font = '13px sans-serif'
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
    ctx.lineWidth = 2.5
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
      <div className="relative border border-[#D5E3F0] rounded-xl overflow-hidden bg-[#F8FBFF]">
        <div className="absolute bottom-3 left-4 right-4 border-b border-dashed border-[#D5E3F0] pointer-events-none" />
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
          className="flex items-center gap-1.5 text-xs text-[#9DAFC4] border border-[#D5E3F0] px-3 py-2 rounded-xl bg-white"
          style={TAP}
          aria-label="Limpar assinatura"
        >
          <Trash2 size={12} /> Limpar assinatura
        </button>
      )}
    </div>
  )
}
