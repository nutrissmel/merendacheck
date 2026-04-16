'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, FileText, Loader2 } from 'lucide-react'
import {
  criarChecklistAction,
  criarAPartirDeTemplateAction,
  type ChecklistComContagem,
} from '@/actions/checklist.actions'
import { CATEGORIA_CONFIG, FREQUENCIA_LABEL } from '@/components/checklists/CategoriaConfig'
import { CategoriaBadge } from '@/components/checklists/CategoriaBadge'
import { toast } from 'sonner'
import type { CategoriaChecklist, Frequencia } from '@prisma/client'

const CATEGORIAS = Object.entries(CATEGORIA_CONFIG) as [CategoriaChecklist, typeof CATEGORIA_CONFIG[CategoriaChecklist]][]
const FREQUENCIAS: { value: Frequencia; label: string }[] = Object.entries(FREQUENCIA_LABEL).map(
  ([value, label]) => ({ value: value as Frequencia, label })
)

type Etapa = 'escolha' | 'templates' | 'formulario'

interface FormData {
  nome: string
  descricao: string
  categoria: CategoriaChecklist
  frequencia: Frequencia
}

interface NovoChecklistClientProps {
  templates: ChecklistComContagem[]
}

export function NovoChecklistClient({ templates }: NovoChecklistClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [etapa, setEtapa] = useState<Etapa>('escolha')
  const [form, setForm] = useState<FormData>({
    nome: '',
    descricao: '',
    categoria: 'OUTRO',
    frequencia: 'SEMANAL',
  })

  function selecionarTemplate(templateId: string, templateNome: string) {
    startTransition(async () => {
      const result = await criarAPartirDeTemplateAction(templateId)
      if ('erro' in result) {
        toast.error(result.erro)
        return
      }
      toast.success(`Checklist baseado em "${templateNome}" criado!`)
      router.push(`/checklists/${result.checklistId}/editar`)
    })
  }

  function handleCriar(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim() || form.nome.trim().length < 3) {
      toast.error('Nome deve ter pelo menos 3 caracteres')
      return
    }
    startTransition(async () => {
      const result = await criarChecklistAction(form)
      if ('erro' in result) {
        toast.error(result.erro)
        return
      }
      toast.success('Checklist criado!')
      router.push(`/checklists/${result.checklistId}/editar`)
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        {etapa !== 'escolha' ? (
          <button
            onClick={() => setEtapa('escolha')}
            className="flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        ) : (
          <Link
            href="/checklists"
            className="flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
          >
            <ArrowLeft size={14} /> Checklists
          </Link>
        )}
        <span className="text-sm text-neutral-300">/</span>
        <span className="text-sm font-semibold text-[#0E2E60]">Novo Checklist</span>
      </div>

      {/* ── ETAPA: Escolha ── */}
      {etapa === 'escolha' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">Como você quer começar?</h1>
            <p className="text-sm text-[#5A7089] mt-1">Escolha um ponto de partida para o seu checklist.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#0E2E60] hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#EEF4FD] flex items-center justify-center">
                <ClipboardList size={24} className="text-[#0E2E60]" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#0F1B2D] font-heading">Do zero</h2>
                <p className="text-sm text-[#5A7089] mt-1">
                  Crie seu checklist completamente personalizado do início.
                </p>
              </div>
              <button
                onClick={() => setEtapa('formulario')}
                className="mt-auto px-4 py-2.5 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors"
              >
                Começar do zero
              </button>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-[#0E2E60] hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#D1F7E2] flex items-center justify-center">
                <FileText size={24} className="text-[#00963A]" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-[#0F1B2D] font-heading">De um template PNAE</h2>
                <p className="text-sm text-[#5A7089] mt-1">
                  Use um dos {templates.length} templates oficiais como base e personalize.
                </p>
              </div>
              <button
                onClick={() => setEtapa('templates')}
                className="mt-auto px-4 py-2.5 border border-[#0E2E60] text-[#0E2E60] text-sm font-semibold rounded-xl hover:bg-[#EEF4FD] transition-colors"
              >
                Ver templates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ETAPA: Grid de templates ── */}
      {etapa === 'templates' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">Escolha um template PNAE</h1>
            <p className="text-sm text-[#5A7089] mt-1">
              Uma cópia completa será criada para o seu município. Você poderá editar todos os itens.
            </p>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-[#5A7089]">
              <Loader2 size={16} className="animate-spin" />
              Criando checklist...
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => {
              const config = CATEGORIA_CONFIG[template.categoria]
              const Icone = config.icone
              return (
                <button
                  key={template.id}
                  onClick={() => selecionarTemplate(template.id, template.nome)}
                  disabled={isPending}
                  className="bg-white border border-neutral-200 rounded-xl p-4 text-left hover:border-[#0E2E60] hover:shadow-md transition-all disabled:opacity-60"
                  style={{ borderLeftWidth: 4, borderLeftColor: config.cor }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: config.corFundo }}
                  >
                    <Icone size={18} style={{ color: config.cor }} />
                  </div>
                  <p className="font-bold text-sm text-[#0F1B2D] font-heading">{template.nome}</p>
                  <p className="text-xs text-[#5A7089] mt-1">{template.totalItens} itens · {template.itensCriticos} críticos</p>
                  {template.descricao && (
                    <p className="text-xs text-[#5A7089] mt-1 line-clamp-2">{template.descricao}</p>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── ETAPA: Formulário do zero ── */}
      {etapa === 'formulario' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">Novo checklist</h1>
            <p className="text-sm text-[#5A7089] mt-1">
              Preencha as informações básicas. Você poderá adicionar itens no builder.
            </p>
          </div>

          <form onSubmit={handleCriar} className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Controle de Temperatura — Cozinha Central"
                maxLength={150}
                required
                autoFocus
                className="w-full h-10 px-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                Descrição <span className="text-[#5A7089] font-normal">(opcional)</span>
              </label>
              <textarea
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                placeholder="Descreva o objetivo deste checklist..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.categoria}
                  onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as CategoriaChecklist }))}
                  className="w-full h-10 px-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
                >
                  {CATEGORIAS.map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                  Frequência <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.frequencia}
                  onChange={(e) => setForm((f) => ({ ...f, frequencia: e.target.value as Frequencia }))}
                  className="w-full h-10 px-3 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
                >
                  {FREQUENCIAS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#5A7089]">
              <span>Preview:</span>
              <CategoriaBadge categoria={form.categoria} size="sm" />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/checklists"
                className="px-4 py-2 border border-neutral-200 text-sm text-[#5A7089] rounded-xl hover:border-[#0E2E60] hover:text-[#0E2E60] transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isPending || !form.nome.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-[#0E2E60] text-white text-sm font-semibold rounded-xl hover:bg-[#133878] transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Criar e abrir o builder →
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
