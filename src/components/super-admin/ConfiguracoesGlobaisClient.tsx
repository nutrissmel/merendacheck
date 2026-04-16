'use client'

import { useState } from 'react'
import {
  Settings, ShieldCheck, Database, Key,
  Eye, EyeOff, Loader2, RefreshCw, CheckCircle,
} from 'lucide-react'
import { resetarSenhaUsuarioAction } from '@/actions/super-admin.actions'
import { toast } from 'sonner'

type SuperAdmin = {
  id: string; nome: string; email: string
  ativo: boolean; createdAt: Date
  tenant: { nome: string }
}

type Config = {
  totalTenants: number; totalUsuarios: number
  totalInspecoes: number; versaoSchema: string
}

function fmtData(d: Date) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function ConfiguracoesGlobaisClient({
  config, superAdmins,
}: {
  config: Config
  superAdmins: SuperAdmin[]
}) {
  const [resetandoId, setResetandoId] = useState<string | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [modalAberto, setModalAberto] = useState<SuperAdmin | null>(null)

  async function handleResetarSenha() {
    if (!modalAberto) return
    if (novaSenha.length < 8) { toast.error('Senha deve ter mínimo 8 caracteres'); return }
    setResetandoId(modalAberto.id)
    const res = await resetarSenhaUsuarioAction(modalAberto.id, novaSenha)
    setResetandoId(null)
    if (res.sucesso) {
      toast.success(`Senha de ${modalAberto.nome} redefinida!`)
      setModalAberto(null)
      setNovaSenha('')
    } else {
      toast.error(res.erro)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-[#0E2E60]" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">Configurações Globais</h1>
          <p className="text-sm text-[#5A7089]">Informações e controles do sistema MerendaCheck</p>
        </div>
      </div>

      {/* Stats do sistema */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Database size={16} className="text-[#0E2E60]" />
          <h2 className="font-heading font-bold text-[#0F1B2D]">Estado do sistema</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Municípios', value: config.totalTenants },
            { label: 'Usuários', value: config.totalUsuarios },
            { label: 'Inspeções', value: config.totalInspecoes },
            { label: 'Versão schema', value: config.versaoSchema },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-bold font-heading text-[#0F1B2D]">{value}</p>
              <p className="text-xs text-[#5A7089] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Super Admins */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-6 py-4 border-b border-[#EEF4FD]">
          <ShieldCheck size={16} className="text-amber-500" />
          <h2 className="font-heading font-bold text-[#0F1B2D]">Super Admins ({superAdmins.length})</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
              {['Nome', 'E-mail', 'Município âncora', 'Criado em', 'Ação'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-[#5A7089] px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F9FD]">
            {superAdmins.map((sa) => (
              <tr key={sa.id}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-amber-500 shrink-0" />
                    <p className="text-sm font-semibold text-[#0F1B2D]">{sa.nome}</p>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-[#5A7089]">{sa.email}</td>
                <td className="px-5 py-3.5 text-sm text-[#5A7089]">{sa.tenant.nome}</td>
                <td className="px-5 py-3.5 text-xs text-[#5A7089]">{fmtData(sa.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => setModalAberto(sa)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#EEF4FD] text-[#0E2E60] hover:bg-[#D5E3F0] font-medium transition-colors"
                  >
                    <Key size={12} />
                    Redefinir senha
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Informações de ambiente */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <RefreshCw size={16} className="text-[#0E2E60]" />
          <h2 className="font-heading font-bold text-[#0F1B2D]">Ambiente</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Supabase URL', value: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] + '.supabase.co' },
            { label: 'Ambiente', value: process.env.NODE_ENV ?? 'production' },
            { label: 'Sentry', value: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'Configurado ✓' : 'Não configurado' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-[#F5F9FD] last:border-0">
              <span className="text-sm text-[#5A7089]">{label}</span>
              <span className="text-sm font-mono font-medium text-[#0F1B2D]">{value ?? '—'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal redefinir senha */}
      {modalAberto && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setModalAberto(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="px-6 py-4 border-b border-[#EEF4FD]">
                <h2 className="font-bold text-[#0F1B2D] font-heading">Redefinir senha</h2>
                <p className="text-sm text-[#5A7089] mt-0.5">{modalAberto.nome}</p>
              </div>
              <div className="px-6 py-5">
                <label className="block text-xs font-semibold text-[#5A7089] mb-1.5">Nova senha</label>
                <div className="relative">
                  <input
                    type={mostrarSenha ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60]"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleResetarSenha() }}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7089]"
                  >
                    {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button onClick={() => setModalAberto(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm text-[#5A7089] hover:bg-[#F5F9FD]">
                  Cancelar
                </button>
                <button onClick={handleResetarSenha} disabled={!!resetandoId}
                  className="flex-1 py-2.5 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] disabled:opacity-50 flex items-center justify-center gap-2">
                  {resetandoId ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Redefinir
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
