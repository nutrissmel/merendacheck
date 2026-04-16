'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export type EscolaFiltros = {
  busca: string
  turno: string
  status: string
  ordem: string
}

export function useEscolaFiltros() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filtros: EscolaFiltros = {
    busca: searchParams.get('busca') ?? '',
    turno: searchParams.get('turno') ?? 'todos',
    status: searchParams.get('status') ?? 'ativa',
    ordem: searchParams.get('ordem') ?? 'nome',
  }

  const setFiltro = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'todos' && value !== 'nome') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname]
  )

  const limparFiltros = useCallback(() => {
    router.replace(pathname, { scroll: false })
  }, [router, pathname])

  return { filtros, setFiltro, limparFiltros }
}
