'use client'

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { useTotalPendentes } from '@/hooks/useInspecaoOffline'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { sincronizarTudo } from '@/lib/offline/syncService'
import { inicializarBackgroundSync } from '@/lib/offline/backgroundSync'

// ─── Context ──────────────────────────────────────────────────────────────────

interface SyncContextValue {
  totalPendentes: number
  sincronizando: boolean
  ultimaSync: Date | null
  isOnline: boolean
  forcarSync: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue>({
  totalPendentes: 0,
  sincronizando: false,
  ultimaSync: null,
  isOnline: true,
  forcarSync: async () => {},
})

export function useSyncContext() {
  return useContext(SyncContext)
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const AUTO_SYNC_INTERVAL_MS = 60_000

export function SyncProvider({ children }: { children: ReactNode }) {
  const isOnline = useOnlineStatus()
  const totalPendentes = useTotalPendentes()
  const [sincronizando, setSincronizando] = useState(false)
  const [ultimaSync, setUltimaSync] = useState<Date | null>(null)
  const sincronizandoRef = useRef(false)

  const forcarSync = useCallback(async () => {
    if (sincronizandoRef.current || !isOnline) return
    sincronizandoRef.current = true
    setSincronizando(true)

    try {
      await sincronizarTudo()
      setUltimaSync(new Date())
    } finally {
      sincronizandoRef.current = false
      setSincronizando(false)
    }
  }, [isOnline])

  // Register background sync with SW
  useEffect(() => {
    return inicializarBackgroundSync(forcarSync)
  }, [forcarSync])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && totalPendentes > 0) {
      forcarSync()
    }
  }, [isOnline]) // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic auto-sync every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      if (isOnline && totalPendentes > 0) {
        forcarSync()
      }
    }, AUTO_SYNC_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isOnline, totalPendentes, forcarSync])

  return (
    <SyncContext.Provider value={{ totalPendentes, sincronizando, ultimaSync, isOnline, forcarSync }}>
      {children}
    </SyncContext.Provider>
  )
}
