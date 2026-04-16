'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { CreditCard, Clock, AlertCircle, CheckCircle, Loader2, ChevronDown, ShieldCheck } from 'lucide-react'
import { estenderTrialAction, ativarPlanoAction } from '@/actions/super-admin.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Props = {
  porPlano: { plano: string; _count: number }[]
  porStatus: { planoStatus: string; _count: number }[]
  trials: { id: string; nome: string; estado: string; trialExpiresAt: Date | null; plano: string; _count: { usuarios: number } }[]
  inadimplentes: { id: string; nome: string; estado: string; plano: string; _count: { usuarios: number } }[]
}

type DropdownAberto = { tenantId: string; rect: DOMRect } | null
type Confirmacao = { tenantId: string; nomeMunicipio: string; plano: string } | null

const PLANOS = ['STARTER', 'CRESCIMENTO', 'MUNICIPAL', 'ENTERPRISE']

const PLANO_COR: Record<string, string> = {
  STARTER:     'bg-neutral-100 text-neutral-600',
  CRESCIMENTO: 'bg-blue-100 text-blue-700',
  MUNICIPAL:   'bg-violet-100 text-violet-700',
  ENTERPRISE:  'bg-amber-100 text-amber-700',
}

const PLANO_DESC: Record<string, string> = {
  STARTER:     'Plano básico com funcionalidades essenciais',
  CRESCIMENTO: 'Plano intermediário para municípios em expansão',
  MUNICIPAL:   'Plano completo para gestão municipal',
  ENTERPRISE:  'Plano ilimitado com suporte dedicado',
}

