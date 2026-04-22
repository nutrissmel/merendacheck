'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { UserPlus, MoreHorizontal, Search, X, RefreshCw, Mail, KeyRound, Pencil, School, UserX, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar } from '@/components/shared/Avatar'
import { PapelBadge } from '@/components/shared/PapelBadge'
import { EscolaChips } from '@/components/shared/EscolaChips'
import { TempoRelativo } from '@/components/shared/TempoRelativo'
import { ModalConvidarUsuario } from '@/components/usuarios/ModalConvidarUsuario'
import { ModalEditarUsuario } from '@/components/usuarios/ModalEditarUsuario'
import { BotaoExportarCSV } from '@/components/usuarios/BotaoExportarCSV'
import {
  listarConvitesAction,
  reenviarConviteAction,
  revogarConviteAction,
} from '@/actions/convite.actions'
import {
  listarUsuarios,
  desativarUsuarioAction,
  reativarUsuarioAction,
  enviarResetSenhaAdminAction,
} from '@/actions/usuario.actions'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import type { Papel } from '@prisma/client'
import type { UsuarioComMetricas } from '@/types/usuario'
import Link from 'next/link'

type Convite = {
  id: string
  email: string
  papel: Papel
  status: 'pendente' | 'aceito' | 'expirado'
  createdAt: Date
  expiresAt: Date
  convidadoPorNome: string | null
}

type Escola = { id: string; nome: string }

const STATUS_BADGE: Record<Convite['status'], { label: string; classes: string }> = {
  pendente: { label: 'Pendente', classes: 'bg-amber-100 text-amber-800 border border-amber-300' },
  aceito:   { label: 'Aceito',   classes: 'bg-green-100 text-green-800 border border-green-300' },
  expirado: { label: 'Expirado', classes: 'bg-red-100 text-red-700 border border-red-300' },
}

const PAPEIS: { value: string; label: string }[] = [
  { value: '', label: 'Todos os papéis' },
  { value: 'ADMIN_MUNICIPAL', label: 'Administrador' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'DIRETOR_ESCOLA', label: 'Diretor' },
  { value: 'MERENDEIRA', label: 'Merendeira' },
]

type Tab = 'ativos' | 'inativos' | 'convites'

