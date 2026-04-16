import { buscarOverviewSuperAdmin } from '@/actions/super-admin.actions'
import { getServerUser } from '@/lib/auth'
import { Building2, Users, ClipboardCheck, AlertTriangle, Activity, Crown } from 'lucide-react'
import Link from 'next/link'

const PLANO_LABEL: Record<string, string> = {
  STARTER: 'Starter', CRESCIMENTO: 'Crescimento', MUNICIPAL: 'Municipal', ENTERPRISE: 'Enterprise',
}
const STATUS_STYLE: Record<string, string> = {
  TRIAL: 'bg-amber-100 text-amber-700',
  ATIVO: 'bg-green-100 text-green-700',
  INADIMPLENTE: 'bg-red-100 text-red-700',
  CANCELADO: 'bg-neutral-100 text-neutral-600',
}

export default async function SuperAdminPage() {
  const [user, data] = await Promise.all([getServerUser(), buscarOverviewSuperAdmin()])

  const stats = [
    { label: 'Municípios ativos', value: data.municipiosAtivos, total: data.totalMunicipios, Icon: Building2, cor: 'text-blue-600', bg: 'bg-blue-50', href: '/super-admin/municipios' },
    { label: 'Usuários totais',   value: data.totalUsuarios,   total: null, Icon: Users,          cor: 'text-violet-600', bg: 'bg-violet-50', href: '/super-admin/usuarios' },
    { label: 'Inspeções no mês',  value: data.inspecoesMes,    total: data.totalInspecoes, Icon: ClipboardCheck, cor: 'text-green-600', bg: 'bg-green-50', href: '/super-admin/inspecoes' },
    { label: 'NCs críticas',      value: data.ncsCriticas,     total: data.totalNCs, Icon: AlertTriangle, cor: 'text-red-600', bg: 'bg-red-50', href: '/super-admin/ncs' },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-amber-400/20 flex items-center justify-center">
          <Crown size={22} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">
            Olá, {user.nome.split(' ')[0]} 👑
          </h1>
          <p className="text-sm text-[#5A7089]">Painel de controle global — MerendaCheck</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, total, Icon, cor, bg, href }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl p-5 border border-[#EEF4FD] shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={cor} />
            </div>
            <p className="text-2xl font-bold text-[#0F1B2D] font-heading">{value.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-[#5A7089] mt-0.5">{label}</p>
            {total !== null && total !== undefined && (
              <p className="text-[10px] text-[#5A7089]/60 mt-1">{total.toLocaleString('pt-BR')} total</p>
            )}
          </Link>
        ))}
      </div>

      {/* Municípios recentes */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF4FD]">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-[#0E2E60]" />
            <h2 className="font-heading font-bold text-[#0F1B2D]">Municípios recentes</h2>
          </div>
          <Link href="/super-admin/municipios" className="text-xs text-[#0E2E60] font-semibold hover:underline">
            Ver todos →
          </Link>
        </div>
        <div className="divide-y divide-[#F5F9FD]">
          {data.municipiosRecentes.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-4 hover:bg-[#F5F9FD]/50 transition-colors">
              <div>
                <p className="text-sm font-semibold text-[#0F1B2D]">{m.nome}</p>
                <p className="text-xs text-[#5A7089]">{m.estado} · {m._count.usuarios} usuários · {m._count.escolas} escolas</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${STATUS_STYLE[m.planoStatus] ?? ''}`}>
                  {m.planoStatus}
                </span>
                <span className="text-[10px] font-medium text-[#5A7089] bg-[#F5F9FD] px-2 py-0.5 rounded-full border border-[#D5E3F0]">
                  {PLANO_LABEL[m.plano] ?? m.plano}
                </span>
                {!m.ativo && (
                  <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">INATIVO</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
