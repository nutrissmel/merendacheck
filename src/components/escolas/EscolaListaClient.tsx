'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, List, Search, SlidersHorizontal, Plus, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { EscolaCard } from './EscolaCard'
import { EscolaRow } from './EscolaRow'
import { ModalUsuariosEscola } from './ModalUsuariosEscola'
import { EmptyState } from '@/components/shared/EmptyState'
import { useEscolaFiltros } from '@/hooks/useEscolaFiltros'
import { cn } from '@/lib/utils'
import type { EscolaComMetricas } from '@/types/escola'
import type { UsuarioSimples } from '@/types/escola'
import { School } from 'lucide-react'

const TURNOS = [
  { value: 'todos', label: 'Todos os turnos' },
  { value: 'MATUTINO', label: 'Matutino' },
  { value: 'VESPERTINO', label: 'Vespertino' },
  { value: 'NOTURNO', label: 'Noturno' },
  { value: 'INTEGRAL', label: 'Integral' },
]

const STATUS_OPTS = [
  { value: 'ativa', label: 'Ativas' },
  { value: 'inativa', label: 'Inativas' },
  { value: 'todas', label: 'Todas' },
]

const ORDEM_OPTS = [
  { value: 'nome', label: 'Nome' },
  { value: 'score', label: 'Score' },
  { value: 'ultimaInspecao', label: 'Última inspeção' },
]

interface EscolaListaClientProps {
  escolas: EscolaComMetricas[]
  podeEditar: boolean
  podeDesativar: boolean
  podeAdicionarEscola: boolean
}

interface ModalState {
  escolaId: string
  nomeEscola: string
  usuarios: UsuarioSimples[]
}

export function EscolaListaClient({
  escolas,
  podeEditar,
  podeDesativar,
  podeAdicionarEscola,
}: EscolaListaClientProps) {
  const { filtros, setFiltro, limparFiltros } = useEscolaFiltros()
  const [visao, setVisao] = useState<'grid' | 'lista'>('grid')
  const [modal, setModal] = useState<ModalState | null>(null)
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false)

  // Filtragem e ordenação local (os dados já vêm filtrados do server, mas mantemos busca reativa)
  const escolasFiltradas = escolas.filter((e) => {
    if (!filtros.busca) return true
    return e.nome.toLowerCase().includes(filtros.busca.toLowerCase()) ||
      (e.cidade ?? '').toLowerCase().includes(filtros.busca.toLowerCase())
  })

  const temFiltroAtivo =
    filtros.busca ||
    filtros.turno !== 'todos' ||
    filtros.status !== 'ativa' ||
    filtros.ordem !== 'nome'

  function abrirModal(escolaId: string) {
    const escola = escolas.find((e) => e.id === escolaId)
    if (!escola) return
    setModal({ escolaId, nomeEscola: escola.nome, usuarios: [] })
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Busca */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <Input
            placeholder="Buscar escola ou cidade..."
            value={filtros.busca}
            onChange={(e) => setFiltro('busca', e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {filtros.busca && (
            <button
              onClick={() => setFiltro('busca', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Filtros toggle */}
          <button
            onClick={() => setFiltrosVisiveis((v) => !v)}
            className={cn(
              'h-9 px-3 rounded-lg border text-sm font-medium flex items-center gap-1.5 transition-colors',
              filtrosVisiveis || temFiltroAtivo
                ? 'bg-[#EEF4FD] border-[#0E2E60] text-[#0E2E60]'
                : 'border-neutral-300 text-neutral-600 hover:border-neutral-400'
            )}
          >
            <SlidersHorizontal size={13} />
            Filtros
            {temFiltroAtivo && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0E2E60] ml-0.5" />
            )}
          </button>

          {/* Grid / Lista */}
          <div className="flex border border-neutral-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setVisao('grid')}
              className={cn('h-9 px-3 flex items-center transition-colors', visao === 'grid' ? 'bg-[#0E2E60] text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50')}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setVisao('lista')}
              className={cn('h-9 px-3 flex items-center transition-colors border-l border-neutral-300', visao === 'lista' ? 'bg-[#0E2E60] text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50')}
            >
              <List size={14} />
            </button>
          </div>

          {/* Nova escola */}
          {podeAdicionarEscola && (
            <Link
              href="/escolas/nova"
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#0E2E60] hover:bg-[#133878] text-white text-sm font-medium transition-colors"
            >
              <Plus size={14} />
              Nova escola
            </Link>
          )}
        </div>
      </div>

      {/* Painel de filtros */}
      {filtrosVisiveis && (
        <div className="bg-[#F5F9FD] border border-[#D5E3F0] rounded-xl p-4 flex flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#5A7089] uppercase tracking-widest">Turno</label>
            <div className="flex gap-1.5 flex-wrap">
              {TURNOS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFiltro('turno', value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    filtros.turno === value
                      ? 'bg-[#0E2E60] text-white border-[#0E2E60]'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#0E2E60] hover:text-[#0E2E60]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#5A7089] uppercase tracking-widest">Status</label>
            <div className="flex gap-1.5">
              {STATUS_OPTS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFiltro('status', value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    filtros.status === value
                      ? 'bg-[#0E2E60] text-white border-[#0E2E60]'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#0E2E60] hover:text-[#0E2E60]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#5A7089] uppercase tracking-widest">Ordenar por</label>
            <div className="flex gap-1.5">
              {ORDEM_OPTS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFiltro('ordem', value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    filtros.ordem === value
                      ? 'bg-[#0E2E60] text-white border-[#0E2E60]'
                      : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#0E2E60] hover:text-[#0E2E60]'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {temFiltroAtivo && (
            <div className="flex items-end">
              <button
                onClick={limparFiltros}
                className="text-xs text-neutral-500 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <X size={11} /> Limpar filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contador */}
      <p className="text-xs text-neutral-500">
        {escolasFiltradas.length} escola{escolasFiltradas.length !== 1 ? 's' : ''} encontrada{escolasFiltradas.length !== 1 ? 's' : ''}
      </p>

      {/* Conteúdo */}
      {escolasFiltradas.length === 0 ? (
        <EmptyState
          icone={School}
          titulo="Nenhuma escola encontrada"
          descricao={temFiltroAtivo ? 'Tente ajustar os filtros.' : 'Cadastre a primeira escola do município.'}
          acao={podeAdicionarEscola && !temFiltroAtivo ? { label: 'Nova escola', href: '/escolas/nova' } : undefined}
        />
      ) : visao === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {escolasFiltradas.map((escola) => (
            <EscolaCard
              key={escola.id}
              escola={escola}
              podeEditar={podeEditar}
              podeDesativar={podeDesativar}
              onGerenciarUsuarios={abrirModal}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#EEF4FD] border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Escola</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Cidade</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Alunos</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Turnos</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider">Última inspeção</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {escolasFiltradas.map((escola) => (
                  <EscolaRow
                    key={escola.id}
                    escola={escola}
                    podeEditar={podeEditar}
                    podeDesativar={podeDesativar}
                    onGerenciarUsuarios={abrirModal}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de usuários */}
      {modal && (
        <ModalUsuariosEscola
          escolaId={modal.escolaId}
          nomeEscola={modal.nomeEscola}
          usuariosAtuais={modal.usuarios}
          open={!!modal}
          onOpenChange={(open) => { if (!open) setModal(null) }}
        />
      )}
    </div>
  )
}
