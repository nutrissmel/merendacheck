'use client'

const SYNC_TAG = 'merendacheck-sync'

// ─── Register background sync ─────────────────────────────────────────────────

export async function registrarBackgroundSync(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false
  if (!('SyncManager' in window)) return false

  try {
    const registration = await navigator.serviceWorker.ready
    // @ts-expect-error — SyncManager not in all TS lib versions
    await registration.sync.register(SYNC_TAG)
    return true
  } catch (err) {
    console.warn('[backgroundSync] Failed to register:', err)
    return false
  }
}

// ─── Listen for SW messages to trigger sync ───────────────────────────────────

type SyncCallback = () => Promise<void>

let syncCallback: SyncCallback | null = null

export function setSyncCallback(cb: SyncCallback) {
  syncCallback = cb
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'BACKGROUND_SYNC' && syncCallback) {
      syncCallback().catch(console.error)
    }
  })
}

// ─── Hook: register on mount, trigger sync on online event ───────────────────

export function inicializarBackgroundSync(onSync: SyncCallback) {
  setSyncCallback(onSync)

  // Register Background Sync
  registrarBackgroundSync()

  // Fallback: trigger on online event if Background Sync not supported
  const handleOnline = () => {
    onSync().catch(console.error)
  }

  window.addEventListener('online', handleOnline)

  return () => {
    window.removeEventListener('online', handleOnline)
    syncCallback = null
  }
}
