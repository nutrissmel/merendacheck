'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { EscolaHeader } from './EscolaHeader'
import { AbaVisaoGeral } from './AbaVisaoGeral'
import { AbaInspecoes } from './AbaInspecoes'
import { AbaNaoConformidades } from './AbaNaoConformidades'
import { AbaEquipe } from './AbaEquipe'
import type { EscolaDetalhada } from '@/types/escola'
import type { AuthUser } from '@/lib/auth'
import type { PeriodoDetalhes } from '@/actions/escola-detalhe.actions'

type Aba = 'visao-geral' | 'inspecoes' | 'nao-conformidades' | 'equipe'

const ABAS: { id: Aba; label: string }[] = [
  { id: 'visao-geral', label: 'Visão Geral' },
  { id: 'inspecoes', label: 'Inspeções' },
  { id: 'nao-conformidades', label: 'Não Conformidades' },
  { id: 'equipe', label: 'Equipe' },
]

const PERIODOS: { value: PeriodoDetalhes; label: string }[] = [
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
]

interface EscolaDetalheClientProps {
  escola: EscolaDetalhada
  user: AuthUser
  periodo: PeriodoDetalhes
  abaAtiva: string
  podeEditar: boolean
  podeDesativar: boolean
  kpis: any
  evolucao: any[]
  calendario: any
  comparativo: any
  comparativoChecklists: any[]
  ncs: any[]
  inspecoes: any
}

export function EscolaDetalheClient({
  escola,
  user,
  periodo,
  abaAtiva,
  podeEditar,
  podeDesativar,
  kpis,
  evolucao,
  calendario,
  comparativo,
  comparativoChecklists,
  ncs,
  inspecoes,
}: EscolaDetalheClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [exportando, setExportando] = useState(false)

  function navegarAba(aba: Aba) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('aba', aba)
    router.replace(`/escolas/${escola.id}?${params.toString()}`)
  }

  function navegarPeriodo(p: PeriodoDetalhes) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('periodo', p)
    router.replace(`/escolas/${escola.id}?${params.toString()}`)
  }

  async function exportarPDF() {
    setExportando(true)
    // Redireciona para /relatorios com filtros pré-selecionados
    // Sprint 16 implementará a geração real do PDF
    setTimeout(() => {
      router.push(`/relatorios?escola=${escola.id}&periodo=${periodo}`)
      setExportando(false)
    }, 800)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-0">
      {/* Barra de navegação superior */}
      <div className="flex items-center justify-between mb-5">
        <Link
          href="/escolas"
          className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para escolas
        </Link>
        <div className="flex items-center gap-2">
          {/* Select de período */}
          <select
            value={periodo}
            onChange={(e) => navegarPeriodo(e.target.value as PeriodoDetalhes)}
            className="h-8 rounded-lg border border-[#D5E3F0] bg-white px-2.5 text-xs text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 cursor-pointer"
          >
            {PERIODOS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {/* Exportar PDF */}
          <button
            onClick={exportarPDF}
            disabled={exportando}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg border border-[#D5E3F0] bg-white text-xs font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors disabled:opacity-60"
          >
            {exportando ? (
              <><Loader2 size={12} className="animate-spin" /> Gerando PDF...</>
            ) : (
              <><Download size={12} /> Exportar relatório</>
            )}
          </button>
        </div>
      </div>

      {/* Header rico */}
      <EscolaHeader
        escola={escola}
        kpis={kpis}
        podeEditar={podeEditar}
        podeDesativar={podeDesativar}
      />

      {/* Abas */}
      <div className="mt-6">
        <div className="flex gap-1 border-b border-[#D5E3F0] mb-6">
          {ABAS.map((aba) => (
            <button
              key={aba.id}
              onClick={() => navegarAba(aba.id)}
              className={`px-4 py-2.5 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
                abaAtiva === aba.id
                  ? 'border-[#0E2E60] text-[#0E2E60] bg-white'
                  : 'border-transparent text-[#5A7089] hover:text-[#0E2E60] hover:bg-[#EEF4FD]'
              }`}
            >
              {aba.label}
              {aba.id === 'nao-conformidades' && ncs.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626] rounded-full">
                  {ncs.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba */}
        {abaAtiva === 'visao-geral' && (
          <AbaVisaoGeral
            escolaId={escola.id}
            evolucao={evolucao}
            calendario={calendario}
            comparativo={comparativo}
            comparativoChecklists={comparativoChecklists}
            periodo={periodo}
          />
        )}
        {abaAtiva === 'inspecoes' && (
          <AbaInspecoes
            escolaId={escola.id}
            escolaNome={escola.nome}
            inspecoes={inspecoes}
            periodo={periodo}
          />
        )}
        {abaAtiva === 'nao-conformidades' && (
          <AbaNaoConformidades ncs={ncs} />
        )}
        {abaAtiva === 'equipe' && (
          <AbaEquipe
            escolaId={escola.id}
            nomeEscola={escola.nome}
            usuarios={escola.usuarios}
            podeEditar={podeEditar}
          />
        )}
      </div>
    </div>
  )
}
