'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { CATEGORIA_CONFIG } from '@/components/checklists/CategoriaConfig'
import type { CategoriaChecklist } from '@prisma/client'

interface Escola {
  id: string
  nome: string
}

interface Props {
  escolas: Escola[]
}

export function InspecoesFiltros({ escolas }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const busca    = searchParams.get('busca') ?? ''
  const escolaId = searchParams.get('escolaId') ?? ''
  const categoria = searchParams.get('categoria') ?? ''
  const dataInicio = searchParams.get('dataInicio') ?? ''
  const dataFim    = searchParams.get('dataFim') ?? ''

  const temFiltro = busca || escolaId || categoria || dataInicio || dataFim

  const set = useCallback((key: string, value: string) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.delete('page') // reset paginação ao filtrar
      router.push(`${pathname}?${params.toString()}`)
    })
  }, [pathname, router, searchParams])

  const limpar = () => {
    startTransition(() => {
      router.push(pathname)
    })
  }

  const categorias = Object.entries(CATEGORIA_CONFIG) as [CategoriaChecklist, typeof CATEGORIA_CONFIG[CategoriaChecklist]][]

  return (
    <div className={`space-y-3 transition-opacity ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {/* Linha 1: Busca + Escola */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        {/* Busca por nome da escola */}
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por escola..."
            defaultValue={busca}
            onKeyDown={(e) => { if (e.key === 'Enter') set('busca', (e.target as HTMLInputElement).value) }}
            onBlur={(e) => set('busca', e.target.value)}
            className="w-full pl-8 pr-3 h-9 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
          />
        </div>

        {/* Escola (dropdown) */}
        <select
          value={escolaId}
          onChange={(e) => set('escolaId', e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-xl bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all min-w-[160px] flex-1 sm:flex-none"
        >
          <option value="">Todas as escolas</option>
          {escolas.map((e) => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
      </div>

      {/* Linha 2: Categoria + Período */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap items-center">
        {/* Categoria */}
        <select
          value={categoria}
          onChange={(e) => set('categoria', e.target.value)}
          className="h-9 px-3 text-sm border border-neutral-200 rounded-xl bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all min-w-[160px]"
        >
          <option value="">Todas as categorias</option>
          {categorias.map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>

        {/* Data início */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
          <span className="text-xs text-neutral-400 shrink-0">De</span>
          <input
            type="date"
            value={dataInicio}
            max={dataFim || undefined}
            onChange={(e) => set('dataInicio', e.target.value)}
            className="flex-1 h-9 px-2 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
          />
        </div>

        {/* Data fim */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
          <span className="text-xs text-neutral-400 shrink-0">Até</span>
          <input
            type="date"
            value={dataFim}
            min={dataInicio || undefined}
            onChange={(e) => set('dataFim', e.target.value)}
            className="flex-1 h-9 px-2 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-800/20 focus:border-blue-800 transition-all"
          />
        </div>

        {/* Limpar filtros */}
        {temFiltro && (
          <button
            onClick={limpar}
            className="flex items-center gap-1.5 h-9 px-3 text-sm text-red-600 border border-red-200 rounded-xl bg-red-50 hover:bg-red-100 transition-colors shrink-0 font-medium"
          >
            <X size={13} /> Limpar
          </button>
        )}
      </div>

      {/* Badge de filtros ativos */}
      {temFiltro && (
        <div className="flex items-center gap-1.5 text-xs text-blue-800">
          <SlidersHorizontal size={12} />
          <span>Filtros ativos</span>
          {busca && <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Busca: "{busca}"</span>}
          {escolaId && <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{escolas.find(e => e.id === escolaId)?.nome ?? 'Escola'}</span>}
          {categoria && <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{CATEGORIA_CONFIG[categoria as CategoriaChecklist]?.label ?? categoria}</span>}
          {dataInicio && <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">De {dataInicio}</span>}
          {dataFim && <span className="bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Até {dataFim}</span>}
        </div>
      )}
    </div>
  )
}
