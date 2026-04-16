'use client'

import { useState, useEffect, useRef } from 'react'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'erro'

export function useAutoSave<T>(
  valor: T,
  onSave: (valor: T) => Promise<void>,
  delay = 800
): { status: AutoSaveStatus; salvarAgora: () => Promise<void> } {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const latestValor = useRef(valor)

  // Always keep latest value in ref
  latestValor.current = valor

  async function executarSave(v: T) {
    setStatus('saving')
    try {
      await onSave(v)
      setStatus('saved')
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => setStatus('idle'), 3000)
    } catch {
      setStatus('erro')
    }
  }

  useEffect(() => {
    // Skip first render (initial value should not trigger auto-save)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      executarSave(latestValor.current)
    }, delay)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, delay])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  async function salvarAgora() {
    if (timerRef.current) clearTimeout(timerRef.current)
    await executarSave(latestValor.current)
  }

  return { status, salvarAgora }
}
