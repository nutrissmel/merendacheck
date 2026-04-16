'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Search, Power, ChevronDown, Loader2, X, ShieldCheck, CheckCircle } from 'lucide-react'
import { toggleMunicipioAction, alterarPlanoMunicipioAction, criarMunicipioAction } from '@/actions/super-admin.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Municipio = {
  id: string
  nome: string
  estado: string
  codigoIbge: string
  plano: string
  planoStatus: string
  ativo: boolean
  createdAt: Date
  _count: { usuarios: number; escolas: number }
}

type DropdownInfo = { id: string; tipo: 'plano' | 'status'; rect: DOMRect } | null
type Confirmacao = { id: string; nomeMunicipio: string; plano: string; status: string; label: string } | null

const PLANOS = ['STARTER', 'MUNICIPAL', 'ESTADUAL', 'ENTERPRISE']
const STATUS_OPTS = ['TRIAL', 'ATIVO', 'INATIVO', 'CANCELADO']

const STATUS_STYLE: Record<string, string> = {
  TRIAL:     'bg-amber-100 text-amber-700',
  ATIVO:     'bg-green-100 text-green-700',
  INATIVO:   'bg-red-100 text-red-700',
  CANCELADO: 'bg-neutral-100 text-neutral-500',
}

export function MunicipiosClient({ municipios }: { municipios: Municipio[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState<string | null>(null)
  const [dropdown, setDropdown] = useState<DropdownInfo>(null)
  const [confirmacao, setConfirmacao] = useState<Confirmacao>(null)

  const filtrados = municipios.filter(
    (m) =>
      m.nome.toLowerCase().includes(busca.toLowerCase()) ||
      m.estado.toLowerCase().includes(busca.toLowerCase()),
  )

  function abrirDropdown(e: React.MouseEvent<HTMLButtonElement>, id: string, tipo: 'plano' | 'status') {
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdown(prev => (prev?.id === id && prev?.tipo === tipo) ? null : { id, tipo, rect })
  }

  function selecionarOpcao(m: Municipio, tipo: 'plano' | 'status', valor: string) {
    setDropdown(null)
    const label = tipo === 'plano'
      ? `Alterar plano para ${valor}`
      : `Alterar status para ${valor}`
    const novoPlano = tipo === 'plano' ? valor : m.plano
    const novoStatus = tipo === 'status' ? valor : m.planoStatus
    setConfirmacao({ id: m.id, nomeMunicipio: m.nome, plano: novoPlano, status: novoStatus, label })
  }

  async function handleToggle(m: Municipio) {
    setCarregando(m.id + '-toggle')
    const res = await toggleMunicipioAction(m.id)
    setCarregando(null)
    if (res.sucesso) {
      toast.success(m.ativo ? 'Município desativado' : 'Município ativado')
      router.refresh()
    } else {
      toast.error(res.erro)
    }
  }

  async function confirmarAlteracao() {
    if (!confirmacao) return
    const { id, plano, status, label, nomeMunicipio } = confirmacao
    setConfirmacao(null)
    setCarregando(id + '-plano')
    const res = await alterarPlanoMunicipioAction(id, plano, status)
    setCarregando(null)
    if (res.sucesso) {
      toast.success(`${label} para ${nomeMunicipio}!`)
      router.refresh()
    } else {
      toast.error(res.erro)
    }
  }

  const municipioAtual = dropdown ? municipios.find(m => m.id === dropdown.id) : null

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">Municípios</h1>
          <p className="text-sm text-[#5A7089]">{municipios.length} municípios cadastrados</p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-[#0E2E60] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#133878] transition-colors"
        >
          <Plus size={16} />
          Novo município
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A7089]" />
        <input
          type="text"
          placeholder="Buscar por nome ou estado..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
              <th className="text-left text-xs font-semibold text-[#5A7089] px-5 py-3">Município</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Usuários</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Escolas</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Plano</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F9FD]">
            {filtrados.map((m) => (
              <tr key={m.id} className={!m.ativo ? 'opacity-50' : ''}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-[#0F1B2D]">{m.nome}</p>
                  <p className="text-xs text-[#5A7089]">{m.estado} · IBGE {m.codigoIbge}</p>
                </td>
                <td className="px-3 py-3.5 text-sm text-[#0F1B2D]">{m._count.usuarios}</td>
                <td className="px-3 py-3.5 text-sm text-[#0F1B2D]">{m._count.escolas}</td>

                {/* Plano */}
                <td className="px-3 py-3.5">
                  <button
                    onClick={(e) => abrirDropdown(e, m.id, 'plano')}
                    disabled={!!carregando}
                    className="flex items-center gap-1 text-xs font-medium text-[#0E2E60] bg-[#EEF4FD] px-2.5 py-1 rounded-lg hover:bg-[#D5E3F0] transition-colors border border-[#D5E3F0]"
                  >
                    {m.plano}
                    <ChevronDown size={11} />
                  </button>
                </td>

                {/* Status */}
                <td className="px-3 py-3.5">
                  <button
                    onClick={(e) => abrirDropdown(e, m.id, 'status')}
                    disabled={!!carregando}
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${STATUS_STYLE[m.planoStatus] ?? 'bg-neutral-100 text-neutral-600'}`}
                  >
                    {m.planoStatus}
                    <ChevronDown size={9} />
                  </button>
                </td>

                {/* Toggle ativo */}
                <td className="px-3 py-3.5">
                  <button
                    onClick={() => handleToggle(m)}
                    disabled={carregando === m.id + '-toggle'}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      m.ativo
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {carregando === m.id + '-toggle'
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Power size={12} />}
                    {m.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#5A7089]">
                  Nenhum município encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dropdown portal */}
      {dropdown && municipioAtual && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdown(null)} />
          <div
            className="fixed z-50 w-44 bg-white border border-[#D5E3F0] rounded-xl shadow-xl py-1"
            style={{
              top: dropdown.rect.bottom + 6,
              left: Math.min(dropdown.rect.left, window.innerWidth - 184),
            }}
          >
            <p className="px-3 py-1.5 text-[10px] font-bold text-[#5A7089] uppercase tracking-wide border-b border-[#EEF4FD] mb-1">
              {dropdown.tipo === 'plano' ? 'Selecionar plano' : 'Selecionar status'}
            </p>
            {dropdown.tipo === 'plano'
              ? PLANOS.map((p) => (
                <button
                  key={p}
                  onClick={() => selecionarOpcao(municipioAtual, 'plano', p)}
                  className={`flex w-full text-left text-xs px-3 py-2.5 hover:bg-[#F5F9FD] transition-colors font-medium ${municipioAtual.plano === p ? 'text-[#0E2E60]' : 'text-[#0F1B2D]'}`}
                >
                  {municipioAtual.plano === p && <span className="mr-1.5">✓</span>}{p}
                </button>
              ))
              : STATUS_OPTS.map((s) => (
                <button
                  key={s}
                  onClick={() => selecionarOpcao(municipioAtual, 'status', s)}
                  className={`flex w-full text-left text-xs px-3 py-2.5 hover:bg-[#F5F9FD] transition-colors font-medium ${municipioAtual.planoStatus === s ? 'text-[#0E2E60]' : 'text-[#0F1B2D]'}`}
                >
                  {municipioAtual.planoStatus === s && <span className="mr-1.5">✓</span>}{s}
                </button>
              ))
            }
          </div>
        </>,
        document.body,
      )}

      {modalAberto && <ModalNovoMunicipio onClose={() => setModalAberto(false)} />}

      {/* Modal de confirmação */}
      {confirmacao && createPortal(
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setConfirmacao(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto">
              <div className="px-6 py-5 border-b border-[#EEF4FD]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[#0F1B2D] font-heading">Confirmar alteração</h2>
                    <p className="text-xs text-[#5A7089]">Revise antes de confirmar</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-sm text-[#0F1B2D]">
                  Você está prestes a <strong>{confirmacao.label.toLowerCase()}</strong> para o município:
                </p>
                <div className="bg-[#F5F9FD] rounded-xl px-4 py-3 border border-[#EEF4FD]">
                  <p className="font-semibold text-[#0F1B2D] text-sm">{confirmacao.nomeMunicipio}</p>
                  <p className="text-xs text-[#5A7089] mt-0.5">
                    Plano: <strong>{confirmacao.plano}</strong> · Status: <strong>{confirmacao.status}</strong>
                  </p>
                </div>
                <p className="text-xs text-[#5A7089] bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  Confirme que deseja salvar esta alteração no sistema.
                </p>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={() => setConfirmacao(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm text-[#5A7089] hover:bg-[#F5F9FD] transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAlteracao}
                  className="flex-1 py-2.5 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={14} />
                  Confirmar
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

function ModalNovoMunicipio({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [form, setForm] = useState({ nome: '', estado: '', codigoIbge: '', nomeSecretaria: '', emailInstitucional: '' })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSalvar() {
    if (!form.nome || !form.estado || !form.codigoIbge) {
      toast.error('Preencha nome, estado e código IBGE')
      return
    }
    setCarregando(true)
    const res = await criarMunicipioAction(form)
    setCarregando(false)
    if (res.sucesso) {
      toast.success('Município criado!')
      router.refresh()
      onClose()
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao criar')
    }
  }

  const campos = [
    { label: 'Nome do município *', key: 'nome' as const, placeholder: 'ex: Luziânia' },
    { label: 'Estado (UF) *', key: 'estado' as const, placeholder: 'ex: GO' },
    { label: 'Código IBGE *', key: 'codigoIbge' as const, placeholder: 'ex: 5212501' },
    { label: 'Nome da secretaria', key: 'nomeSecretaria' as const, placeholder: 'ex: SMED' },
    { label: 'E-mail institucional', key: 'emailInstitucional' as const, placeholder: 'contato@prefeitura.gov.br' },
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF4FD]">
            <h2 className="font-bold text-[#0F1B2D] font-heading">Novo município</h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD]">
              <X size={16} />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            {campos.map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-[#5A7089] mb-1">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60]"
                />
              </div>
            ))}
          </div>
          <div className="px-6 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm text-[#5A7089] hover:bg-[#F5F9FD]">
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={carregando}
              className="flex-1 py-2.5 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {carregando && <Loader2 size={14} className="animate-spin" />}
              Criar município
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
