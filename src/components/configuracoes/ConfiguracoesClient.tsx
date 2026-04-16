'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Palette,
  Shield,
  Bell,
  Lock,
  ClipboardList,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { SecaoMunicipio } from './SecaoMunicipio'
import { SecaoMarca } from './SecaoMarca'
import { SecaoSeguranca } from './SecaoSeguranca'
import { SecaoNotificacoesGlobais } from './SecaoNotificacoesGlobais'
import { SecaoLGPD } from './SecaoLGPD'
import { SecaoAuditLog } from './SecaoAuditLog'
import { SecaoIntegracoes } from './SecaoIntegracoes'
import type { DadosTenant } from '@/actions/configuracoes.actions'

type SecaoId = 'municipio' | 'marca' | 'seguranca' | 'notificacoes' | 'lgpd' | 'audit-log' | 'integracoes'

const SECOES: { id: SecaoId; label: string; icon: typeof Building2 }[] = [
  { id: 'municipio',      label: 'Município',            icon: Building2 },
  { id: 'marca',          label: 'Marca',                icon: Palette },
  { id: 'seguranca',      label: 'Segurança',            icon: Shield },
  { id: 'notificacoes',   label: 'Notificações',         icon: Bell },
  { id: 'lgpd',          label: 'LGPD',                 icon: Lock },
  { id: 'audit-log',     label: 'Audit Log',            icon: ClipboardList },
  { id: 'integracoes',   label: 'Integrações',          icon: Zap },
]

interface Props {
  tenant: DadosTenant
  usuario2FAAtivo: boolean
  usuariosLGPD: { id: string; nome: string; email: string; papel: string }[]
  usuariosAuditoria: { id: string; nome: string; email: string }[]
  acoesUnicas: string[]
  logAcessos: { acao: string; ip: string | null; userAgent: string | null; createdAt: Date }[]
  nomeTenant: string
}

export function ConfiguracoesClient({
  tenant,
  usuario2FAAtivo,
  usuariosLGPD,
  usuariosAuditoria,
  acoesUnicas,
  logAcessos,
  nomeTenant,
}: Props) {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoId>('municipio')

  // Sincronizar com hash da URL
  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as SecaoId
    if (SECOES.find((s) => s.id === hash)) setSecaoAtiva(hash)
  }, [])

  function navegar(id: SecaoId) {
    setSecaoAtiva(id)
    window.history.replaceState(null, '', `#${id}`)
  }

  return (
    <div className="space-y-4 md:space-y-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#0F1B2D] font-heading">Configurações</h1>
        <p className="text-sm text-[#5A7089] mt-0.5">Gerencie as configurações do município</p>
      </div>

      {/* Mobile: select dropdown */}
      <div className="md:hidden mb-4">
        <select
          value={secaoAtiva}
          onChange={(e) => navegar(e.target.value as SecaoId)}
          className="w-full h-10 rounded-xl border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20"
        >
          {SECOES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Layout principal: nav lateral + conteúdo */}
      <div className="flex gap-6 items-start">
        {/* Nav lateral — desktop only */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
            {SECOES.map((s, idx) => {
              const Icon = s.icon
              const ativa = secaoAtiva === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => navegar(s.id)}
                  className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold transition-colors ${
                    idx > 0 ? 'border-t border-[#EEF4FD]' : ''
                  } ${
                    ativa
                      ? 'bg-[#EEF4FD] text-[#0E2E60]'
                      : 'text-[#5A7089] hover:bg-[#F5F9FD] hover:text-[#0F1B2D]'
                  }`}
                >
                  <Icon size={14} className={ativa ? 'text-[#0E2E60]' : 'text-[#A8BDD4]'} />
                  {s.label}
                  {ativa && <ChevronRight size={12} className="ml-auto" />}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Conteúdo da seção ativa */}
        <div className="flex-1 min-w-0 bg-white border border-[#D5E3F0] rounded-xl shadow-[0_1px_3px_rgba(14,46,96,0.06)] p-6">
          {secaoAtiva === 'municipio' && <SecaoMunicipio tenant={tenant} />}
          {secaoAtiva === 'marca' && <SecaoMarca tenant={tenant} />}
          {secaoAtiva === 'seguranca' && (
            <SecaoSeguranca usuario2FAAtivo={usuario2FAAtivo} logAcessos={logAcessos} />
          )}
          {secaoAtiva === 'notificacoes' && <SecaoNotificacoesGlobais tenant={tenant} />}
          {secaoAtiva === 'lgpd' && (
            <SecaoLGPD usuarios={usuariosLGPD} nomeTenant={nomeTenant} />
          )}
          {secaoAtiva === 'audit-log' && (
            <SecaoAuditLog usuariosIniciais={usuariosAuditoria} acoesIniciais={acoesUnicas} />
          )}
          {secaoAtiva === 'integracoes' && <SecaoIntegracoes tenant={tenant} />}
        </div>
      </div>
    </div>
  )
}
