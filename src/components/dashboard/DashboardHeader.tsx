'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { FileDown } from 'lucide-react'
import type { AuthUser } from '@/lib/auth'

type Periodo = '7d' | '30d' | '60d' | '90d'

interface DashboardHeaderProps {
  user: AuthUser
  tenant: { nome: string; estado: string } | null
  periodo: Periodo
  escolaId?: string
  escolas: { id: string; nome: string }[]
}

function getSaudacao(): { texto: string; icone: string } {
  const hora = new Date().getHours()
  if (hora < 12) return { texto: 'Bom dia', icone: '☀️' }
  if (hora < 18) return { texto: 'Boa tarde', icone: '🌤' }
  return { texto: 'Boa noite', icone: '🌙' }
}

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '60d', label: 'Últimos 60 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
]

export function DashboardHeader({ user, tenant, periodo, escolaId, escolas }: DashboardHeaderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { texto, icone } = getSaudacao()
  const primeiroNome = user.nome.split(' ')[0]

  function atualizarFiltro(chave: string, valor: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (valor) {
      params.set(chave, valor)
    } else {
      params.delete(chave)
    }
    router.replace(`/dashboard?${params.toString()}`)
  }

  function irParaRelatorios() {
    const params = new URLSearchParams()
    if (periodo) params.set('periodo', periodo)
    if (escolaId) params.set('escola', escolaId)
    router.push(`/relatorios?${params.toString()}`)
  }

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[#0F1B2D] font-heading">
          {texto}, {primeiroNome}! {icone}
        </h1>
        {tenant && (
          <p className="text-xs md:text-sm text-[#5A7089] mt-0.5">
            {tenant.nome} — {tenant.estado}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {/* Select de escola */}
        <select
          value={escolaId ?? ''}
          onChange={(e) => atualizarFiltro('escola', e.target.value || undefined)}
          className="flex-1 min-w-[130px] h-9 rounded-lg border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 cursor-pointer"
        >
          <option value="">Todas as escolas</option>
          {escolas.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>

        {/* Select de período */}
        <select
          value={periodo}
          onChange={(e) => atualizarFiltro('periodo', e.target.value)}
          className="flex-1 min-w-[130px] h-9 rounded-lg border border-[#D5E3F0] bg-white px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 cursor-pointer"
        >
          {PERIODOS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>

        {/* Botão PDF */}
        <button
          onClick={irParaRelatorios}
          className="h-9 flex items-center gap-1.5 px-3 rounded-lg border border-[#D5E3F0] bg-white text-sm font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors shrink-0"
          title="Exportar relatório"
        >
          <FileDown size={15} />
          PDF
        </button>
      </div>
    </header>
  )
}
