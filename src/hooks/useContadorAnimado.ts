'use client'

import { useState, useEffect, useRef } from 'react'

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

export function useContadorAnimado(
  valorFinal: number,
  duracao = 800,
  casasDecimais = 0
): number {
  const [valorAtual, setValorAtual] = useState(0)
  const rafRef = useRef<number | null>(null)
  const inicioRef = useRef<number | null>(null)
  const valorAnteriorRef = useRef(0)

  useEffect(() => {
    const valorInicio = valorAnteriorRef.current
    inicioRef.current = null

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
    }

    function tick(timestamp: number) {
      if (inicioRef.current === null) {
        inicioRef.current = timestamp
      }

      const elapsed = timestamp - inicioRef.current
      const progress = Math.min(elapsed / duracao, 1)
      const easedProgress = easeOutQuart(progress)
      const valor = valorInicio + (valorFinal - valorInicio) * easedProgress
      const valorArredondado =
        casasDecimais === 0
          ? Math.round(valor)
          : parseFloat(valor.toFixed(casasDecimais))

      setValorAtual(valorArredondado)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        valorAnteriorRef.current = valorFinal
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [valorFinal, duracao, casasDecimais])

  return valorAtual
}
