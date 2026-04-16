'use client'

import { useState } from 'react'
import { Users, Plus, Search, Power, ShieldCheck, Loader2, X, Eye, EyeOff } from 'lucide-react'
import { criarSuperAdminAction, toggleUsuarioGlobalAction } from '@/actions/super-admin.actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Usuario = {
  id: string
  nome: string
  email: string
  papel: string
  ativo: boolean
  primeiroAcesso: boolean
  createdAt: Date
  tenant: { id: string; nome: string; estado: string }
}

const PAPEL_STYLE: Record<string, string> = {
  SUPER_ADMIN:     'bg-amber-100 text-amber-700',
  ADMIN_MUNICIPAL: 'bg-blue-100 text-blue-700',
  NUTRICIONISTA:   'bg-green-100 text-green-700',
  DIRETOR_ESCOLA:  'bg-purple-100 text-purple-700',
  MERENDEIRA:      'bg-neutral-100 text-neutral-600',
}

export function UsuariosGlobaisClient({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState('TODOS')
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState<string | null>(null)

  const filtrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      u.tenant.nome.toLowerCase().includes(busca.toLowerCase())
    const matchPapel = filtroPapel === 'TODOS' || u.papel === filtroPapel
    return matchBusca && matchPapel
  })

  const superAdmins = usuarios.filter((u) => u.papel === 'SUPER_ADMIN')

  async function handleToggle(u: Usuario) {
    if (u.papel === 'SUPER_ADMIN') {
      toast.error('Não é possível desativar um Super Admin')
      return
    }
    setCarregando(u.id)
    const res = await toggleUsuarioGlobalAction(u.id)
    setCarregando(null)
    if (res.sucesso) {
      toast.success(u.ativo ? 'Usuário desativado' : 'Usuário ativado')
      router.refresh()
    } else {
      toast.error(res.erro)
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">Usuários</h1>
          <p className="text-sm text-[#5A7089]">
            {usuarios.length} usuários · {superAdmins.length} Super Admins
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
        >
          <ShieldCheck size={16} />
          Novo Super Admin
        </button>
      </div>

      {/* Super Admins destacados */}
      {superAdmins.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wide">Super Admins</p>
          <div className="flex flex-wrap gap-2">
            {superAdmins.map((u) => (
              <div key={u.id} className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
                <ShieldCheck size={14} className="text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-[#0F1B2D]">{u.nome}</p>
                  <p className="text-[10px] text-[#5A7089]">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A7089]" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou município..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
          />
        </div>
        <select
          value={filtroPapel}
          onChange={(e) => setFiltroPapel(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
        >
          <option value="TODOS">Todos os papéis</option>
          <option value="SUPER_ADMIN">Super Admin</option>
          <option value="ADMIN_MUNICIPAL">Admin Municipal</option>
          <option value="NUTRICIONISTA">Nutricionista</option>
          <option value="DIRETOR_ESCOLA">Diretor</option>
          <option value="MERENDEIRA">Merendeira</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
              <th className="text-left text-xs font-semibold text-[#5A7089] px-5 py-3">Usuário</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Município</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Papel</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F9FD]">
            {filtrados.map((u) => (
              <tr key={u.id} className={!u.ativo ? 'opacity-50' : ''}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold text-[#0F1B2D]">{u.nome}</p>
                  <p className="text-xs text-[#5A7089]">{u.email}</p>
                </td>
                <td className="px-3 py-3.5">
                  <p className="text-sm text-[#0F1B2D]">{u.tenant.nome}</p>
                  <p className="text-xs text-[#5A7089]">{u.tenant.estado}</p>
                </td>
                <td className="px-3 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${PAPEL_STYLE[u.papel] ?? 'bg-neutral-100 text-neutral-600'}`}>
                    {u.papel.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  {u.papel !== 'SUPER_ADMIN' && (
                    <button
                      onClick={() => handleToggle(u)}
                      disabled={carregando === u.id}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        u.ativo
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {carregando === u.id ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />}
                      {u.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#5A7089]">
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAberto && <ModalNovoSuperAdmin onClose={() => setModalAberto(false)} />}
    </div>
  )
}

function ModalNovoSuperAdmin({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', senha: '' })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  async function handleSalvar() {
    if (!form.nome || !form.email || !form.senha) {
      toast.error('Preencha todos os campos')
      return
    }
    if (form.senha.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres')
      return
    }
    setCarregando(true)
    const res = await criarSuperAdminAction(form)
    setCarregando(false)
    if (res.sucesso) {
      toast.success('Super Admin criado!')
      router.refresh()
      onClose()
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao criar')
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF4FD]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-amber-500" />
              <h2 className="font-bold text-[#0F1B2D] font-heading">Novo Super Admin</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD]">
              <X size={16} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              ⚠️ Super Admins têm acesso irrestrito ao sistema inteiro. Crie com cautela.
            </div>

            {[
              { label: 'Nome completo', key: 'nome' as const, type: 'text', placeholder: 'ex: João Silva' },
              { label: 'E-mail', key: 'email' as const, type: 'email', placeholder: 'joao@merendacheck.com.br' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-[#5A7089] mb-1">{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={set(key)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60]"
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-[#5A7089] mb-1">Senha inicial</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={form.senha}
                  onChange={set('senha')}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60]"
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
          </div>

          <div className="px-6 pb-5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm text-[#5A7089] hover:bg-[#F5F9FD]">
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={carregando}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {carregando && <Loader2 size={14} className="animate-spin" />}
              Criar Super Admin
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
