'use client'

import { useState } from 'react'
import { Save, Loader2, Building2 } from 'lucide-react'
import { atualizarDadosMunicipioAction } from '@/actions/configuracoes.actions'
import { toast } from 'sonner'
import type { DadosTenant } from '@/actions/configuracoes.actions'

const ESTADOS = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

interface Props {
  tenant: DadosTenant
}

export function SecaoMunicipio({ tenant }: Props) {
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    nome: tenant.nome,
    estado: tenant.estado,
    codigoIbge: tenant.codigoIbge,
    nomeSecretaria: tenant.nomeSecretaria ?? '',
    telefone: tenant.telefone ?? '',
    emailInstitucional: tenant.emailInstitucional ?? '',
    website: tenant.website ?? '',
    cnpj: tenant.cnpj ?? '',
  })

  function handleChange(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSalvar() {
    if (!form.nome.trim() || !form.estado || !form.codigoIbge.trim()) {
      toast.error('Nome, estado e código IBGE são obrigatórios')
      return
    }
    setSalvando(true)
    const res = await atualizarDadosMunicipioAction(form)
    setSalvando(false)
    if (res.sucesso) {
      toast.success('Alterações salvas ✓')
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao salvar')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#0F1B2D] font-heading flex items-center gap-2">
          <Building2 size={16} className="text-[#0E2E60]" />
          Dados do Município
        </h2>
        <p className="text-sm text-[#5A7089] mt-0.5">Informações que aparecem em relatórios e e-mails</p>
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <div>
          <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Nome do município *</label>
          <input
            type="text"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
          />
        </div>

        {/* Estado + IBGE */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Estado *</label>
            <select
              value={form.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
              className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
            >
              <option value="">Selecione...</option>
              {ESTADOS.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Código IBGE *</label>
            <input
              type="text"
              value={form.codigoIbge}
              onChange={(e) => handleChange('codigoIbge', e.target.value.replace(/\D/g, '').slice(0, 7))}
              placeholder="7 dígitos"
              className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
            />
          </div>
        </div>

        {/* Secretaria */}
        <div>
          <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Nome da Secretaria</label>
          <input
            type="text"
            value={form.nomeSecretaria}
            onChange={(e) => handleChange('nomeSecretaria', e.target.value)}
            placeholder="Secretaria Municipal de Educação"
            className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
          />
        </div>

        {/* Telefone + E-mail */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Telefone de contato</label>
            <input
              type="tel"
              value={form.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              placeholder="(61) 3621-0000"
              className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">E-mail institucional</label>
            <input
              type="email"
              value={form.emailInstitucional}
              onChange={(e) => handleChange('emailInstitucional', e.target.value)}
              placeholder="sme@municipio.go.gov.br"
              className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
            />
          </div>
        </div>

        {/* Website */}
        <div>
          <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Website</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://www.municipio.go.gov.br"
            className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
          />
        </div>

        {/* CNPJ */}
        <div>
          <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">CNPJ da Prefeitura (para relatórios FNDE)</label>
          <input
            type="text"
            value={form.cnpj}
            onChange={(e) => handleChange('cnpj', e.target.value)}
            placeholder="XX.XXX.XXX/0001-XX"
            maxLength={18}
            className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50"
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar alterações
        </button>
      </div>
    </div>
  )
}
