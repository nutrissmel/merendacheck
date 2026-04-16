'use client'

import { useSyncContext } from '@/providers/SyncProvider'
import { WifiOff, RefreshCw, CheckCircle2, CloudOff } from 'lucide-react'
import { cn } from '@/lib/utils'

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function StatusConexao({ className }: { className?: string }) {
  const { isOnline, sincronizando, ultimaSync, totalPendentes, forcarSync } = useSyncContext()

  if (isOnline && !sincronizando && totalPendentes === 0) {
    // All synced — show nothing (or a brief success pill)
    if (!ultimaSync) return null

    return (
      <div className={cn('flex items-center gap-1.5 text-xs text-[#00963A]', className)}>
        <CheckCircle2 size={14} aria-hidden="true" />
        <span>Sincronizado</span>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 bg-neutral-800 text-white rounded-full text-xs font-medium',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <WifiOff size={13} aria-hidden="true" />
        <span>Offline</span>
        {totalPendentes > 0 && (
          <span className="bg-amber-400 text-neutral-900 text-[10px] font-bold rounded-full px-1.5 py-0.5">
            {totalPendentes}
          </span>
        )}
      </div>
    )
  }

  if (sincronizando) {
    return (
      <div
        className={cn('flex items-center gap-1.5 text-xs text-[#5A7089]', className)}
        role="status"
        aria-live="polite"
      >
        <RefreshCw size={13} className="animate-spin" aria-hidden="true" />
        <span>Sincronizando...</span>
      </div>
    )
  }

  // Online + pending — show sync button
  return (
    <button
      onClick={forcarSync}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-xs font-medium',
        className
      )}
      style={TAP}
      aria-label={`Sincronizar ${totalPendentes} inspeção(ões) pendente(s)`}
    >
      <CloudOff size={13} aria-hidden="true" />
      <span>{totalPendentes} pendente{totalPendentes !== 1 ? 's' : ''}</span>
    </button>
  )
}

/** Full-width offline banner pinned to bottom — use inside mobile layout */
export function OfflineBanner() {
  const { isOnline, totalPendentes } = useSyncContext()

  if (isOnline) return null

  return (
    <div
      className="fixed bottom-16 left-0 right-0 z-50 bg-neutral-800 text-white text-xs font-medium text-center py-2 px-4 flex items-center justify-center gap-2"
      role="alert"
      aria-live="assertive"
    >
      <WifiOff size={13} aria-hidden="true" />
      <span>
        Sem conexão — inspeções salvas localmente
        {totalPendentes > 0 ? ` (${totalPendentes} pendente${totalPendentes !== 1 ? 's' : ''})` : ''}
      </span>
    </div>
  )
}
