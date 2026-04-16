'use client'

import { useState, useEffect, useCallback } from 'react'

const PING_URL = '/api/ping'
const PING_INTERVAL_MS = 30_000

async function verificarConexao(): Promise<boolean> {
  if (!navigator.onLine) return false
  try {
    const res = await fetch(PING_URL, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    })
    return res.ok
  } catch {
    return false
  }
}

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true)

  const check = useCallback(async () => {
    const online = await verificarConexao()
    setIsOnline(online)
  }, [])

  useEffect(() => {
    // Initial check
    check()

    const interval = setInterval(check, PING_INTERVAL_MS)

    const handleOnline = () => check()
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [check])

  return isOnline
}
