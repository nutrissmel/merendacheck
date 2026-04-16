'use client'

import { useState } from 'react'
import { Bell, Save, Loader2 } from 'lucide-react'
import { salvarNotificacoesGlobaisAction } from '@/actions/configuracoes.actions'
import { toast } from 'sonner'
import type { DadosTenant } from '@/actions/configuracoes.actions'

interface Props {
  tenant: DadosTenant
}

export function SecaoNotificacoesGlobais({ tenant }: Props) {
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({
    notifNcCritica: tenant.notifNcCritica,
    notifInspecaoReprovada: tenant.notifInspecaoReprovada,
    notifSemInspecaoDias: tenant.notifSemInspecaoDias,
    notifRelatorioMensal: tenant.notifRelatorioMensal,
    notifEmailAdmin: tenant.notifEmailAdmin,
    notifEmailNutricionista: tenant.notifEmailNutricionista,
    notifReplyTo: tenant.notifReplyTo ?? '',
  })

  function toggle(field: keyof typeof form) {
    if (typeof form[field] === 'boolean') {
      setForm((prev) => ({ ...prev, [field]: !prev[field] }))
    }
  }

  async function handleSalvar() {
    setSalvando(true)
    const res = await salvarNotificacoesGlobaisAction(form)
    setSalvando(false)
    if (res.sucesso) {
      toast.success('Configurações salvas ✓')
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao salvar')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#0F1B2D] font-heading flex items-center gap-2">
          <Bell size={16} className="text-[#0E2E60]" />
          Notificações Globais do Município
        </h2>
        <p className="text-sm text-[#5A7089] mt-0.5">Configurações padrão de alertas automáticos para administradores</p>
      </div>

      {/* Alertas automáticos */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Alertas automáticos para admins</h3>
        </div>
        <div className="divide-y divide-[#EEF4FD]">
          <CheckboxRow
            label="NC crítica gerada em qualquer escola"
            descricao="Severidade CRÍTICA detectada numa inspeção"
            checked={form.notifNcCritica}
            onChange={() => toggle('notifNcCritica')}
          />
          <CheckboxRow
            label="Inspeção reprovada em qualquer escola"
            descricao="Score abaixo de 60% ao finalizar inspeção"
            checked={form.notifInspecaoReprovada}
            onChange={() => toggle('notifInspecaoReprovada')}
          />
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm text-[#0F1B2D]">Escola sem inspeção há mais de</p>
              <p className="text-xs text-[#5A7089]">Alerta quando escola ultrapassa o prazo sem inspeção</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={form.notifSemInspecaoDias}
                onChange={(e) => setForm((prev) => ({ ...prev, notifSemInspecaoDias: Number(e.target.value) }))}
                className="h-8 rounded-lg border border-[#D5E3F0] px-2 text-sm text-[#0F1B2D] focus:outline-none focus:ring-1 focus:ring-[#0E2E60]/20 bg-white"
              >
                {[7, 14, 30, 60].map((d) => (
                  <option key={d} value={d}>{d} dias</option>
                ))}
              </select>
            </div>
          </div>
          <CheckboxRow
            label="Relatório mensal automático"
            descricao="Envia resumo mensal de conformidade no 1º dia do mês"
            checked={form.notifRelatorioMensal}
            onChange={() => toggle('notifRelatorioMensal')}
          />
        </div>
      </div>

      {/* Destinatários */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Destinatários dos alertas</h3>
        </div>
        <div className="divide-y divide-[#EEF4FD]">
          <CheckboxRow
            label="Todos os administradores municipais"
            checked={form.notifEmailAdmin}
            onChange={() => toggle('notifEmailAdmin')}
          />
          <CheckboxRow
            label="Nutricionistas responsáveis pela escola"
            checked={form.notifEmailNutricionista}
            onChange={() => toggle('notifEmailNutricionista')}
          />
        </div>
      </div>

      {/* E-mail de resposta */}
      <div>
        <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">
          Responder para (Reply-To dos e-mails automáticos)
        </label>
        <input
          type="email"
          value={form.notifReplyTo}
          onChange={(e) => setForm((prev) => ({ ...prev, notifReplyTo: e.target.value }))}
          placeholder="sme@municipio.go.gov.br"
          className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
        />
        <p className="text-[11px] text-[#A8BDD4] mt-1">
          Remetente fixo: noreply@merendacheck.com.br · Deixe em branco para usar o padrão
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSalvar}
          disabled={salvando}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50"
        >
          {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          Salvar configurações
        </button>
      </div>
    </div>
  )
}

function CheckboxRow({
  label,
  descricao,
  checked,
  onChange,
}: {
  label: string
  descricao?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#F5F9FD] transition-colors">
      <div>
        <p className="text-sm text-[#0F1B2D]">{label}</p>
        {descricao && <p className="text-xs text-[#5A7089]">{descricao}</p>}
      </div>
      <div
        onClick={onChange}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-[#0E2E60]' : 'bg-[#D5E3F0]'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </div>
    </label>
  )
}
