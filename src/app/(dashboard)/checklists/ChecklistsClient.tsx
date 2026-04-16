'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { Search } from 'lucide-react'

const CATEGORIAS = [
  { value: '', label: 'Categoria' },
  { value: 'TEMPERATURA', label: 'Temperatura' },
  { value: 'RECEBIMENTO_GENEROS', label: 'Recebimento' },
  { value: 'HIGIENE_PESSOAL', label: 'Higiene Pessoal' },
  { value: 'INSTALACOES', label: 'Instalações' },
  { value: 'PREPARACAO_DISTRIBUICAO', label: 'Preparação' },
  { value: 'CONTROLE_PRAGAS', label: 'Controle de Pragas' },
  { value: 'HIGIENIZACAO_UTENSILIOS', label: 'Higienização' },
  { value: 'OUTRO', label: 'Outro' },
]

const FREQUENCIAS = [
  { value: '', label: 'Frequência' },
  { value: 'DIARIO', label: 'Diário' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'SOB_DEMANDA', label: 'Sob demanda' },
]

const STATUS = [
  { value: '', label: 'Status' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
]

interface ChecklistsClientProps {
  busca: string
  categoria: string
  frequencia: string
  status: string
}

export function ChecklistsClient({ busca, categoria, frequencia, status }: ChecklistsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const atualizar = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex flex-wrap gap-3">
      {/* Busca */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          defaultValue={busca}
          onKeyDown={(e) => {
            if (e.key === 'Enter') atualizar('busca', (e.target as HTMLInputElement).value)
          }}
          onBlur={(e) => atualizar('busca', e.target.value)}
          placeholder="Buscar checklists..."
          className="w-full h-9 pl-8 pr-3 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
        />
      </div>

      {/* Categoria */}
      <select
        value={categoria}
        onChange={(e) => atualizar('categoria', e.target.value)}
        className="h-9 px-3 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] text-neutral-700"
      >
        {CATEGORIAS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      {/* Frequência */}
      <select
        value={frequencia}
        onChange={(e) => atualizar('frequencia', e.target.value)}
        className="h-9 px-3 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] text-neutral-700"
      >
        {FREQUENCIAS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={status}
        onChange={(e) => atualizar('status', e.target.value)}
        className="h-9 px-3 text-sm border border-neutral-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] text-neutral-700"
      >
        {STATUS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  )
}
