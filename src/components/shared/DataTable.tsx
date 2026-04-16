'use client'

import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { ReactNode } from 'react'

export interface ColunaDef<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

interface DataTableProps<T> {
  colunas: ColunaDef<T>[]
  dados: T[]
  loading?: boolean
  emptyState?: ReactNode
  onRowClick?: (row: T) => void
  getRowKey: (row: T) => string
}

export function DataTable<T>({
  colunas,
  dados,
  loading,
  emptyState,
  onRowClick,
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#D5E3F0]">
      <table className="w-full text-sm min-w-[600px]">
        <thead>
          <tr className="bg-[#EEF4FD] border-b border-[#D5E3F0]">
            {colunas.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-bold text-[#0E2E60] uppercase tracking-wider',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[#D5E3F0]">
                {colunas.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-full rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : dados.length === 0 ? (
            <tr>
              <td colSpan={colunas.length} className="py-8">
                {emptyState ?? (
                  <p className="text-center text-sm text-[#5A7089]">Nenhum registro encontrado.</p>
                )}
              </td>
            </tr>
          ) : (
            dados.map((row, idx) => (
              <tr
                key={getRowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-[#D5E3F0] transition-colors',
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#F5F9FD]',
                  onRowClick && 'cursor-pointer hover:bg-[#EEF4FD]'
                )}
              >
                {colunas.map((col, colIdx) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      colIdx === 0 ? 'font-semibold text-[#0F1B2D]' : 'text-[#5A7089]',
                      col.className
                    )}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
