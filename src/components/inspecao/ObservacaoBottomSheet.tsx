'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Props {
  aberto: boolean
  valorInicial?: string
  onFechar: () => void
  onSalvar: (observacao: string) => void
}

export function ObservacaoBottomSheet({ aberto, valorInicial = '', onFechar, onSalvar }: Props) {
  const [texto, setTexto] = useState(valorInicial)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const dragStartY = useRef(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync initial value when opened
  useEffect(() => {
    if (aberto) {
      setTexto(valorInicial)
      setDragOffset(0)
      setTimeout(() => textareaRef.current?.focus(), 300)
    }
  }, [aberto, valorInicial])

  // Detect keyboard height via visualViewport
  useEffect(() => {
    if (!aberto) return
    const vv = window.visualViewport
    if (!vv) return

    function onResize() {
      const kbHeight = window.innerHeight - (vv?.height ?? window.innerHeight)
      setKeyboardHeight(Math.max(0, kbHeight))
    }

    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [aberto])

  // Drag to close
  function handleDragStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
  }

  function handleDragMove(e: React.TouchEvent) {
    const dy = e.touches[0].clientY - dragStartY.current
    if (dy > 0) setDragOffset(dy)
  }

  function handleDragEnd() {
    if (dragOffset > 80) {
      onFechar()
    }
    setDragOffset(0)
  }

  function handleSalvar() {
    onSalvar(texto)
    onFechar()
  }

  if (!aberto && dragOffset === 0) return null

  const translateY = aberto ? dragOffset : '100%'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity"
        style={{ opacity: aberto ? 1 : 0 }}
        onClick={onFechar}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out"
        style={{
          bottom: keyboardHeight,
          transform: `translateY(${typeof translateY === 'number' ? translateY + 'px' : translateY})`,
          maxHeight: '70vh',
        }}
      >
        {/* Drag handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
          onTouchStart={handleDragStart}
          onTouchMove={handleDragMove}
          onTouchEnd={handleDragEnd}
        >
          <div className="w-10 h-1 bg-neutral-300 rounded-full" />
        </div>

        <div className="px-4 pb-4 space-y-4">
          <h3 className="text-base font-bold text-[#0F1B2D]">Observação</h3>

          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Descreva o que foi observado..."
            rows={5}
            maxLength={500}
            className="w-full px-4 py-3 text-base border-2 border-[#D5E3F0] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] leading-relaxed"
            style={{ fontSize: 16 }}
          />

          <div className="flex items-center gap-3">
            <button
              onClick={onFechar}
              className="flex-1 h-12 border border-neutral-200 text-[#5A7089] font-semibold rounded-xl text-base"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="flex-1 h-12 bg-[#0E2E60] text-white font-semibold rounded-xl text-base"
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
