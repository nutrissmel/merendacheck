'use client'

import { useState } from 'react'
import Link from 'next/link'
import { UserPlus, Users } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { PapelBadge } from '@/components/shared/PapelBadge'
import { ModalUsuariosEscola } from './ModalUsuariosEscola'
import type { UsuarioSimples } from '@/types/escola'

interface AbaEquipeProps {
  escolaId: string
  nomeEscola: string
  usuarios: UsuarioSimples[]
  podeEditar: boolean
}

export function AbaEquipe({ escolaId, nomeEscola, usuarios, podeEditar }: AbaEquipeProps) {
  const [modalAberto, setModalAberto] = useState(false)
  const [listaAtual, setListaAtual] = useState<UsuarioSimples[]>(usuarios)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5A7089]">
          {listaAtual.length} usuário{listaAtual.length !== 1 ? 's' : ''} atribuído{listaAtual.length !== 1 ? 's' : ''}
        </p>
        {podeEditar && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
          >
            <UserPlus size={15} />
            Atribuir usuário
          </button>
        )}
      </div>

      {/* Lista */}
      {listaAtual.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#D5E3F0] p-12 text-center shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
          <Users size={36} className="text-[#A8BDD4] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#0F1B2D] font-heading">Nenhum usuário atribuído</p>
          <p className="text-sm text-[#5A7089] mt-1">
            Atribua merendeiras, diretores e nutricionistas a esta escola.
          </p>
          {podeEditar && (
            <button
              onClick={() => setModalAberto(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors"
            >
              <UserPlus size={14} />
              Atribuir usuário
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listaAtual.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)] flex items-center gap-3"
            >
              <Avatar nome={u.nome} papel={u.papel as any} size="md" />
              <div className="min-w-0 flex-1">
                <Link
                  href={`/configuracoes/usuarios/${u.id}`}
                  className="text-sm font-semibold text-[#0F1B2D] hover:text-[#0E2E60] transition-colors truncate block"
                >
                  {u.nome}
                </Link>
                <p className="text-xs text-[#5A7089] truncate">{u.email}</p>
                <div className="mt-1">
                  <PapelBadge papel={u.papel as any} size="sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de atribuição */}
      <ModalUsuariosEscola
        escolaId={escolaId}
        nomeEscola={nomeEscola}
        usuariosAtuais={listaAtual}
        open={modalAberto}
        onOpenChange={setModalAberto}
      />
    </div>
  )
}
