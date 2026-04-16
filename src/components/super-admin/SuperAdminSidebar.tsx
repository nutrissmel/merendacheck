'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, ScrollText,
  LogOut, ShieldCheck, ChevronRight, ClipboardCheck,
  AlertTriangle, CreditCard, Settings,
} from 'lucide-react'
import { logoutAction } from '@/actions/auth.actions'
import { cn } from '@/lib/utils'

const GRUPOS = [
  {
    label: 'GERAL',
    itens: [
      { label: 'Overview',    href: '/super-admin',             Icon: LayoutDashboard },
    ],
  },
  {
    label: 'GESTÃO',
    itens: [
      { label: 'Municípios',  href: '/super-admin/municipios',  Icon: Building2 },
      { label: 'Usuários',    href: '/super-admin/usuarios',    Icon: Users },
      { label: 'Inspeções',   href: '/super-admin/inspecoes',   Icon: ClipboardCheck },
      { label: 'NCs',         href: '/super-admin/ncs',         Icon: AlertTriangle },
    ],
  },
  {
    label: 'SISTEMA',
    itens: [
      { label: 'Planos & Billing', href: '/super-admin/billing',        Icon: CreditCard },
      { label: 'Configurações',    href: '/super-admin/configuracoes',   Icon: Settings },
      { label: 'Auditoria',        href: '/super-admin/auditoria',       Icon: ScrollText },
    ],
  },
]

export function SuperAdminSidebar({ user }: { user: { nome: string; email: string } }) {
  const pathname = usePathname()

  function isActive(href: string) {
    return href === '/super-admin' ? pathname === href : pathname.startsWith(href)
  }

  return (
    <aside className="w-60 flex flex-col bg-[#0A1628] shrink-0 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldCheck size={20} className="text-amber-400" />
          <span className="font-heading font-bold text-white text-base">MerendaCheck</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">
          Super Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {GRUPOS.map((grupo) => (
          <div key={grupo.label}>
            <p className="text-[9px] font-bold tracking-widest text-white/25 px-3 mb-1.5">
              {grupo.label}
            </p>
            <div className="space-y-0.5">
              {grupo.itens.map(({ label, href, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive(href)
                      ? 'bg-amber-400/15 text-amber-400'
                      : 'text-white/55 hover:text-white hover:bg-white/5',
                  )}
                >
                  <Icon size={15} />
                  {label}
                  {isActive(href) && <ChevronRight size={13} className="ml-auto" />}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="mb-3">
          <p className="text-xs font-semibold text-white truncate">{user.nome}</p>
          <p className="text-[11px] text-white/40 truncate">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={14} />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
