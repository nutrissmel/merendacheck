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
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/97 backdrop-blur-xl border-t border-[#EAF0F9] shadow-[0_-4px_24px_rgba(14,46,96,0.10)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="flex items-center h-[62px]">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' } as React.CSSProperties}
            >
              <span className={cn(
                'flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-200',
                active ? 'bg-[#0E2E60] shadow-[0_2px_8px_rgba(14,46,96,0.30)]' : 'bg-transparent'
              )}>
                <Icon
                  size={20}
                  className={cn('transition-colors duration-200', active ? 'text-white' : 'text-[#9DAFC4]')}
                  aria-hidden="true"
                />
              </span>
              <span className={cn(
                'text-[10px] leading-none transition-colors duration-200',
                active ? 'text-[#0E2E60] font-bold' : 'text-[#9DAFC4] font-medium'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
