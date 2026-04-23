'use client'

import { useState } from 'react'
import {
  X, User, Shield, Trash2, Eye, EyeOff, Loader2,
  AlertTriangle, Link2, Copy, Check,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  atualizarUsuarioSuperAdminAction,
  resetarSenhaUsuarioAction,
  deletarUsuarioSuperAdminAction,
  enviarResetSenhaLinkAction,
} from '@/actions/super-admin.actions'

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

type Tab = 'dados' | 'seguranca' | 'perigo'

const PAPEIS = [
  { value: 'ADMIN_MUNICIPAL', label: 'Admin Municipal' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'DIRETOR_ESCOLA', label: 'Diretor de Escola' },
  { value: 'MERENDEIRA', label: 'Merendeira' },
]

interface Props {
  usuario: Usuario
  onClose: () => void
}

export function ModalEditarUsuarioGlobal({ usuario, onClose }: Props) {
  const router = useRouter()
  const ehSuperAdmin = usuario.papel === 'SUPER_ADMIN'
  const [tab, setTab] = useState<Tab>('dados')

  const [form, setForm] = useState({
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    ativo: usuario.ativo,
  })
  const [salvando, setSalvando] = useState(false)

  const [novaSenha, setNovaSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [resetandoSenha, setResetandoSenha] = useState(false)
  const [enviandoLink, setEnviandoLink] = useState(false)
  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [linkCopiado, setLinkCopiado] = useState(false)

  const [confirmacaoNome, setConfirmacaoNome] = useState('')
  const [deletando, setDeletando] = useState(false)

  async function handleSalvarDados() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios')
      return
    }
    setSalvando(true)
    const res = await atualizarUsuarioSuperAdminAction(usuario.id, form)
    setSalvando(false)
    if (res.sucesso) {
      toast.success('Usuário atualizado!')
      router.refresh()
      onClose()
    } else {
      toast.error(res.erro ?? 'Erro ao atualizar')
    }
  }

  async function handleResetarSenha() {
    if (novaSenha.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres')
      return
    }
    setResetandoSenha(true)
    const res = await resetarSenhaUsuarioAction(usuario.id, novaSenha)
    setResetandoSenha(false)
    if (res.sucesso) {
      toast.success('Senha alterada com sucesso!')
      setNovaSenha('')
    } else {
      toast.error(res.erro ?? 'Erro ao alterar senha')
    }
  }

  async function handleGerarLink() {
    setEnviandoLink(true)
    const res = await enviarResetSenhaLinkAction(usuario.id)
    setEnviandoLink(false)
    if (res.sucesso === false) {
      toast.error(res.erro ?? 'Erro ao gerar link')
      return
    }
    setLinkGerado(res.link)
  }

  function handleCopiarLink() {
    if (!linkGerado) return
    navigator.clipboard.writeText(linkGerado)
    setLinkCopiado(true)
    toast.success('Link copiado!')
    setTimeout(() => setLinkCopiado(false), 2000)
  }

  async function handleDeletar() {
    if (confirmacaoNome !== usuario.nome) return
    setDeletando(true)
    const res = await deletarUsuarioSuperAdminAction(usuario.id)
    setDeletando(false)
    if (res.sucesso) {
      toast.success('Usuário excluído permanentemente')
      router.refresh()
      onClose()
    } else {
      toast.error(res.erro ?? 'Erro ao excluir')
    }
  }

  const tabs: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: 'dados', label: 'Dados', Icon: User },
    { id: 'seguranca', label: 'Segurança', Icon: Shield },
    ...(!ehSuperAdmin ? [{ id: 'perigo' as Tab, label: 'Perigo', Icon: Trash2 }] : []),
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#EEF4FD]">
            <div>
              <h2 className="font-bold text-[#0F1B2D] font-heading">{usuario.nome}</h2>
              <p className="text-xs text-[#5A7089]">
                {usuario.email} · {usuario.tenant.nome}/{usuario.tenant.estado}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#EEF4FD]">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === id
                    ? id === 'perigo'
                      ? 'border-red-500 text-red-600'
                      : 'border-[#0E2E60] text-[#0E2E60]'
                    : 'border-transparent text-[#5A7089] hover:text-[#0F1B2D]'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Dados */}
          {tab === 'dados' && (
            <>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5A7089] mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5A7089] mb-1">E-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60]"
                  />
                </div>
                {!ehSuperAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-[#5A7089] mb-1">Papel</label>
                    <select
                      value={form.papel}
                      onChange={(e) => setForm((f) => ({ ...f, papel: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60] bg-white"
                    >
                      {PAPEIS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={ehSuperAdmin}
                    onClick={() => !ehSuperAdmin && setForm((f) => ({ ...f, ativo: !f.ativo }))}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      form.ativo ? 'bg-green-500' : 'bg-[#D5E3F0]'
                    } ${ehSuperAdmin ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                        form.ativo ? 'translate-x-[18px]' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-[#0F1B2D]">
                    Conta <strong>{form.ativo ? 'ativa' : 'desativada'}</strong>
                  </span>
                </div>
                <div className="bg-[#F5F9FD] rounded-xl px-4 py-3 text-xs text-[#5A7089]">
                  <span className="font-semibold text-[#0F1B2D]">Município:</span>{' '}
                  {usuario.tenant.nome} — {usuario.tenant.estado}
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-[#D5E3F0] text-sm text-[#5A7089] hover:bg-[#F5F9FD] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSalvarDados}
                  disabled={salvando}
                  className="flex-1 py-2.5 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
                  {salvando && <Loader2 size={14} className="animate-spin" />}
                  Salvar alterações
                </button>
              </div>
            </>
          )}

          {/* Tab: Segurança */}
          {tab === 'seguranca' && (
            <div className="px-6 py-5 space-y-4">
              {/* Definir nova senha */}
              <div className="border border-[#EEF4FD] rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0F1B2D] mb-0.5">Definir nova senha</p>
                <p className="text-xs text-[#5A7089] mb-3">
                  Altera imediatamente, sem confirmação por e-mail.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      placeholder="Nova senha (mín. 8 caracteres)"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleResetarSenha()}
                      className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[#D5E3F0] text-sm focus:outline-none focus:border-[#0E2E60]"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A7089]"
                    >
                      {mostrarSenha ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <button
                    onClick={handleResetarSenha}
                    disabled={resetandoSenha || novaSenha.length < 8}
                    className="px-4 py-2.5 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] disabled:opacity-50 flex items-center gap-2 whitespace-nowrap transition-colors"
                  >
                    {resetandoSenha && <Loader2 size={13} className="animate-spin" />}
                    Salvar
                  </button>
                </div>
                {novaSenha.length > 0 && novaSenha.length < 8 && (
                  <p className="text-xs text-red-500 mt-1.5">
                    Ainda faltam {8 - novaSenha.length} caractere{8 - novaSenha.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Gerar link de redefinição */}
              <div className="border border-[#EEF4FD] rounded-xl p-4">
                <p className="text-sm font-semibold text-[#0F1B2D] mb-0.5">Link de redefinição</p>
                <p className="text-xs text-[#5A7089] mb-3">
                  Gera um link único para o usuário criar sua própria senha.
                </p>
                {linkGerado ? (
                  <div className="space-y-2">
                    <div className="bg-[#EEF4FD] rounded-lg p-3 text-[11px] font-mono text-[#0E2E60] break-all select-all">
                      {linkGerado}
                    </div>
                    <button
                      onClick={handleCopiarLink}
                      className="flex items-center gap-1.5 text-xs font-semibold text-[#0E2E60] hover:underline"
                    >
                      {linkCopiado ? (
                        <><Check size={12} className="text-green-500" /> Copiado!</>
                      ) : (
                        <><Copy size={12} /> Copiar link</>
                      )}
                    </button>
                    <button
                      onClick={() => setLinkGerado(null)}
                      className="text-xs text-[#5A7089] hover:underline"
                    >
                      Gerar novo link
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGerarLink}
                    disabled={enviandoLink}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D5E3F0] text-sm font-medium text-[#0F1B2D] hover:bg-[#F5F9FD] disabled:opacity-50 transition-colors"
                  >
                    {enviandoLink ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Link2 size={13} />
                    )}
                    Gerar link de redefinição
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tab: Perigo */}
          {tab === 'perigo' && !ehSuperAdmin && (
            <div className="px-6 py-5 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-700">Ação irreversível</p>
                    <p className="text-xs text-red-600 mt-1 leading-relaxed">
                      Excluir este usuário remove permanentemente seu acesso e todos os seus dados
                      do sistema. Inspeções e histórico associados a este usuário também podem ser
                      afetados. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A7089] mb-2">
                  Digite{' '}
                  <span className="text-[#0F1B2D] font-bold">{usuario.nome}</span>{' '}
                  para confirmar
                </label>
                <input
                  type="text"
                  placeholder={usuario.nome}
                  value={confirmacaoNome}
                  onChange={(e) => setConfirmacaoNome(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-red-300 text-sm focus:outline-none focus:border-red-500 bg-red-50/30"
                />
              </div>

              <button
                onClick={handleDeletar}
                disabled={confirmacaoNome !== usuario.nome || deletando}
                className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
              >
                {deletando ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                Excluir usuário permanentemente
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
