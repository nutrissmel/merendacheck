'use client'

import { useState, useEffect } from 'react'
import { Bell, X, Loader2 } from 'lucide-react'
import { salvarPushSubscription } from '@/actions/notificacoes.actions'
import { toast } from 'sonner'

const DISMISS_KEY = 'push_banner_dismissed_until'
const DISMISS_DAYS = 7
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function BannerNotificacoesPush() {
  const [show, setShow] = useState(false)
  const [ativando, setAtivando] = useState(false)
  const [swReg, setSwReg] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Só mostrar em mobile ou dispositivos que suportam push
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile && !window.matchMedia('(max-width: 768px)').matches) return

    // Verificar suporte
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    // Já concedeu permissão
    if (Notification.permission === 'granted') return

    // Dispensado recentemente
    const dismissedUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) return

    // Já está em standalone (PWA instalada) — mostrar mesmo assim pois pode não ter push ainda
    navigator.serviceWorker.ready.then((reg) => {
      setSwReg(reg)
      reg.pushManager.getSubscription().then((sub) => {
        if (!sub) setShow(true)
      })
    }).catch(() => {})
  }, [])

  function dismiss() {
    setShow(false)
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(until))
  }

  async function ativarNotificacoes() {
    setAtivando(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error('Permissão negada. Você pode ativar nas configurações do navegador.')
        setAtivando(false)
        setShow(false)
        return
      }

      if (!swReg) throw new Error('Service Worker não disponível')

      let subscription: PushSubscription
      if (VAPID_PUBLIC_KEY) {
        subscription = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })
      } else {
        // Sem VAPID key configurada — simular subscrição para demo
        toast.success('Notificações ativadas! (modo demo — configure VAPID_PUBLIC_KEY para push real)')
        setAtivando(false)
        setShow(false)
        return
      }

      const key = subscription.getKey('p256dh')
      const auth = subscription.getKey('auth')

      await salvarPushSubscription({
        endpoint: subscription.endpoint,
        p256dh: key ? btoa(String.fromCharCode(...new Uint8Array(key))) : '',
        auth: auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '',
        userAgent: navigator.userAgent.slice(0, 200),
      })

      toast.success('Notificações push ativadas com sucesso!')
      setShow(false)
    } catch (err: any) {
      console.error('[Push]', err)
      toast.error('Erro ao ativar notificações. Tente novamente.')
    } finally {
      setAtivando(false)
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 bg-[#0E2E60] rounded-2xl p-4 shadow-2xl max-w-sm mx-auto">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors"
        aria-label="Fechar"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <Bell size={20} className="text-white" />
        </div>
        <div className="flex-1 pr-6">
          <p className="text-white font-bold text-sm">Ative as notificações</p>
          <p className="text-white/70 text-xs mt-0.5 leading-relaxed">
            Receba alertas de NCs críticas e inspeções atrasadas em tempo real
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={ativarNotificacoes}
          disabled={ativando}
          className="flex-1 h-10 bg-[#00963A] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-70"
        >
          {ativando ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
          {ativando ? 'Ativando...' : 'Ativar'}
        </button>
        <button
          onClick={dismiss}
          className="px-4 h-10 border border-white/20 text-white/80 font-medium rounded-xl text-sm"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
