'use client'

import { useLiveQuery } from 'dexie-react-hooks'
import { getDB } from '@/lib/offline/db'
import { cacheEscolas, buscarEscolasCache } from '@/lib/offline/cacheService'
import { useEffect, useState } from 'react'
import { useOnlineStatus } from './useOnlineStatus'

interface EscolaOffline {
  id: string
  nome: string
  codigo?: string
  tenantId: string
}

export function useEscolasOffline(tenantId: string): {
  escolas: EscolaOffline[]
  carregando: boolean
  deCache: boolean
} {
  const isOnline = useOnlineStatus()
  const [carregando, setCarregando] = useState(true)
  const [deCache, setDeCache] = useState(false)

  const escolasCache = useLiveQuery(
    () => getDB().escolas.where('tenantId').equals(tenantId).toArray(),
    [tenantId],
    []
  )

  useEffect(() => {
    if (!isOnline) {
      setDeCache(true)
      setCarregando(false)
      return
    }

    let cancelled = false

    async function sincronizar() {
      try {
        const res = await fetch(`/api/escolas?tenantId=${tenantId}`)
        if (!res.ok) throw new Error('Falha ao buscar escolas')

        const data = await res.json() as EscolaOffline[]
        if (!cancelled) {
          await cacheEscolas(data.map((e) => ({ ...e, tenantId })))
          setDeCache(false)
        }
      } catch {
        // Use cache if fetch fails
        const cached = await buscarEscolasCache(tenantId)
        if (!cancelled && cached.length > 0) {
          setDeCache(true)
        }
      } finally {
        if (!cancelled) setCarregando(false)
      }
    }

    sincronizar()
    return () => { cancelled = true }
  }, [isOnline, tenantId])

  return {
    escolas: (escolasCache ?? []) as EscolaOffline[],
    carregando,
    deCache,
  }
}
