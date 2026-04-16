'use client'

import { useState, useEffect } from 'react'
import { UserPlus, X, Loader2, Users } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  atribuirUsuarioEscolaAction,
  removerUsuarioEscolaAction,
  buscarUsuariosDisponiveisAction,
} from '@/actions/escola.actions'
import type { UsuarioSimples } from '@/types/escola'

const PAPEL_LABEL: Record<string, string> = {
  ADMIN_MUNICIPAL: 'Admin Municipal',
  NUTRICIONISTA: 'Nutricionista',
  INSPETOR: 'Inspetor',
  SUPER_ADMIN: 'Super Admin',
}

interface ModalUsuariosEscolaProps {
  escolaId: string
  nomeEscola: string
  usuariosAtuais: UsuarioSimples[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ModalUsuariosEscola({
  escolaId,
  nomeEscola,
  usuariosAtuais,
  open,
  onOpenChange,
}: ModalUsuariosEscolaProps) {
  const [usuarios, setUsuarios] = useState<UsuarioSimples[]>(usuariosAtuais)
  const [disponíveis, setDisponíveis] = useState<UsuarioSimples[]>([])
  const [selecionado, setSelecionado] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [removendo, setRemovendo] = useState<string | null>(null)
  const [atribuindo, setAtribuindo] = useState(false)

  useEffect(() => {
    if (!open) return
    setCarregando(true)
    buscarUsuariosDisponiveisAction(escolaId)
      .then(setDisponíveis)
      .finally(() => setCarregando(false))
  }, [open, escolaId, usuarios])

  async function handleAtribuir() {
    if (!selecionado) return
    setAtribuindo(true)
    const res = await atribuirUsuarioEscolaAction(escolaId, selecionado)
    setAtribuindo(false)
    if (res.sucesso) {
      const novo = disponíveis.find((u) => u.id === selecionado)
      if (novo) setUsuarios((prev) => [...prev, novo])
      setSelecionado('')
      toast.success('Usuário atribuído com sucesso.')
    } else {
      toast.error(res.erro)
    }
  }

  async function handleRemover(usuarioId: string) {
    setRemovendo(usuarioId)
    const res = await removerUsuarioEscolaAction(escolaId, usuarioId)
    setRemovendo(null)
    if (res.sucesso) {
      setUsuarios((prev) => prev.filter((u) => u.id !== usuarioId))
      toast.success('Usuário removido.')
    } else {
      toast.error(res.erro)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} className="text-[#0E2E60]" />
            Usuários — {nomeEscola}
          </DialogTitle>
        </DialogHeader>

        {/* Lista de usuários atuais */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {usuarios.length === 0 && (
            <p className="text-sm text-neutral-400 italic text-center py-4">
              Nenhum usuário atribuído
            </p>
          )}
          {usuarios.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-[#F5F9FD] rounded-lg border border-[#D5E3F0]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0F1B2D] truncate">{u.nome}</p>
                <p className="text-xs text-neutral-400 truncate">
                  {u.email} · {PAPEL_LABEL[u.papel] ?? u.papel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemover(u.id)}
                disabled={removendo === u.id}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                {removendo === u.id ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <X size={12} />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Adicionar usuário */}
        <div className="border-t border-neutral-200 pt-4 space-y-3">
          <p className="text-xs font-bold text-[#5A7089] uppercase tracking-widest">
            Adicionar usuário
          </p>

          {carregando ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <Loader2 size={14} className="animate-spin" />
              Buscando usuários...
            </div>
          ) : disponíveis.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">
              Todos os usuários já estão atribuídos.
            </p>
          ) : (
            <div className="flex gap-2">
              <select
                value={selecionado}
                onChange={(e) => setSelecionado(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-neutral-300 bg-white px-2.5 text-sm text-neutral-800 outline-none focus:border-[#0E2E60] focus:ring-2 focus:ring-[#0E2E60]/20 transition-colors"
              >
                <option value="">Selecionar usuário...</option>
                {disponíveis.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({PAPEL_LABEL[u.papel] ?? u.papel})
                  </option>
                ))}
              </select>
              <Button
                onClick={handleAtribuir}
                disabled={!selecionado || atribuindo}
                size="sm"
                className="bg-[#0E2E60] hover:bg-[#133878] text-white shrink-0"
              >
                {atribuindo ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <UserPlus size={14} />
                )}
                Atribuir
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
