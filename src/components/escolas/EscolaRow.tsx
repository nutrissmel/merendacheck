'use client'

import Link from 'next/link'
import { useState } from 'react'
import { School, MoreHorizontal, Pencil, ClipboardList, UserCog, Ban, RotateCcw } from 'lucide-react'
import { ScoreBadge } from '@/components/shared/ScoreBadge'
import { desativarEscolaAction, reativarEscolaAction } from '@/actions/escola.actions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import type { EscolaComMetricas } from '@/types/escola'
import type { ScoreStatus } from '@prisma/client'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TURNO_LABEL: Record<string, string> = {
  MATUTINO: 'Mat.',
  VESPERTINO: 'Vesp.',
  NOTURNO: 'Not.',
  INTEGRAL: 'Integ.',
}

interface EscolaRowProps {
  escola: EscolaComMetricas
  podeEditar?: boolean
  podeDesativar?: boolean
  onGerenciarUsuarios?: (id: string) => void
}

export function EscolaRow({ escola, podeEditar, podeDesativar, onGerenciarUsuarios }: EscolaRowProps) {
  const [loading, setLoading] = useState(false)

  async function handleDesativar() {
    if (!confirm(`Desativar "${escola.nome}"?`)) return
    setLoading(true)
    const res = await desativarEscolaAction(escola.id)
    setLoading(false)
    if (res.sucesso) toast.success('Escola desativada.')
    else toast.error(res.erro)
  }

  async function handleReativar() {
    setLoading(true)
    const res = await reativarEscolaAction(escola.id)
    setLoading(false)
    if (res.sucesso) toast.success('Escola reativada.')
    else toast.error(res.erro)
  }

  return (
    <tr className={`border-b border-neutral-100 hover:bg-[#EEF4FD] transition-colors ${!escola.ativa ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <School size={16} className="text-[#0E2E60] shrink-0" />
          <Link href={`/escolas/${escola.id}`} className="font-semibold text-[#0F1B2D] hover:text-[#0E2E60] text-sm">
            {escola.nome}
          </Link>
          {!escola.ativa && (
            <span className="px-1.5 py-0.5 bg-neutral-200 text-neutral-600 text-xs rounded-full">Inativa</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500">{escola.cidade ?? '—'}</td>
      <td className="px-4 py-3 text-sm text-neutral-500">{escola.numeroAlunos}</td>
      <td className="px-4 py-3 text-sm text-neutral-500">
        {escola.turnos.map((t) => TURNO_LABEL[t]).join(' / ') || '—'}
      </td>
      <td className="px-4 py-3">
        {escola.ultimaInspecao ? (
          <ScoreBadge
            scoreStatus={escola.ultimaInspecao.scoreStatus as ScoreStatus}
            score={escola.ultimaInspecao.score}
            showScore
            size="sm"
          />
        ) : (
          <span className="text-xs text-neutral-400">—</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-neutral-500">
        {escola.ultimaInspecao
          ? format(new Date(escola.ultimaInspecao.data), 'dd/MM/yy', { locale: ptBR })
          : '—'}
      </td>
      <td className="px-4 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <MoreHorizontal size={16} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href={`/escolas/${escola.id}`} className="flex items-center gap-2 w-full text-sm">
                <School size={13} /> Ver detalhe
              </Link>
            </DropdownMenuItem>
            {podeEditar && (
              <>
                <DropdownMenuItem>
                  <Link href={`/escolas/${escola.id}/editar`} className="flex items-center gap-2 w-full text-sm">
                    <Pencil size={13} /> Editar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-sm" onClick={() => onGerenciarUsuarios?.(escola.id)}>
                  <UserCog size={13} /> Usuários
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href={`/inspecoes?escola=${escola.id}`} className="flex items-center gap-2 w-full text-sm">
                    <ClipboardList size={13} /> Inspeções
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            {podeDesativar && (
              <>
                <DropdownMenuSeparator />
                {escola.ativa ? (
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-red-600 text-sm" onClick={handleDesativar} disabled={loading}>
                    <Ban size={13} /> Desativar
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-green-600 text-sm" onClick={handleReativar} disabled={loading}>
                    <RotateCcw size={13} /> Reativar
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  )
}
