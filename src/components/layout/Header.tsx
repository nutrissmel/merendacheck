'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronRight, User, LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { MobileNav } from './MobileNav'
import { BuscaGlobal, BotaoBusca } from './BuscaGlobal'
import { CentroNotificacoes } from './CentroNotificacoes'
import { logoutAction } from '@/actions/auth.actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Papel } from '@prisma/client'

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':              'Dashboard',
  '/home-mobile':            'Início',
  '/escolas':                'Escolas',
  '/checklists':             'Checklists',
  '/inspecoes':              'Inspeções',
  '/nao-conformidades':      'Não Conformidades',
  '/relatorios':             'Relatórios',
  '/agendamentos':           'Agendamentos',
  '/planos':                 'Planos',
  '/configuracoes':          'Configurações',
  '/configuracoes/usuarios': 'Usuários',
  '/perfil':                 'Meu Perfil',
}

function buildBreadcrumb(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string; key: string }[] = [
    { label: 'MerendaCheck', href: '/dashboard', key: 'root' },
  ]
  let accumulated = ''
  for (const seg of segments) {
    accumulated += `/${seg}`
    const label = ROUTE_LABELS[accumulated]
    if (label) crumbs.push({ label, href: accumulated, key: accumulated })
  }
  if (crumbs.length > 1 && crumbs[1].href === '/dashboard') {
    return crumbs.slice(1)
  }
  return crumbs
}

interface HeaderProps {
  user: { nome: string; email: string; papel: Papel }
  ncCount: number
}

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function Header({ user, ncCount }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const breadcrumb = buildBreadcrumb(pathname)
  const [buscaAberta, setBuscaAberta] = useState(false)

  const inicialNome = user.nome.charAt(0).toUpperCase()
  const pageLabel = breadcrumb[breadcrumb.length - 1]?.label ?? 'MerendaCheck'

  // home-mobile has its own full-screen header — don't show layout header on mobile there
  const isMobileHome = pathname === '/home-mobile'

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setBuscaAberta((v) => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <BuscaGlobal aberto={buscaAberta} onFechar={() => setBuscaAberta(false)} />

      {/* ── Mobile slim header — hidden on /home-mobile ──────── */}
      {!isMobileHome && (
        <div
          className="md:hidden flex items-center gap-2 px-3 bg-white border-b border-[#D5E3F0] sticky top-0 z-30 shrink-0 shadow-[0_1px_3px_rgba(14,46,96,0.06)]"
          style={{ height: 56, paddingTop: 'env(safe-area-inset-top)' }}
        >
          <MobileNav user={user} ncCount={ncCount} />

          <span className="flex-1 font-bold text-[#0E2E60] text-sm truncate text-center">
            {pageLabel}
          </span>

          {/* Avatar → /perfil (direct link, no dropdown) */}
          <Link
            href="/perfil"
            className="w-9 h-9 rounded-full bg-[#0E2E60] flex items-center justify-center text-sm font-bold text-white shrink-0"
            aria-label="Meu perfil"
            style={TAP}
          >
            {inicialNome}
          </Link>
        </div>
      )}

      {/* ── Desktop header ───────────────────────────────────── */}
      <header className="hidden md:flex h-16 bg-white border-b border-[#D5E3F0] items-center justify-between px-6 sticky top-0 z-30 shadow-[0_1px_3px_rgba(14,46,96,0.06)] shrink-0">

        {/* Left: breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <nav className="flex items-center gap-1.5 text-sm min-w-0">
            {breadcrumb.map((crumb, i) => {
              const isLast = i === breadcrumb.length - 1
              return (
                <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <ChevronRight size={14} className="text-[#A8BDD4] shrink-0" />}
                  {isLast ? (
                    <span className="font-semibold text-[#0E2E60] truncate">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-[#5A7089] hover:text-[#0E2E60] transition-colors truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              )
            })}
          </nav>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <BotaoBusca onClick={() => setBuscaAberta(true)} />
          <ThemeToggle />
          <CentroNotificacoes />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 pl-2 ml-1 border-l border-[#D5E3F0] hover:opacity-80 transition-opacity outline-none">
              <span className="text-right">
                <span className="block text-sm font-semibold text-[#0F1B2D] leading-tight">
                  {user.nome}
                </span>
                <span className="block text-xs text-[#5A7089] leading-tight truncate max-w-[120px]">
                  {user.email}
                </span>
              </span>
              <span className="w-8 h-8 rounded-full bg-[#0E2E60] flex items-center justify-center text-sm font-bold text-white shrink-0">
                {inicialNome}
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>
                <span className="block font-semibold text-[#0F1B2D]">{user.nome}</span>
                <span className="block text-xs text-[#5A7089] font-normal truncate">{user.email}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push('/perfil')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <User size={14} />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[#DC2626]">
                <LogOut size={14} />
                <form action={logoutAction} className="flex-1">
                  <button type="submit" className="w-full text-left text-sm text-[#DC2626]">
                    Sair
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  )
}
