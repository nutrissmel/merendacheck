// MerendaCheck — Custom Service Worker additions
// This file is imported by next-pwa's generated sw.js via importScripts

const SYNC_TAG = 'merendacheck-sync'

// ─── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(triggerSync())
  }
})

async function triggerSync() {
  try {
    // Notify all open clients to run the sync
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of clients) {
      client.postMessage({ type: 'BACKGROUND_SYNC' })
    }
  } catch (err) {
    console.error('[SW] Background sync error:', err)
  }
}

// ─── Push notifications (future) ─────────────────────────────────────────────

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'MerendaCheck', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'MerendaCheck', {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-96.png',
      tag: payload.tag ?? 'mc-notification',
      data: payload.data,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const focused = clients.find((c) => c.url === url)
      if (focused) return focused.focus()
      return self.clients.openWindow(url)
    })
  )
})
