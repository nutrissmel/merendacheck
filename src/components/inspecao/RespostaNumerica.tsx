'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  valor: number | null | undefined
  valorMinimo?: number | null
  valorMaximo?: number | null
  unidade?: string | null
  onChange: (v: number | null, conforme: boolean | null) => void
  disabled?: boolean
}

export function RespostaNumerica({ valor, valorMinimo, valorMaximo, unidade, onChange, disabled }: Props) {
  const [input, setInput] = useState(valor != null ? String(valor) : '')
  const longPressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setInput(valor != null ? String(valor) : '')
  }, [valor])

  function calcConforme(num: number) {
    if (valorMinimo != null && valorMaximo != null) {
      return num >= valorMinimo && num <= valorMaximo
    }
    return null
  }

  function handleChange(raw: string) {
    setInput(raw)
    const num = parseFloat(raw.replace(',', '.'))
    if (isNaN(num)) {
      onChange(null, null)
      return
    }
    onChange(num, calcConforme(num))
  }

  function adjust(delta: number) {
    const current = parseFloat(input.replace(',', '.'))
    const next = isNaN(current) ? delta : Math.round((current + delta) * 10) / 10
    const str = String(next)
    setInput(str)
    onChange(next, calcConforme(next))
  }

  function startLongPress(delta: number) {
    adjust(delta)
    longPressRef.current = setInterval(() => adjust(delta), 120)
  }

  function stopLongPress() {
    if (longPressRef.current) {
      clearInterval(longPressRef.current)
      longPressRef.current = null
    }
  }

  useEffect(() => () => stopLongPress(), [])

  const num = parseFloat(input.replace(',', '.'))
  const isValid = !isNaN(num)
  const conforme = isValid ? calcConforme(num) : null

  // Range bar percentage
  const rangePct = isValid && valorMinimo != null && valorMaximo != null
    ? Math.min(100, Math.max(0, ((num - valorMinimo) / (valorMaximo - valorMinimo)) * 100))
    : null

  const TAP: React.CSSProperties = {
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
  }

  return (
    <div className="space-y-4">
      {(valorMinimo != null || valorMaximo != null) && (
        <div className="flex items-center gap-2 text-sm text-[#5A7089]">
          <span>Faixa aceitável:</span>
          <span className="font-semibold text-[#0F1B2D]">
            {valorMinimo ?? '?'} – {valorMaximo ?? '?'}{unidade ? ` ${unidade}` : ''}
          </span>
        </div>
      )}

      {/* Main input row with +/- */}
      <div className="flex items-center gap-2">
        {/* Minus */}
        <button
          type="button"
          disabled={disabled}
          onPointerDown={() => startLongPress(-0.1)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          aria-label="Diminuir valor"
          className="w-14 h-14 rounded-xl border-2 border-[#D5E3F0] flex items-center justify-center text-2xl font-bold text-[#0E2E60] bg-white active:bg-[#EEF4FD] disabled:opacity-40 select-none"
          style={TAP}
        >
          −
        </button>

        {/* Input */}
        <div className="relative flex-1">
          <input
            type="number"
            inputMode="decimal"
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            placeholder="0"
            step="0.1"
            aria-label={`Valor numérico${unidade ? ` em ${unidade}` : ''}`}
            className={cn(
              'w-full text-center font-bold border-2 rounded-xl focus:outline-none focus:ring-2 transition-all',
              conforme === true
                ? 'border-[#00963A] focus:ring-green-200 text-[#005C25]'
                : conforme === false
                ? 'border-red-500 focus:ring-red-200 text-red-700'
                : 'border-[#D5E3F0] focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] text-[#0F1B2D]',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            style={{ fontSize: 32, height: 56, paddingRight: unidade ? 48 : 16, paddingLeft: 16 }}
          />
          {unidade && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#5A7089] font-medium">
              {unidade}
            </span>
          )}
        </div>

        {/* Plus */}
        <button
          type="button"
          disabled={disabled}
          onPointerDown={() => startLongPress(0.1)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          aria-label="Aumentar valor"
          className="w-14 h-14 rounded-xl border-2 border-[#D5E3F0] flex items-center justify-center text-2xl font-bold text-[#0E2E60] bg-white active:bg-[#EEF4FD] disabled:opacity-40 select-none"
          style={TAP}
        >
          +
        </button>
      </div>

      {/* Range bar */}
      {rangePct !== null && (
        <div className="space-y-1">
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-200',
                conforme ? 'bg-[#00963A]' : 'bg-red-500'
              )}
              style={{ width: `${rangePct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#5A7089]">
            <span>{valorMinimo}{unidade ? ` ${unidade}` : ''}</span>
            <span>{valorMaximo}{unidade ? ` ${unidade}` : ''}</span>
          </div>
        </div>
      )}

      {isValid && conforme !== null && (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            'px-3 py-2 rounded-lg text-sm font-medium',
            conforme ? 'bg-[#D1F7E2] text-[#005C25]' : 'bg-red-50 text-red-700'
          )}
        >
          {conforme ? '✓ Dentro da faixa aceitável' : '✗ Fora da faixa aceitável'}
        </div>
      )}
    </div>
  )
}
