import Link from 'next/link'
import { getServerUser } from '@/lib/auth'
import { listarChecklists } from '@/actions/checklist.actions'
import { ChecklistCard } from '@/components/checklists/ChecklistCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { ListChecks, Plus } from 'lucide-react'
import type { CategoriaChecklist, Frequencia } from '@prisma/client'
import { ChecklistsClient } from './ChecklistsClient'

export default async function ChecklistsPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; categoria?: string; frequencia?: string; aba?: string; status?: string }>
}) {
  const params = await searchParams
  const user = await getServerUser()
  const podeEditar = ['ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN'].includes(user.papel)

  const aba = params.aba ?? 'todos'
  const busca = params.busca?.trim() || undefined
  const categoria = params.categoria as CategoriaChecklist | undefined
  const frequencia = params.frequencia as Frequencia | undefined
  const ativo = params.status === 'ativo' ? true : params.status === 'inativo' ? false : undefined

  const [todos, templates, proprios] = await Promise.all([
    listarChecklists({ busca, categoria, frequencia, ativo }),
    listarChecklists({ apenasTemplates: true }),
    listarChecklists({ apenasPropriosTenant: true }),
  ])

  const listaAtual =
    aba === 'templates' ? todos.filter((c) => c.isTemplate) :
    aba === 'proprios'  ? todos.filter((c) => !c.isTemplate) :
    todos

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0F1B2D] font-heading">Checklists</h1>
          <p className="text-sm text-[#5A7089] mt-1">Gerencie os modelos de inspeção do município</p>
        </div>
        {podeEditar && (
          <Link
            href="/checklists/novo"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors"
          >
            <Plus size={16} />
            Novo Checklist
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-neutral-200 overflow-x-auto">
        {[
          { value: 'todos',     label: `Todos (${todos.length})` },
          { value: 'templates', label: `Templates PNAE (${templates.length})` },
          { value: 'proprios',  label: `Meus checklists (${proprios.length})` },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`?aba=${tab.value}`}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              aba === tab.value
                ? 'border-[#0E2E60] text-[#0E2E60]'
                : 'border-transparent text-[#5A7089] hover:text-[#0E2E60]'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Filtros (Client Component) */}
      <ChecklistsClient
        busca={params.busca ?? ''}
        categoria={params.categoria ?? ''}
        frequencia={params.frequencia ?? ''}
        status={params.status ?? ''}
      />

      {/* Grid de cards */}
      {listaAtual.length === 0 ? (
        <EmptyState
          icone={ListChecks}
          titulo="Nenhum checklist encontrado"
          descricao={podeEditar ? 'Crie seu primeiro checklist ou ajuste os filtros.' : 'Nenhum checklist disponível no momento.'}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {listaAtual.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              podeEditar={podeEditar}
            />
          ))}
        </div>
      )}
    </div>
  )
}
