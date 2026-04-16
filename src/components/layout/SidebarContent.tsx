'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  School,
  ListChecks,
  ClipboardCheck,
  AlertTriangle,
  BarChart3,
  Calendar,
  Users,
  Settings,
  CreditCard,
  LogOut,
  CloudOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/Logo'
import { logoutAction } from '@/actions/auth.actions'
import { useSyncContext } from '@/providers/SyncProvider'
import type { Papel } from '@prisma/client'

type NavItem = {
  label: string
  href: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
  papeis?: Papel[]
  badge?: number
}

const MENU_PRINCIPAL: NavItem[] = [
  { label: 'Dashboard',          href: '/dashboard',         Icon: LayoutDashboard },
  { label: 'Inspeções',          href: '/inspecoes',          Icon: ClipboardCheck },
  { label: 'Não Conformidades',  href: '/nao-conformidades',  Icon: AlertTriangle },
  { label: 'Sincronização',      href: '/sync',               Icon: CloudOff },
]

const MENU_GESTAO: NavItem[] = [
  { label: 'Escolas',     href: '/escolas',     Icon: School,    papeis: ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'DIRETOR_ESCOLA', 'SUPER_ADMIN'] },
  { label: 'Checklists',  href: '/checklists',  Icon: ListChecks, papeis: ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'DIRETOR_ESCOLA', 'SUPER_ADMIN'] },
  { label: 'Relatórios',  href: '/relatorios',  Icon: BarChart3,  papeis: ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'] },
  { label: 'Agendamentos',href: '/agendamentos', Icon: Calendar,  papeis: ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'] },
]

const MENU_ADMIN: NavItem[] = [
  { label: 'Usuários',      href: '/configuracoes/usuarios', Icon: Users,      papeis: ['ADMIN_MUNICIPAL', 'SUPER_ADMIN'] },
  { label: 'Configurações', href: '/configuracoes',          Icon: Settings,   papeis: ['ADMIN_MUNICIPAL', 'SUPER_ADMIN'] },
  { label: 'Planos',        href: '/planos',                 Icon: CreditCard, papeis: ['ADMIN_MUNICIPAL', 'SUPER_ADMIN'] },
]

function NavLink({
  item,
  ncCount,
  ncVencidas,
  syncPendentes,
  onNavClick,
}: {
  item: NavItem
  ncCount: number
  ncVencidas: number
  syncPendentes: number
  onNavClick?: () => void
}) {
  const pathname = usePathname()
  const isActive =
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href)

  const badgeCount =
    item.href === '/nao-conformidades' ? ncCount :
    item.href === '/sync' ? syncPendentes :
    0

  const badgePulse = item.href === '/nao-conformidades' && ncVencidas > 0

  return (
    <Link
      href={item.href}
      onClick={onNavClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl mx-2 transition-all group text-sm',
        isActive
          ? 'bg-[#00963A] text-white font-semibold shadow-sm'
          : 'text-[#B3CFF2] hover:bg-white/[0.08] hover:text-white'
      )}
    >
      <item.Icon
        size={18}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-white' : 'text-[#7AAAE3] group-hover:text-white'
        )}
      />
      <span className="flex-1 truncate">{item.label}</span>
      {badgeCount > 0 && (
        <span className={cn(
          'min-w-[20px] h-5 px-1.5 text-white text-xs font-bold rounded-full flex items-center justify-center',
          badgePulse ? 'bg-[#B91C1C] animate-pulse' : 'bg-[#DC2626]'
        )}>
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </Link>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="px-5 pt-5 pb-1 text-[10px] font-bold uppercase tracking-widest text-[#7AAAE3]">
      {label}
    </p>
  )
}

interface SidebarContentProps {
  user: { nome: string; email: string; papel: Papel }
  ncCount: number
  ncVencidas?: number
  onNavClick?: () => void
}

export function SidebarContent({ user, ncCount, ncVencidas = 0, onNavClick }: SidebarContentProps) {
  const papel = user.papel
  const { totalPendentes: syncPendentes } = useSyncContext()

  const gestaoVisivel = MENU_GESTAO.filter(
    (item) => !item.papeis || item.papeis.includes(papel)
  )
  const adminVisivel = MENU_ADMIN.filter(
    (item) => !item.papeis || item.papeis.includes(papel)
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-white/10 shrink-0">
        <Logo variant="light" size="md" />
      </div>

      {/* Navegação */}
      <nav className="flex-1 py-2">
        <SectionLabel label="Menu Principal" />
        <div className="space-y-0.5">
          {MENU_PRINCIPAL.map((item) => (
            <NavLink key={item.href} item={item} ncCount={ncCount} ncVencidas={ncVencidas} syncPendentes={syncPendentes} onNavClick={onNavClick} />
          ))}
        </div>

        {gestaoVisivel.length > 0 && (
          <>
            <SectionLabel label="Gestão" />
            <div className="space-y-0.5">
              {gestaoVisivel.map((item) => (
                <NavLink key={item.href} item={item} ncCount={ncCount} ncVencidas={ncVencidas} syncPendentes={syncPendentes} onNavClick={onNavClick} />
              ))}
            </div>
          </>
        )}

        {adminVisivel.length > 0 && (
          <>
            <SectionLabel label="Administração" />
            <div className="space-y-0.5">
              {adminVisivel.map((item) => (
                <NavLink key={item.href} item={item} ncCount={ncCount} ncVencidas={ncVencidas} syncPendentes={syncPendentes} onNavClick={onNavClick} />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer do usuário */}
      <div className="border-t border-white/10 p-3 shrink-0">
        <Link
          href="/perfil"
          onClick={onNavClick}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.08] transition-colors group"
        >
          <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold text-white shrink-0">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.nome}</p>
            <p className="text-xs text-[#7AAAE3] truncate">{user.email}</p>
          </div>
        </Link>
        <form action={logoutAction} className="mt-1">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[#B3CFF2] hover:text-white hover:bg-white/[0.08] transition-colors text-sm"
          >
            <LogOut size={16} className="text-[#7AAAE3]" />
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}