function diasRestantes(data: Date | null) {
  if (!data) return null
  return Math.ceil((new Date(data).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function fmtData(d: Date | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export function BillingClient({ porPlano, porStatus, trials, inadimplentes }: Props) {
  const router = useRouter()
  const [carregando, setCarregando] = useState<string | null>(null)
  const [dropdown, setDropdown] = useState<DropdownAberto>(null)
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null)

  // Encontra o nome do município pelo id (entre trials e inadimplentes)
  function getNome(tenantId: string) {
    return (
      trials.find(t => t.id === tenantId)?.nome ??
      inadimplentes.find(t => t.id === tenantId)?.nome ??
      tenantId
    )
  }

  function abrirDropdown(e: React.MouseEvent<HTMLButtonElement>, tenantId: string) {
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdown(prev => prev?.tenantId === tenantId ? null : { tenantId, rect })
  }

  function selecionarPlano(tenantId: string, plano: string) {
    setDropdown(null)
    setConfirmacao({ tenantId, nomeMunicipio: getNome(tenantId), plano })
  }

  async function handleEstenderTrial(tenantId: string, dias: number) {
    setCarregando(tenantId + '-trial')
    const res = await estenderTrialAction(tenantId, dias)
    setCarregando(null)
    if (res.sucesso) { toast.success(`Trial estendido por ${dias} dias`); router.refresh() }
    else toast.error(res.erro)
  }

  async function confirmarAtivacao() {
    if (!confirmacao) return
    setConfirmacao(null)
    setCarregando(confirmacao.tenantId + '-plano')
    const res = await ativarPlanoAction(confirmacao.tenantId, confirmacao.plano)
    setCarregando(null)
    if (res.sucesso) { toast.success(`Plano ${confirmacao.plano} ativado para ${confirmacao.nomeMunicipio}!`); router.refresh() }
    else toast.error(res.erro)
  }

  const totalMunicipios = porStatus.reduce((a, b) => a + b._count, 0)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard size={20} className="text-[#0E2E60]" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">Planos & Billing</h1>
          <p className="text-sm text-[#5A7089]">Gestão de assinaturas e planos dos municípios</p>
        </div>
      </div>

      {/* Resumo por status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {porStatus.map(({ planoStatus, _count }) => {
          const icons: Record<string, any> = {
            TRIAL: Clock, ATIVO: CheckCircle, INADIMPLENTE: AlertCircle, CANCELADO: AlertCircle,
          }
          const cores: Record<string, string> = {
            TRIAL:       'text-amber-500 bg-amber-50',
            ATIVO:       'text-green-600 bg-green-50',
            INADIMPLENTE:'text-red-600 bg-red-50',
            CANCELADO:   'text-neutral-500 bg-neutral-50',
          }
          const Icon = icons[planoStatus] ?? CreditCard
          const [cor, bg] = (cores[planoStatus] ?? 'text-neutral-500 bg-neutral-50').split(' ')
          return (
            <div key={planoStatus} className="bg-white rounded-2xl p-5 border border-[#EEF4FD] shadow-sm">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon size={18} className={cor} />
              </div>
              <p className="text-2xl font-bold font-heading text-[#0F1B2D]">{_count}</p>
              <p className="text-xs text-[#5A7089]">{planoStatus}</p>
              <p className="text-[10px] text-[#5A7089]/60">{((_count / totalMunicipios) * 100).toFixed(0)}% do total</p>
            </div>
          )
        })}
      </div>

      {/* Distribuição por plano */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm p-5">
        <h2 className="font-heading font-bold text-[#0F1B2D] mb-4">Distribuição por plano</h2>
        <div className="flex flex-wrap gap-3">
          {porPlano.map(({ plano, _count }) => (
            <div key={plano} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EEF4FD] ${PLANO_COR[plano] ?? 'bg-neutral-100 text-neutral-600'}`}>
              <span className="text-sm font-bold">{_count}</span>
              <span className="text-sm font-medium">{plano}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Municípios em Trial */}
      {trials.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#EEF4FD] bg-amber-50">
            <h2 className="font-heading font-bold text-amber-800 flex items-center gap-2">
              <Clock size={16} /> Municípios em Trial ({trials.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
                {['Município', 'Plano atual', 'Expira em', 'Dias restantes', 'Ações'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-[#5A7089] px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F9FD]">
              {trials.map((t) => {
                const dias = diasRestantes(t.trialExpiresAt)
                const vencido = dias !== null && dias < 0
                const urgente = dias !== null && dias <= 5 && !vencido
                return (
                  <tr key={t.id} className={vencido ? 'bg-red-50/30' : ''}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-[#0F1B2D]">{t.nome}</p>
                      <p className="text-xs text-[#5A7089]">{t.estado} · {t._count.usuarios} usuários</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PLANO_COR[t.plano] ?? ''}`}>
                        {t.plano}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-[#5A7089]">{fmtData(t.trialExpiresAt)}</td>
                    <td className="px-5 py-3.5">
                      {dias !== null ? (
                        <span className={`text-sm font-bold ${vencido ? 'text-red-600' : urgente ? 'text-amber-600' : 'text-green-600'}`}>
                          {vencido ? `Vencido há ${Math.abs(dias)}d` : `${dias} dias`}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        {[15, 30].map((d) => (
                          <button
                            key={d}
                            onClick={() => handleEstenderTrial(t.id, d)}
                            disabled={!!carregando}
                            className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium transition-colors disabled:opacity-50 border border-amber-200"
                          >
                            {carregando === t.id + '-trial'
                              ? <Loader2 size={12} className="animate-spin" />
                              : `+${d}d`}
                          </button>
                        ))}
                        <button
                          onClick={(e) => abrirDropdown(e, t.id)}
                          disabled={!!carregando}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors flex items-center gap-1.5 border border-green-200 disabled:opacity-50"
                        >
                          {carregando === t.id + '-plano'
                            ? <Loader2 size={12} className="animate-spin" />
                            : <>Ativar <ChevronDown size={11} /></>}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Inadimplentes */}
      {inadimplentes.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-red-100 bg-red-50">
            <h2 className="font-heading font-bold text-red-800 flex items-center gap-2">
              <AlertCircle size={16} /> Inadimplentes ({inadimplentes.length})
            </h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
                {['Município', 'Plano', 'Usuários', 'Ação'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-[#5A7089] px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F9FD]">
              {inadimplentes.map((t) => (
                <tr key={t.id}>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-semibold text-[#0F1B2D]">{t.nome}</p>
                    <p className="text-xs text-[#5A7089]">{t.estado}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PLANO_COR[t.plano] ?? ''}`}>
                      {t.plano}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-[#5A7089]">{t._count.usuarios}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => abrirDropdown(e, t.id)}
                      disabled={!!carregando}
                      className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 font-medium transition-colors flex items-center gap-1.5 border border-green-200 disabled:opacity-50"
                    >
                      {carregando === t.id + '-plano'
                        ? <Loader2 size={12} className="animate-spin" />
                        : <>Regularizar <ChevronDown size={11} /></>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {trials.length === 0 && inadimplentes.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-green-800">Tudo em ordem!</p>
          <p className="text-sm text-green-600">Nenhum município em trial vencido ou inadimplente.</p>
        </div>
      )}

      {/* Dropdown portal */}
      {dropdown && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdown(null)} />
          <div
            className="fixed z-50 w-48 bg-white border border-[#D5E3F0] rounded-xl shadow-xl py-1"
            style={{
              top: dropdown.rect.bottom + 6,
              left: Math.min(dropdown.rect.left, window.innerWidth - 200),
            }}
          >
            <p className="px-3 py-1.5 text-[10px] font-bold text-[#5A7089] uppercase tracking-wide border-b border-[#EEF4FD] mb-1">
              Selecionar plano
            </p>
            {PLANOS.map((p) => (
              <button
                key={p}
                onClick={() => selecionarPlano(dropdown.tenantId, p)}
                className="flex items-center gap-2 w-full text-left text-xs px-3 py-2.5 hover:bg-[#F5F9FD] transition-colors text-[#0F1B2D] font-medium"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  p === 'STARTER' ? 'bg-neutral-400' :
                  p === 'CRESCIMENTO' ? 'bg-blue-500' :
                  p === 'MUNICIPAL' ? 'bg-violet-500' : 'bg-amber-500'
                }`} />
                {p}
              </button>
            ))}
          </div>
        </>,
        document.body,
      )}

      {/* Modal de confirmação */}
      {confirmacao && createPortal(
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setConfirmacao(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#EEF4FD]">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-green-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#0F1B2D] font-heading">Confirmar ativação</h2>
                    <p className="text-xs text-[#5A7089]">Esta ação não pode ser desfeita automaticamente</p>
                  </div>
                </div>
              </div>

              {/* Corpo */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-[#0F1B2D]">
                  Você está prestes a ativar o plano{' '}
                  <span className={`font-bold px-1.5 py-0.5 rounded-md text-xs ${PLANO_COR[confirmacao.plano] ?? ''}`}>
                    {confirmacao.plano}
                  </span>{' '}
                  para o município:
                </p>
                <div className="bg-[#F5F9FD] rounded-xl px-4 py-3 border border-[#EEF4FD]">
                  <p className="font-semibold text-[#0F1B2D] text-sm">{confirmacao.nomeMunicipio}</p>
                </div>
                <p className="text-xs text-[#5A7089] bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  O trial será encerrado e o plano passará para status <strong>ATIVO</strong>. Confirme antes de prosseguir.
                </p>
                <p className="text-xs text-[#5A7089]">{PLANO_DESC[confirmacao.plano]}</p>
              </div>

              {/* Ações */}
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => setConfirmacao(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm text-[#5A7089] hover:bg-[#F5F9FD] transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAtivacao}
                  className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} />
                  Sim, ativar plano
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
