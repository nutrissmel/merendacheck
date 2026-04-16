'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { salvarRespostaAction } from '@/actions/inspecao.actions'
import { calcularScore } from '@/lib/utils'
import { toast } from 'sonner'
import type { ChecklistItem, RespostaItem } from '@prisma/client'

export type RespostaLocal = {
  respostaSimNao?: boolean | null
  respostaNumerica?: number | null
  respostaTexto?: string | null
  conforme: boolean | null
  observacao?: string
  fotoUrl?: string | null
}

interface UseInspecaoProps {
  inspecaoId: string
  itens: ChecklistItem[]
  respostasIniciais: RespostaItem[]
}

export function useInspecao({ inspecaoId, itens, respostasIniciais }: UseInspecaoProps) {
  const [respostas, setRespostas] = useState<Map<string, RespostaLocal>>(() => {
    const m = new Map<string, RespostaLocal>()
    for (const r of respostasIniciais) {
      m.set(r.itemId, {
        respostaSimNao: r.respostaSimNao,
        respostaNumerica: r.respostaNumerica,
        respostaTexto: r.respostaTexto,
        conforme: r.conforme,
        observacao: r.observacao ?? undefined,
        fotoUrl: r.fotoUrl,
      })
    }
    return m
  })

  const [itemAtualIndex, setItemAtualIndex] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const isSavingRef = useRef(false)

  const totalItens = itens.length
  const itemAtual = itens[itemAtualIndex]

  // Calculate score from local state
  const scoreAtual = (() => {
    const respostasArr = Array.from(respostas.entries()).map(([itemId, r]) => ({
      itemId,
      conforme: r.conforme,
    }))
    const { score } = calcularScore(itens, respostasArr)
    return Math.round(score)
  })()

  const totalRespondidos = itens.filter((item) => {
    const r = respostas.get(item.id)
    return r && r.conforme !== undefined
  }).length

  const itensPendentes = itens
    .filter((item) => item.obrigatorio && !respostas.has(item.id))
    .map((i) => i.id)

  const podeFinalizarInspecao = itensPendentes.length === 0 && totalRespondidos > 0

  const responderItem = useCallback(
    async (itemId: string, resposta: RespostaLocal) => {
      // Optimistic update
      setRespostas((prev) => {
        const next = new Map(prev)
        next.set(itemId, resposta)
        return next
      })

      if (isSavingRef.current) return
      isSavingRef.current = true
      setSalvando(true)

      try {
        const result = await salvarRespostaAction({
          inspecaoId,
          itemId,
          respostaSimNao: resposta.respostaSimNao ?? undefined,
          respostaNumerica: resposta.respostaNumerica ?? undefined,
          respostaTexto: resposta.respostaTexto ?? undefined,
          conforme: resposta.conforme,
          observacao: resposta.observacao,
        })

        if ('erro' in result) {
          toast.error(`Erro ao salvar: ${result.erro}`)
          // Revert
          setRespostas((prev) => {
            const next = new Map(prev)
            next.delete(itemId)
            return next
          })
        }
      } catch {
        toast.error('Falha ao salvar resposta. Tente novamente.')
      } finally {
        isSavingRef.current = false
        setSalvando(false)
      }
    },
    [inspecaoId]
  )

  const atualizarFoto = useCallback((itemId: string, fotoUrl: string | null) => {
    setRespostas((prev) => {
      const next = new Map(prev)
      const existente = next.get(itemId) ?? { conforme: null }
      next.set(itemId, { ...existente, fotoUrl })
      return next
    })
  }, [])

  const atualizarObservacao = useCallback((itemId: string, observacao: string) => {
    setRespostas((prev) => {
      const next = new Map(prev)
      const existente = next.get(itemId) ?? { conforme: null }
      next.set(itemId, { ...existente, observacao })
      return next
    })
  }, [])

  const irParaProximo = useCallback(() => {
    setItemAtualIndex((i) => Math.min(i + 1, totalItens - 1))
  }, [totalItens])

  const irParaAnterior = useCallback(() => {
    setItemAtualIndex((i) => Math.max(i - 1, 0))
  }, [])

  const irParaItem = useCallback((index: number) => {
    setItemAtualIndex(Math.max(0, Math.min(index, totalItens - 1)))
  }, [totalItens])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (!itemAtual) return

      if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        if (itemAtual.tipoResposta === 'SIM_NAO') {
          responderItem(itemAtual.id, { conforme: true, respostaSimNao: true })
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        if (itemAtual.tipoResposta === 'SIM_NAO') {
          responderItem(itemAtual.id, { conforme: false, respostaSimNao: false })
        }
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        if (itemAtual.tipoResposta === 'SIM_NAO') {
          responderItem(itemAtual.id, { conforme: null })
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        irParaProximo()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        irParaAnterior()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [itemAtual, responderItem, irParaProximo, irParaAnterior])

  return {
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
  }
}
