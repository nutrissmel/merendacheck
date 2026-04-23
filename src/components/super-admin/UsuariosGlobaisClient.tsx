'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Search, ShieldCheck, Loader2, X, Eye, EyeOff,
  MoreVertical, Pencil, KeyRound, Trash2, Download,
  Power, UserCheck, UserX, User,
} from 'lucide-react'
import { criarSuperAdminAction, toggleUsuarioGlobalAction } from '@/actions/super-admin.actions'
import { ModalEditarUsuarioGlobal } from '@/components/super-admin/ModalEditarUsuarioGlobal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

type DropdownState = {
  usuario: Usuario
  top: number
  right: number
} | null

const PAPEL_STYLE: Record<string, string> = {
  SUPER_ADMIN:     'bg-amber-100 text-amber-700',
  ADMIN_MUNICIPAL: 'bg-blue-100 text-blue-700',
  NUTRICIONISTA:   'bg-green-100 text-green-700',
  DIRETOR_ESCOLA:  'bg-purple-100 text-purple-700',
  MERENDEIRA:      'bg-neutral-100 text-neutral-600',
}

const PAPEL_LABEL: Record<string, string> = {
  SUPER_ADMIN:     'Super Admin',
  ADMIN_MUNICIPAL: 'Admin Municipal',
  NUTRICIONISTA:   'Nutricionista',
  DIRETOR_ESCOLA:  'Diretor',
  MERENDEIRA:      'Merendeira',
}

