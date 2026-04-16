'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell, AlertTriangle, CheckCircle2, ClipboardX, Clock, Calendar, CheckCheck, Loader2 } from 'lucide-react'
import {
  buscarNotificacoes,
  contarNaoLidas,
  marcarComoLida,
  marcarTodasComoLidas,
} from '@/actions/notificacoes.actions'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { NotificacaoItem } from '@/actions/notificacoes.actions'
import type { ReactElement } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

const ICONE_TIPO: Record<string, ReactElement> = {
  nc_critica:           <AlertTriangle size={14} className="text-[#DC2626]" />,
  nc_resolvida:         <CheckCircle2  size={14} className="text-[#00963A]" />,
  nc_vencida:           <Clock         size={14} className="text-[#F59E0B]" />,
  inspecao_reprovada:   <ClipboardX    size={14} className="text-[#F59E0B]" />,
  agendamento_lembrete: <Calendar      size={14} className="text-[#0E2E60]" />,
}

function icone(tipo: string) {
  return ICONE_TIPO[tipo] ?? <Bell size={14} className="text-[#5A7089]" />
}

export function CentroNotificacoes() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotificacaoItem[]>([])
  const [naoLidas, setNaoLidas] = useState(0)
  const [carregando, setCarregando] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Carregar contagem inicial
  useEffect(() => {
    contarNaoLidas().then(setNaoLidas).catch(() => {})
  }, [])

  // Carregar ao abrir
  useEffect(() => {
    if (!open) return
    setCarregando(true)
    buscarNotificacoes(15).then((data) => {
      setNotifs(data)
      setNaoLidas(data.filter((n) => !n.lida).length)
      setCarregando(false)
    }).catch(() => setCarregando(false))
  }, [open])

  async function handleClicar(notif: NotificacaoItem) {
    if (!notif.lida) {
      await marcarComoLida(notif.id)
      setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, lida: true } : n))
      setNaoLidas((v) => Math.max(0, v - 1))
    }
    if (notif.url) {
      setOpen(false)
      router.push(notif.url)
    }
  }

  async function handleMarcarTodas() {
    startTransition(async () => {
      await marcarTodasComoLidas()
      setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })))
      setNaoLidas(0)
    })
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[#5A7089] hover:bg-[#EEF4FD] hover:text-[#0E2E60] transition-colors"
        aria-label="Notificações"
      >
        <Bell size={18} />
        {naoLidas > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#DC2626] rounded-full animate-pulse" />
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EEF4FD]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0F1B2D] text-sm">Notificações</span>
            {naoLidas > 0 && (
              <span className="text-[10px] bg-[#DC2626] text-white px-1.5 py-0.5 rounded-full font-bold">
                {naoLidas}
              </span>
            )}
          </div>
          {naoLidas > 0 && (
            <button
              onClick={handleMarcarTodas}
              disabled={isPending}
              className="flex items-center gap-1 text-[10px] text-[#0E2E60] font-semibold hover:underline"
            >
              {isPending ? <Loader2 size={10} className="animate-spin" /> : <CheckCheck size={10} />}
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="max-h-80 overflow-y-auto">
          {carregando ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin text-[#0E2E60]" />
            </div>
          ) : notifs.length === 0 ? (
            <div className="py-10 text-center">
              <Bell size={28} className="text-[#D5E3F0] mx-auto mb-2" />
              <p className="text-sm text-[#5A7089]">Nenhuma notificação</p>
            </div>
          ) : (
            notifs.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClicar(n)}
                className={`w-full flex items-start gap-3 px-4 py-3 border-b border-[#EEF4FD] hover:bg-[#F5F9FD] transition-colors text-left ${
                  !n.lida ? 'bg-[#EEF4FD]/40' : ''
                }`}
              >
                <span className="mt-0.5 shrink-0">{icone(n.tipo)}</span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-xs leading-snug ${n.lida ? 'text-[#5A7089]' : 'text-[#0F1B2D] font-semibold'}`}>
                    {n.titulo}
                  </span>
                  <span className="block text-[11px] text-[#5A7089] mt-0.5 leading-snug line-clamp-2">
                    {n.texto}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-[#A8BDD4] mt-1">
                    <Clock size={9} />
                    {formatDistanceToNow(new Date(n.createdAt), { locale: ptBR, addSuffix: true })}
                  </span>
                </span>
                {!n.lida && (
                  <span className="w-2 h-2 rounded-full bg-[#0E2E60] shrink-0 mt-1.5" />
                )}
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
