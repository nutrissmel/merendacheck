'use client'

import Link from 'next/link'
import { useState } from 'react'
import { School, Users, AlertTriangle, ChevronRight, MoreHorizontal, Pencil, ClipboardList, UserCog, Ban, RotateCcw } from 'lucide-react'
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
import { format, isToday, isYesterday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TURNO_LABEL: Record<string, string> = {
  MATUTINO: 'Mat.',
  VESPERTINO: 'Vesp.',
  NOTURNO: 'Not.',
  INTEGRAL: 'Integ.',
}

function formatarDataInspecao(data: Date): string {
  const d = new Date(data)
  if (isToday(d)) return `hoje às ${format(d, 'HH:mm')}`
  if (isYesterday(d)) return `ontem às ${format(d, 'HH:mm')}`
  return format(d, "dd/MM 'às' HH:mm", { locale: ptBR })
}

function ScoreBar({ score, status }: { score: number; status: ScoreStatus }) {
  const cor =
    status === 'CONFORME' ? '#00963A'
    : status === 'ATENCAO' ? '#F59E0B'
    : '#DC2626'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-neutral-500">
        <span>Score</span>
        <span className="font-bold" style={{ color: cor }}>{Math.round(score)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-[#D9E8FA] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: cor }}
        />
      </div>
    </div>
  )
}

interface EscolaCardProps {
  escola: EscolaComMetricas
  podeEditar?: boolean
  podeDesativar?: boolean
  onGerenciarUsuarios?: (escolaId: string) => void
}

export function EscolaCard({ escola, podeEditar = false, podeDesativar = false, onGerenciarUsuarios }: EscolaCardProps) {
  const [loading, setLoading] = useState(false)

  async function handleDesativar() {
    if (!confirm(`Deseja desativar "${escola.nome}"?`)) return
    setLoading(true)
    const res = await desativarEscolaAction(escola.id)
    setLoading(false)
    if (res.sucesso) {
      toast.success('Escola desativada com sucesso.')
    } else {
      toast.error(res.erro)
    }
  }

  async function handleReativar() {
    setLoading(true)
    const res = await reativarEscolaAction(escola.id)
    setLoading(false)
    if (res.sucesso) {
      toast.success('Escola reativada com sucesso.')
    } else {
      toast.error(res.erro)
    }
  }

  return (
    <div
      className={`relative bg-white border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-[0_4px_12px_rgba(14,46,96,0.12)] hover:border-[#A8BDD4] flex flex-col ${
        escola.ativa ? 'border-[#D5E3F0]' : 'border-neutral-200 opacity-70'
      }`}
    >
      {/* Badge inativa */}
      {!escola.ativa && (
        <div className="absolute top-3 right-10 z-10">
          <span className="px-2 py-0.5 bg-neutral-200 text-neutral-600 text-xs font-semibold rounded-full">
            Inativa
          </span>
        </div>
      )}

      {/* Header do card */}
      <div className="p-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#EEF4FD] flex items-center justify-center shrink-0">
            <School size={18} className="text-[#0E2E60]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-[#0F1B2D] text-sm leading-tight truncate">{escola.nome}</h3>
            {escola.cidade && (
              <p className="text-xs text-neutral-500 mt-0.5">{escola.cidade}</p>
            )}
            <p className="text-xs text-neutral-400 mt-0.5">
              {escola.numeroAlunos} alunos
              {escola.turnos.length > 0 && ` · ${escola.turnos.map((t) => TURNO_LABEL[t]).join(' ')}`}
            </p>
          </div>
        </div>

        {(podeEditar || podeDesativar) && (
          <DropdownMenu>
            <DropdownMenuTrigger className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors shrink-0">
              <MoreHorizontal size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {podeEditar && (
                <>
                  <DropdownMenuItem>
                    <Link href={`/escolas/${escola.id}/editar`} className="flex items-center gap-2 w-full">
                      <Pencil size={14} /> Editar escola
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => onGerenciarUsuarios?.(escola.id)}
                  >
                    <UserCog size={14} /> Gerenciar usuários
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href={`/inspecoes?escola=${escola.id}`} className="flex items-center gap-2 w-full">
                      <ClipboardList size={14} /> Ver inspeções
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              {podeDesativar && (
                <>
                  <DropdownMenuSeparator />
                  {escola.ativa ? (
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-red-600"
                      onClick={handleDesativar}
                      disabled={loading}
                    >
                      <Ban size={14} /> Desativar escola
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      className="flex items-center gap-2 cursor-pointer text-green-600"
                      onClick={handleReativar}
                      disabled={loading}
                    >
                      <RotateCcw size={14} /> Reativar escola
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Score */}
      <div className="px-4 py-3 border-t border-[#EEF4FD] space-y-2">
        {escola.ultimaInspecao ? (
          <>
            <p className="text-xs text-neutral-400">
              Última inspeção: {formatarDataInspecao(escola.ultimaInspecao.data)}
            </p>
            <ScoreBar score={escola.ultimaInspecao.score} status={escola.ultimaInspecao.scoreStatus as ScoreStatus} />
            <ScoreBadge scoreStatus={escola.ultimaInspecao.scoreStatus as ScoreStatus} size="sm" />
          </>
        ) : (
          <p className="text-xs text-neutral-500 italic py-2">Nenhuma inspeção realizada</p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#EEF4FD] flex items-center justify-between mt-auto">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1 text-xs text-neutral-500">
            <Users size={12} /> {escola.totalUsuarios} usuário{escola.totalUsuarios !== 1 ? 's' : ''}
          </span>
          {escola.ncsAbertas > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
              <AlertTriangle size={12} /> {escola.ncsAbertas} NC{escola.ncsAbertas !== 1 ? 's' : ''} abertas
            </span>
          )}
        </div>
        <Link
          href={`/escolas/${escola.id}`}
          className="flex items-center gap-1 text-xs font-semibold text-[#0E2E60] hover:text-[#133878] transition-colors"
        >
          Ver escola <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}