export function UsuariosGlobaisClient({ usuarios }: { usuarios: Usuario[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState('TODOS')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState<string | null>(null)
  const [dropdown, setDropdown] = useState<DropdownState>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const filtrados = usuarios.filter((u) => {
    const matchBusca =
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase()) ||
      u.tenant.nome.toLowerCase().includes(busca.toLowerCase())
    const matchPapel = filtroPapel === 'TODOS' || u.papel === filtroPapel
    const matchStatus =
      filtroStatus === 'TODOS' ||
      (filtroStatus === 'ATIVO' && u.ativo) ||
      (filtroStatus === 'INATIVO' && !u.ativo)
    return matchBusca && matchPapel && matchStatus
  })

  const superAdmins = usuarios.filter((u) => u.papel === 'SUPER_ADMIN')
  const ativos = usuarios.filter((u) => u.ativo).length
  const inativos = usuarios.length - ativos

  function abrirDropdown(e: React.MouseEvent<HTMLButtonElement>, usuario: Usuario) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setDropdown({ usuario, top: rect.bottom + 4, right: window.innerWidth - rect.right })
  }

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

  function exportarCSV() {
    const headers = ['Nome', 'E-mail', 'Papel', 'Município', 'Estado', 'Status', 'Cadastrado']
    const rows = filtrados.map((u) => [
      u.nome,
      u.email,
      PAPEL_LABEL[u.papel] ?? u.papel,
      u.tenant.nome,
      u.tenant.estado,
      u.ativo ? 'Ativo' : 'Inativo',
      format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: ptBR }),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `usuarios_${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
        <div className="flex items-center gap-2">
          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#D5E3F0] text-sm font-medium text-[#5A7089] hover:bg-[#F5F9FD] transition-colors"
          >
            <Download size={15} />
            Exportar CSV
          </button>
          <button
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
          >
            <ShieldCheck size={16} />
            Novo Super Admin
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: usuarios.length, icon: User, color: 'text-[#0E2E60]', bg: 'bg-[#EEF4FD]' },
          { label: 'Ativos', value: ativos, icon: UserCheck, color: 'text-green-700', bg: 'bg-green-50' },
          { label: 'Inativos', value: inativos, icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Super Admins', value: superAdmins.length, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl px-4 py-3 flex items-center gap-3`}>
            <Icon size={18} className={color} />
            <div>
              <p className={`text-xl font-bold font-heading ${color}`}>{value}</p>
              <p className="text-xs text-[#5A7089]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Super Admins highlight */}
      {superAdmins.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-bold text-amber-700 mb-3 uppercase tracking-wide">Super Admins</p>
          <div className="flex flex-wrap gap-2">
            {superAdmins.map((u) => (
              <button
                key={u.id}
                onClick={() => setModalEditar(u)}
                className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2 hover:border-amber-400 transition-colors text-left"
              >
                <ShieldCheck size={14} className="text-amber-500" />
                <div>
                  <p className="text-xs font-semibold text-[#0F1B2D]">{u.nome}</p>
                  <p className="text-[10px] text-[#5A7089]">{u.email}</p>
                </div>
              </button>
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
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
        >
          <option value="TODOS">Todos os status</option>
          <option value="ATIVO">Ativos</option>
          <option value="INATIVO">Inativos</option>
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
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3 hidden lg:table-cell">Cadastrado</th>
              <th className="text-right text-xs font-semibold text-[#5A7089] px-5 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F9FD]">
            {filtrados.map((u) => (
              <tr
                key={u.id}
                className={`group transition-colors hover:bg-[#FAFCFF] ${!u.ativo ? 'opacity-60' : ''}`}
              >
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
                    {PAPEL_LABEL[u.papel] ?? u.papel}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex flex-col gap-1">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit ${u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                    {u.primeiroAcesso && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full w-fit bg-orange-100 text-orange-600">
                        1º acesso
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3.5 hidden lg:table-cell">
                  <p className="text-xs text-[#5A7089]">
                    {format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {u.papel !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleToggle(u)}
                        disabled={carregando === u.id}
                        title={u.ativo ? 'Desativar' : 'Ativar'}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors opacity-0 group-hover:opacity-100 ${
                          u.ativo
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {carregando === u.id ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Power size={11} />
                        )}
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    )}
                    <button
                      onClick={(e) => abrirDropdown(e, u)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] hover:text-[#0E2E60] transition-colors"
                    >
                      <MoreVertical size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-[#5A7089]">
                  Nenhum usuário encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-5 py-3 border-t border-[#EEF4FD] text-xs text-[#5A7089]">
          {filtrados.length} de {usuarios.length} usuário{usuarios.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Modais */}
      {modalNovoAberto && <ModalNovoSuperAdmin onClose={() => setModalNovoAberto(false)} />}
      {modalEditar && (
        <ModalEditarUsuarioGlobal usuario={modalEditar} onClose={() => setModalEditar(null)} />
      )}

      {/* Dropdown portal */}
      {mounted && dropdown && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdown(null)} />
          <div
            className="fixed z-50 bg-white rounded-xl border border-[#D5E3F0] shadow-2xl py-1.5 w-52 overflow-hidden"
            style={{ top: dropdown.top, right: dropdown.right }}
          >
            <button
              onClick={() => { setModalEditar(dropdown.usuario); setDropdown(null) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0F1B2D] hover:bg-[#F5F9FD] transition-colors text-left"
            >
              <Pencil size={14} className="text-[#5A7089]" />
              Editar dados
            </button>
            <button
              onClick={() => { setModalEditar(dropdown.usuario); setDropdown(null) }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#0F1B2D] hover:bg-[#F5F9FD] transition-colors text-left"
            >
              <KeyRound size={14} className="text-[#5A7089]" />
              Redefinir senha
            </button>
            {dropdown.usuario.papel !== 'SUPER_ADMIN' && (
              <>
                <div className="mx-4 my-1 border-t border-[#EEF4FD]" />
                <button
                  onClick={() => {
                    setModalEditar(dropdown.usuario)
                    setDropdown(null)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
                >
                  <Trash2 size={14} />
                  Excluir usuário
                </button>
              </>
            )}
          </div>
        </>,
        document.body,
      )}
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
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD]"
            >
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
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm text-[#5A7089] hover:bg-[#F5F9FD]"
            >
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
