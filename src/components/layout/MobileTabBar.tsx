'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/inspecoes', label: 'Inspeções', icon: ClipboardList },
  { href: '/perfil', label: 'Eu', icon: User },
]

export function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center bg-white/95 backdrop-blur-md border-t border-neutral-200 shadow-[0_-1px_8px_rgba(14,46,96,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Navegação principal"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
          >
            {/* Indicador ativo */}
            {active && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-green-600" />
            )}
            <span className={cn(
              'flex items-center justify-center w-10 h-7 rounded-xl transition-colors',
              active ? 'bg-green-50' : ''
            )}>
              <Icon
                size={20}
                className={active ? 'text-green-600' : 'text-neutral-400'}
                aria-hidden="true"
              />
            </span>
            <span className={cn(
              'text-[10px] font-medium leading-none',
              active ? 'text-green-600 font-bold' : 'text-neutral-400'
            )}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
