'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { SidebarContent } from './SidebarContent'
import type { Papel } from '@prisma/client'

interface MobileNavProps {
  user: { nome: string; email: string; papel: Papel }
  ncCount: number
}

export function MobileNav({ user, ncCount }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  // Fecha ao pressionar ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  // Bloqueia scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Botão hamburguer */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#5A7089] hover:bg-[#EEF4FD] transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-[#0E2E60]
          transform transition-transform duration-200 ease-out md:hidden
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Botão fechar */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Fechar menu"
        >
          <X size={18} />
        </button>

        <SidebarContent
          user={user}
          ncCount={ncCount}
          onNavClick={() => setOpen(false)}
        />
      </div>
    </>
  )
}
