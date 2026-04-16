'use client'

import { useState, useEffect } from 'react'
import { Smartphone, X } from 'lucide-react'
import type { Papel } from '@prisma/client'

const DISMISS_KEY = 'pwa_banner_dismissed_until'
const DISMISS_DAYS = 7

interface Props {
  papel: Papel
}

export function InstallPWABanner({ papel }: Props) {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const elegivel = ['MERENDEIRA', 'DIRETOR_ESCOLA'].includes(papel)

  useEffect(() => {
    if (!elegivel) return

    // Already in standalone mode (installed)
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Dismissed recently
    const dismissedUntil = localStorage.getItem(DISMISS_KEY)
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [elegivel])

  function dismiss() {
    setShow(false)
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(until))
  }

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    setShow(false)
    if (outcome === 'accepted') {
      localStorage.removeItem(DISMISS_KEY)
    }
  }

  if (!show) return null

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-40 bg-[#0E2E60] rounded-2xl p-4 shadow-2xl"
      role="dialog"
      aria-label="Instalar MerendaCheck"
    >
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-white/60 hover:text-white"
        aria-label="Fechar"
        style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
          <Smartphone size={20} className="text-white" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-white font-bold text-sm">Instale o MerendaCheck</p>
          <p className="text-white/70 text-xs mt-0.5 leading-relaxed">
            Acesse mais rápido e funciona offline
          </p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <button
          onClick={install}
          className="flex-1 h-10 bg-[#00963A] text-white font-semibold rounded-xl text-sm"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          aria-label="Instalar aplicativo"
        >
          Instalar
        </button>
        <button
          onClick={dismiss}
          className="px-4 h-10 border border-white/20 text-white/80 font-medium rounded-xl text-sm"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
          aria-label="Dispensar banner"
        >
          Agora não
        </button>
      </div>
    </div>
  )
}
