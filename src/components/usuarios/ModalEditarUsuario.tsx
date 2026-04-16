'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, School } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/shared/Avatar'
import { PapelBadge } from '@/components/shared/PapelBadge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  alterarPapelAction,
  desativarUsuarioAction,
  reativarUsuarioAction,
  atualizarEscolasUsuarioAction,
} from '@/actions/usuario.actions'
import type { Papel } from '@prisma/client'

const PAPEIS_SELECIONAVEIS: { value: Papel; label: string }[] = [
  { value: 'ADMIN_MUNICIPAL', label: 'Administrador Municipal' },
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'DIRETOR_ESCOLA', label: 'Diretor de Escola' },
  { value: 'MERENDEIRA', label: 'Merendeira' },
]

interface ModalEditarUsuarioProps {
  usuario: {
    id: string
    nome: string
    email: string
    papel: Papel
    ativo: boolean
    escolas: { id: string; nome: string }[]
  }
  todasEscolas: { id: string; nome: string }[]
  usuarioLogadoId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type TabAtiva = 'dados' | 'escolas'

export function ModalEditarUsuario({
  usuario,
  todasEscolas,
  usuarioLogadoId,
  open,
  onOpenChange,
  onSuccess,
}: ModalEditarUsuarioProps) {
  const [tab, setTab] = useState<TabAtiva>('dados')
  const [papel, setPapel] = useState<Papel>(usuario.papel)
  const [ativo, setAtivo] = useState(usuario.ativo)
  const [escolasSelecionadas, setEscolasSelecionadas] = useState<string[]>(
    usuario.escolas.map((e) => e.id)
  )
  const [salvando, setSalvando] = useState(false)
  const [erroInline, setErroInline] = useState('')

  const eProprioUsuario = usuario.id === usuarioLogadoId

  // Sync state when usuario changes (modal re-opened for different user)
  useEffect(() => {
    setPapel(usuario.papel)
    setAtivo(usuario.ativo)
    setEscolasSelecionadas(usuario.escolas.map((e) => e.id))
    setErroInline('')
    setTab('dados')
  }, [usuario])

  async function handleSalvarDados() {
    setSalvando(true)
    setErroInline('')

    try {
      // Alterar papel se mudou
      if (papel !== usuario.papel) {
        const res = await alterarPapelAction(usuario.id, papel)
        if (!res.sucesso) {
          setErroInline(res.erro)
          setSalvando(false)
          return
        }
      }

      // Alterar status se mudou
      if (ativo !== usuario.ativo) {
        const res = ativo
          ? await reativarUsuarioAction(usuario.id)
          : await desativarUsuarioAction(usuario.id)
        if (!res.sucesso) {
          setErroInline(res.erro)
          setSalvando(false)
          return
        }
      }

      toast.success('Usuário atualizado com sucesso.')
      onSuccess()
      onOpenChange(false)
    } finally {
      setSalvando(false)
    }
  }

  async function handleSalvarEscolas() {
    setSalvando(true)
    setErroInline('')

    const res = await atualizarEscolasUsuarioAction(usuario.id, escolasSelecionadas)
    setSalvando(false)

    if (!res.sucesso) {
      setErroInline(res.erro)
      return
    }

    toast.success('Escolas atualizadas com sucesso.')
    onSuccess()
    onOpenChange(false)
  }

  function toggleEscola(escolaId: string) {
    setEscolasSelecionadas((prev) =>
      prev.includes(escolaId) ? prev.filter((id) => id !== escolaId) : [...prev, escolaId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>

        {/* Avatar + info */}
        <div className="flex items-center gap-3 pb-2">
          <Avatar nome={usuario.nome} papel={usuario.papel} size="lg" />
          <div>
            <p className="font-semibold text-[#0F1B2D]">{usuario.nome}</p>
            <p className="text-xs text-neutral-500">{usuario.email}</p>
            <PapelBadge papel={usuario.papel} size="sm" className="mt-1" />
          </div>
        </div>

        {/* Tabs internas */}
        <div className="flex border-b border-neutral-200 -mx-4 px-4">
          {(['dados', 'escolas'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setErroInline('') }}
              className={cn(
                'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors',
                tab === t
                  ? 'border-[#0E2E60] text-[#0E2E60]'
                  : 'border-transparent text-neutral-500 hover:text-[#0E2E60]'
              )}
            >
              {t === 'dados' ? 'Dados gerais' : (
                <span className="flex items-center gap-1.5">
                  <School size={13} /> Escolas
                  {escolasSelecionadas.length > 0 && (
                    <span className="bg-[#EEF4FD] text-[#0E2E60] text-[10px] px-1.5 rounded-full font-bold">
                      {escolasSelecionadas.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Erro inline */}
        {erroInline && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertTriangle size={14} />
            {erroInline}
          </div>
        )}

        {/* Tab: Dados gerais */}
        {tab === 'dados' && (
          <div className="space-y-4 py-1">
            <div>
              <label className="text-xs font-bold text-[#5A7089] uppercase tracking-widest mb-2 block">
                Papel
              </label>
              <select
                value={papel}
                onChange={(e) => setPapel(e.target.value as Papel)}
                disabled={eProprioUsuario}
                className="w-full h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-[#0E2E60] focus:ring-2 focus:ring-[#0E2E60]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {PAPEIS_SELECIONAVEIS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {eProprioUsuario && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={11} /> Você não pode alterar o seu próprio papel.
                </p>
              )}
              {!eProprioUsuario && papel !== usuario.papel && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={11} /> Alterar o papel pode afetar o acesso às funcionalidades.
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-[#5A7089] uppercase tracking-widest mb-2 block">
                Status
              </label>
              <div className="flex gap-4">
                {[
                  { valor: true, label: 'Ativo' },
                  { valor: false, label: 'Inativo' },
                ].map(({ valor, label }) => (
                  <label key={label} className={cn('flex items-center gap-2 cursor-pointer', eProprioUsuario && 'opacity-50 cursor-not-allowed')}>
                    <input
                      type="radio"
                      name="status"
                      checked={ativo === valor}
                      onChange={() => !eProprioUsuario && setAtivo(valor)}
                      disabled={eProprioUsuario}
                      className="accent-[#0E2E60]"
                    />
                    <span className="text-sm text-neutral-700">{label}</span>
                  </label>
                ))}
              </div>
              {eProprioUsuario && (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <AlertTriangle size={11} /> Você não pode desativar sua própria conta.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-[#0E2E60] hover:bg-[#133878] text-white"
                onClick={handleSalvarDados}
                disabled={salvando}
              >
                {salvando && <Loader2 size={13} className="animate-spin mr-1" />}
                Salvar alterações
              </Button>
            </div>
          </div>
        )}

        {/* Tab: Escolas */}
        {tab === 'escolas' && (
          <div className="space-y-3 py-1">
            <p className="text-sm text-neutral-500">
              Selecione as escolas que este usuário pode acessar:
            </p>

            {todasEscolas.length === 0 ? (
              <p className="text-sm text-neutral-400 italic">Nenhuma escola cadastrada.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {todasEscolas.map((escola) => (
                  <label
                    key={escola.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-neutral-200 hover:bg-[#F5F9FD] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={escolasSelecionadas.includes(escola.id)}
                      onChange={() => toggleEscola(escola.id)}
                      className="accent-[#0E2E60] w-4 h-4 rounded"
                    />
                    <span className="text-sm text-[#0F1B2D] font-medium">{escola.nome}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEscolasSelecionadas(todasEscolas.map((e) => e.id))}
                className="text-[#0E2E60] hover:underline"
              >
                Selecionar todas
              </button>
              <span className="text-neutral-300">|</span>
              <button
                type="button"
                onClick={() => setEscolasSelecionadas([])}
                className="text-neutral-500 hover:underline"
              >
                Limpar
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="bg-[#0E2E60] hover:bg-[#133878] text-white"
                onClick={handleSalvarEscolas}
                disabled={salvando}
              >
                {salvando && <Loader2 size={13} className="animate-spin mr-1" />}
                Salvar escolas
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
