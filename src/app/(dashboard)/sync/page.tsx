'use client'

import { useSyncContext } from '@/providers/SyncProvider'
import { useLiveQuery } from 'dexie-react-hooks'
import { getDB } from '@/lib/offline/db'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  RefreshCw, CheckCircle2, AlertCircle, Clock, WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const statusConfig = {
  PENDENTE:       { label: 'Pendente',       cor: 'text-amber-600', bg: 'bg-amber-50',    Icon: Clock },
  SINCRONIZANDO:  { label: 'Sincronizando',  cor: 'text-blue-600',  bg: 'bg-blue-50',     Icon: RefreshCw },
  SINCRONIZADO:   { label: 'Sincronizado',   cor: 'text-[#00963A]', bg: 'bg-green-50',    Icon: CheckCircle2 },
  ERRO:           { label: 'Erro',           cor: 'text-red-600',   bg: 'bg-red-50',      Icon: AlertCircle },
} as const

export default function SyncPage() {
  const { isOnline, sincronizando, ultimaSync, totalPendentes, forcarSync } = useSyncContext()

  const inspecoes = useLiveQuery(
    () => getDB().inspecoes.orderBy('createdAt').reverse().limit(50).toArray(),
    [],
    []
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0F1B2D]">Sincronização Offline</h1>
        <p className="text-sm text-[#5A7089] mt-1">
          Inspeções salvas localmente aguardando envio ao servidor.
        </p>
      </div>

      {/* Status card */}
      <div className={cn(
        'rounded-2xl p-5 border flex items-center gap-4',
        isOnline ? 'bg-green-50 border-green-200' : 'bg-neutral-100 border-neutral-200'
      )}>
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          isOnline ? 'bg-[#00963A]/10' : 'bg-neutral-200'
        )}>
          {isOnline
            ? <CheckCircle2 size={20} className="text-[#00963A]" />
            : <WifiOff size={20} className="text-neutral-500" />
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F1B2D]">
            {isOnline ? 'Conectado' : 'Sem conexão'}
          </p>
          <p className="text-xs text-[#5A7089]">
            {ultimaSync
              ? `Última sync: ${format(ultimaSync, "dd/MM 'às' HH:mm", { locale: ptBR })}`
              : 'Nunca sincronizado nesta sessão'}
          </p>
        </div>
        {isOnline && totalPendentes > 0 && (
          <button
            onClick={forcarSync}
            disabled={sincronizando}
            className="flex items-center gap-2 h-9 px-4 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl disabled:opacity-60"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          >
            <RefreshCw size={14} className={sincronizando ? 'animate-spin' : ''} />
            {sincronizando ? 'Sincronizando...' : 'Sincronizar agora'}
          </button>
        )}
      </div>

      {/* Inspection list */}
      {(inspecoes ?? []).length === 0 ? (
        <div className="text-center py-12 text-[#5A7089]">
          <CheckCircle2 size={40} className="mx-auto mb-3 text-[#00963A]/40" />
          <p className="text-sm font-medium">Nenhuma inspeção local</p>
          <p className="text-xs mt-1">As inspeções aparecerão aqui quando criadas offline.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-[#7AAAE3]">
            Inspeções locais ({(inspecoes ?? []).length})
          </p>
          {(inspecoes ?? []).map((insp) => {
            const cfg = statusConfig[insp.statusSync] ?? statusConfig.PENDENTE
            const Icon = cfg.Icon
            return (
              <div
                key={insp.id}
                className="bg-white rounded-xl border border-[#D5E3F0] p-4 flex items-center gap-3"
              >
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', cfg.bg)}>
                  <Icon size={16} className={cn(cfg.cor, insp.statusSync === 'SINCRONIZANDO' ? 'animate-spin' : '')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F1B2D] truncate">
                    {insp.servidorId
                      ? <Link href={`/inspecoes/${insp.servidorId}`} className="hover:underline">Ver resultado</Link>
                      : `Inspeção ${insp.id.slice(0, 8)}…`
                    }
                  </p>
                  <p className="text-xs text-[#5A7089]">
                    {format(new Date(insp.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {' · '}{insp.score}% · {insp.status === 'FINALIZADA' ? 'Finalizada' : 'Em andamento'}
                  </p>
                  {insp.erroSync && (
                    <p className="text-xs text-red-600 mt-0.5 truncate">{insp.erroSync}</p>
                  )}
                </div>
                <span className={cn('text-xs font-semibold shrink-0', cfg.cor)}>
                  {cfg.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