export default function UsuariosPage() {
  const [tab, setTab] = useState<Tab>('ativos')
  const [modalConvidar, setModalConvidar] = useState(false)
  const [modalEditar, setModalEditar] = useState<UsuarioComMetricas | null>(null)
  const [usuarios, setUsuarios] = useState<UsuarioComMetricas[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [escolas, setEscolas] = useState<Escola[]>([])
  const [usuarioLogadoId, setUsuarioLogadoId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroPapel, setFiltroPapel] = useState('')
  const [isPending, startTransition] = useTransition()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [todosUsuarios, convitesData, apiRes] = await Promise.all([
        listarUsuarios(),
        listarConvitesAction(),
        fetch('/api/usuarios').then((r) => r.json()).catch(() => ({ escolas: [], usuarioLogadoId: '' })),
      ])
      setUsuarios(todosUsuarios)
      setConvites(convitesData)
      setEscolas(apiRes.escolas ?? [])
      setUsuarioLogadoId(apiRes.usuarioLogadoId ?? '')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const ativos = usuarios.filter((u) => u.ativo)
  const inativos = usuarios.filter((u) => !u.ativo)
  const pendentes = convites.filter((c) => c.status === 'pendente')

  const filtrarUsuarios = (lista: UsuarioComMetricas[]) => {
    return lista.filter((u) => {
      const matchBusca = !busca || u.nome.toLowerCase().includes(busca.toLowerCase()) || u.email.toLowerCase().includes(busca.toLowerCase())
      const matchPapel = !filtroPapel || u.papel === filtroPapel
      return matchBusca && matchPapel
    })
  }

  function handleDesativar(u: UsuarioComMetricas) {
    if (!confirm(`Desativar o acesso de ${u.nome}?`)) return
    startTransition(async () => {
      const res = await desativarUsuarioAction(u.id)
      if (res.sucesso) { toast.success(`${u.nome} desativado.`); loadData() }
      else toast.error((res as any).erro)
    })
  }

  function handleReativar(u: UsuarioComMetricas) {
    startTransition(async () => {
      const res = await reativarUsuarioAction(u.id)
      if (res.sucesso) { toast.success(`${u.nome} reativado.`); loadData() }
      else toast.error((res as any).erro)
    })
  }

  function handleResetSenha(u: UsuarioComMetricas) {
    startTransition(async () => {
      const res = await enviarResetSenhaAdminAction(u.id)
      if (res.sucesso) toast.success(`E-mail de reset enviado para ${u.email}.`)
      else toast.error((res as any).erro)
    })
  }

  function handleReenviar(id: string) {
    startTransition(async () => {
      const res = await reenviarConviteAction(id)
      if (res.sucesso) { toast.success('Convite reenviado.'); loadData() }
      else toast.error((res as any).erro)
    })
  }

  function handleRevogar(id: string) {
    startTransition(async () => {
      const res = await revogarConviteAction(id)
      if (res.sucesso) { toast.success('Convite revogado.'); loadData() }
      else toast.error((res as any).erro)
    })
  }

  const listaAtual = filtrarUsuarios(tab === 'ativos' ? ativos : inativos)
  const maxInspecoes = Math.max(...listaAtual.map((u) => u.inspecoesMes), 1)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">Usuários e Convites</h1>
          <p className="text-sm text-[#5A7089] mt-1">Gerencie quem tem acesso ao sistema.</p>
        </div>
        <Button
          className="bg-[#0E2E60] hover:bg-[#133878] text-white gap-2 shrink-0"
          onClick={() => setModalConvidar(true)}
        >
          <UserPlus size={16} />
          Convidar usuário
        </Button>
      </div>

      {/* Card principal */}
      <div className="bg-white rounded-2xl border border-[#D5E3F0] overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#D5E3F0] px-1 overflow-x-auto">
          {([
            { key: 'ativos',   label: 'Usuários ativos', count: ativos.length, badge: undefined },
            { key: 'convites', label: 'Convites', count: pendentes.length, badge: 'amber' as const },
            { key: 'inativos', label: 'Inativos', count: inativos.length, badge: undefined },
          ]).map(({ key, label, count, badge }) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={cn(
                'flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors shrink-0',
                tab === key
                  ? 'border-[#0E2E60] text-[#0E2E60]'
                  : 'border-transparent text-[#5A7089] hover:text-[#0E2E60]'
              )}
            >
              {label}
              {count > 0 && (
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-bold',
                  badge === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-[#EEF4FD] text-[#0E2E60]'
                )}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Toolbar de filtros */}
        {tab !== 'convites' && (
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#EEF4FD]">
            <div className="relative flex-1 min-w-48">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700">
                  <X size={12} />
                </button>
              )}
            </div>
            <select
              value={filtroPapel}
              onChange={(e) => setFiltroPapel(e.target.value)}
              className="h-8 rounded-lg border border-neutral-300 bg-white px-2.5 text-xs text-neutral-700 outline-none focus:border-[#0E2E60]"
            >
              {PAPEIS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <div className="ml-auto">
              <BotaoExportarCSV />
            </div>
          </div>
        )}

        {/* Conteúdo */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#5A7089]">
            <RefreshCw size={24} className="animate-spin" />
            <p className="text-sm">Carregando...</p>
          </div>
        ) : tab === 'convites' ? (
          <TabelaConvites
            convites={convites}
            onReenviar={handleReenviar}
            onRevogar={handleRevogar}
            isPending={isPending}
          />
        ) : (
          <TabelaUsuarios
            usuarios={listaAtual}
            maxInspecoes={maxInspecoes}
            mostrarInativos={tab === 'inativos'}
            isPending={isPending}
            onEditar={(u) => setModalEditar(u)}
            onDesativar={handleDesativar}
            onReativar={handleReativar}
            onResetSenha={handleResetSenha}
            usuarioLogadoId={usuarioLogadoId}
          />
        )}
      </div>

      {/* Modal convidar */}
      <ModalConvidarUsuario
        open={modalConvidar}
        onOpenChange={setModalConvidar}
        escolas={escolas}
        onSuccess={loadData}
      />

      {/* Modal editar */}
      {modalEditar && (
        <ModalEditarUsuario
          usuario={modalEditar}
          todasEscolas={escolas}
          usuarioLogadoId={usuarioLogadoId}
          open={!!modalEditar}
          onOpenChange={(open) => { if (!open) setModalEditar(null) }}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabela de usuários
// ─────────────────────────────────────────────────────────────────────────────

function TabelaUsuarios({
  usuarios,
  maxInspecoes,
  mostrarInativos,
  isPending,
  onEditar,
  onDesativar,
  onReativar,
  onResetSenha,
  usuarioLogadoId,
}: {
  usuarios: UsuarioComMetricas[]
  maxInspecoes: number
  mostrarInativos: boolean
  isPending: boolean
  onEditar: (u: UsuarioComMetricas) => void
  onDesativar: (u: UsuarioComMetricas) => void
  onReativar: (u: UsuarioComMetricas) => void
  onResetSenha: (u: UsuarioComMetricas) => void
  usuarioLogadoId: string
}) {
  if (usuarios.length === 0) {
    return (
      <div className="py-14 text-center text-[#5A7089]">
        <p className="font-medium">{mostrarInativos ? 'Nenhum usuário inativo.' : 'Nenhum usuário encontrado.'}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F5F9FD] border-b border-[#D5E3F0]">
            {['Usuário', 'Papel', 'Escolas', 'Inspeções/mês', 'Último acesso', ''].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-bold text-[#5A7089] uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF4FD]">
          {usuarios.map((u) => (
            <tr key={u.id} className={cn('hover:bg-[#F5F9FD] transition-colors', !u.ativo && 'opacity-60')}>
              {/* Usuário */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Avatar nome={u.nome} papel={u.papel} size="sm" />
                  <div>
                    <Link
                      href={`/configuracoes/usuarios/${u.id}`}
                      className="font-semibold text-[#0F1B2D] hover:text-[#0E2E60] transition-colors"
                    >
                      {u.nome}
                    </Link>
                    <p className="text-xs text-[#5A7089]">{u.email}</p>
                  </div>
                </div>
              </td>
              {/* Papel */}
              <td className="px-4 py-3">
                <PapelBadge papel={u.papel} size="sm" />
              </td>
              {/* Escolas */}
              <td className="px-4 py-3">
                <EscolaChips escolas={u.escolas} max={2} size="sm" />
              </td>
              {/* Inspeções/mês */}
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 min-w-[80px]">
                  <span className="text-sm font-semibold text-[#0F1B2D] w-4 text-right shrink-0">
                    {u.inspecoesMes}
                  </span>
                  <div className="flex-1 h-1.5 bg-[#EEF4FD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0E2E60] rounded-full transition-all"
                      style={{ width: `${(u.inspecoesMes / maxInspecoes) * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              {/* Último acesso */}
              <td className="px-4 py-3 text-xs text-neutral-500">
                <TempoRelativo data={u.ultimaInspecao} nullLabel="Nunca inspecionou" />
              </td>
              {/* Ações */}
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-[#EEF4FD] hover:text-[#0E2E60] transition-colors"
                    disabled={isPending}
                  >
                    <MoreHorizontal size={15} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-sm"
                      onClick={() => onEditar(u)}
                    >
                      <Pencil size={13} /> Editar usuário
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-sm"
                      onClick={() => onEditar(u)}
                    >
                      <School size={13} /> Gerenciar escolas
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-sm"
                      onClick={() => onResetSenha(u)}
                    >
                      <KeyRound size={13} /> Enviar reset de senha
                    </DropdownMenuItem>
                    {u.id !== usuarioLogadoId && (
                      <>
                        <DropdownMenuSeparator />
                        {u.ativo ? (
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer text-sm text-red-600"
                            onClick={() => onDesativar(u)}
                          >
                            <UserX size={13} /> Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer text-sm text-green-600"
                            onClick={() => onReativar(u)}
                          >
                            <RotateCcw size={13} /> Reativar
                          </DropdownMenuItem>
                        )}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tabela de convites
// ─────────────────────────────────────────────────────────────────────────────

function TabelaConvites({
  convites,
  onReenviar,
  onRevogar,
  isPending,
}: {
  convites: Convite[]
  onReenviar: (id: string) => void
  onRevogar: (id: string) => void
  isPending: boolean
}) {
  if (convites.length === 0) {
    return (
      <div className="py-14 flex flex-col items-center gap-3 text-[#5A7089]">
        <Mail size={36} className="opacity-25" />
        <p className="font-medium">Nenhum convite enviado.</p>
        <p className="text-sm">Convide membros usando o botão acima.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#F5F9FD] border-b border-[#D5E3F0]">
            {['E-mail', 'Papel', 'Enviado em', 'Expira em', 'Status', ''].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-[#5A7089] uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EEF4FD]">
          {convites.map((c) => {
            const badge = STATUS_BADGE[c.status]
            return (
              <tr key={c.id} className="hover:bg-[#F5F9FD] transition-colors">
                <td className="px-4 py-3 font-medium text-[#0F1B2D]">{c.email}</td>
                <td className="px-4 py-3"><PapelBadge papel={c.papel} size="sm" /></td>
                <td className="px-4 py-3 text-neutral-500 text-xs">
                  {format(new Date(c.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </td>
                <td className="px-4 py-3 text-neutral-500 text-xs">
                  {c.status === 'aceito' ? '—' : format(new Date(c.expiresAt), 'dd/MM HH:mm', { locale: ptBR })}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold', badge.classes)}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {c.status !== 'aceito' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-[#EEF4FD] transition-colors"
                        disabled={isPending}
                      >
                        <MoreHorizontal size={15} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm" onClick={() => onReenviar(c.id)}>
                          <Mail size={13} /> Reenviar convite
                        </DropdownMenuItem>
                        {c.status === 'pendente' && (
                          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm text-red-600" onClick={() => onRevogar(c.id)}>
                            <X size={13} /> Revogar convite
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
