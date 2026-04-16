'use client'

import { SidebarContent } from './SidebarContent'
import type { Papel } from '@prisma/client'

interface SidebarProps {
  user: { nome: string; email: string; papel: Papel }
  ncCount: number
  ncVencidas?: number
}

export function Sidebar({ user, ncCount, ncVencidas = 0 }: SidebarProps) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col bg-[#0E2E60] min-h-screen">
      <SidebarContent user={user} ncCount={ncCount} ncVencidas={ncVencidas} />
    </aside>
  )
}
