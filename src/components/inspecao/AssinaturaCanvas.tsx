'use client'

import { useRef, useState } from 'react'
import { Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  onAssinado: (dataUrl: string) => void
  disabled?: boolean
}

type Point = { x: number; y: number }

export function AssinaturaCanvas({ onAssinado, disabled }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [assinado, setAssinado] = useState(false)
  const [desenhando, setDesenhando] = useState(false)
  const ultimoPontoRef = useRef<Point | null>(null)

  function getCtx() {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.strokeStyle = '#0F1B2D'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    return ctx
  }

  function getPoint(e: React.MouseEvent | React.TouchEvent): Point {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function iniciarDesenho(e: React.MouseEvent | React.TouchEvent) {
    if (disabled) return
    e.preventDefault()
    setDesenhando(true)
    const pt = getPoint(e)
    ultimoPontoRef.current = pt
    const ctx = getCtx()
    if (!ctx) return
    ctx.beginPath()
    ctx.moveTo(pt.x, pt.y)
  }

  function desenhar(e: React.MouseEvent | React.TouchEvent) {
    if (!desenhando || disabled) return
    e.preventDefault()
    const pt = getPoint(e)
    const ultimo = ultimoPontoRef.current
    if (!ultimo) return

    const ctx = getCtx()
    if (!ctx) return

    const midX = (ultimo.x + pt.x) / 2
    const midY = (ultimo.y + pt.y) / 2
    ctx.quadraticCurveTo(ultimo.x, ultimo.y, midX, midY)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(midX, midY)

    ultimoPontoRef.current = pt
    setAssinado(true)
  }

  function finalizarDesenho(e: React.MouseEvent | React.TouchEvent) {
    if (!desenhando || disabled) return
    e.preventDefault()
    setDesenhando(false)
    ultimoPontoRef.current = null
  }

  function limpar() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setAssinado(false)
  }

  function confirmar() {
    const canvas = canvasRef.current
    if (!canvas || !assinado) return
    const dataUrl = canvas.toDataURL('image/png')
    onAssinado(dataUrl)
  }

  return (
    <div className="space-y-3">
      <div className="relative border-2 border-[#D5E3F0] rounded-xl overflow-hidden bg-white touch-none select-none">
        <div className="absolute bottom-8 left-4 right-4 border-b border-dashed border-neutral-200 pointer-events-none" />
        <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-neutral-300 pointer-events-none">
          Assine acima
        </p>

        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className={cn(
            'w-full h-[140px] block',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-crosshair'
          )}
          onMouseDown={iniciarDesenho}
          onMouseMove={desenhar}
          onMouseUp={finalizarDesenho}
          onMouseLeave={finalizarDesenho}
          onTouchStart={iniciarDesenho}
          onTouchMove={desenhar}
          onTouchEnd={finalizarDesenho}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={limpar}
          disabled={disabled || !assinado}
          className="flex items-center gap-1.5 px-3 py-2 border border-neutral-200 rounded-lg text-sm text-[#5A7089] hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={14} /> Limpar
        </button>

        <button
          type="button"
          onClick={confirmar}
          disabled={disabled || !assinado}
          className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#0E2E60] text-white text-sm font-semibold rounded-lg hover:bg-[#133878] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={15} /> Confirmar Assinatura
        </button>
      </div>
    </div>
  )
}
