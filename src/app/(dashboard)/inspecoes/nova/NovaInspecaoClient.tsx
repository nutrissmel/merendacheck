'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, ArrowRight, School, ClipboardList,
  Search, Shield, AlertCircle, CheckCircle2,
} from 'lucide-react'
import { iniciarInspecaoAction } from '@/actions/inspecao.actions'
import { CATEGORIA_CONFIG, FREQUENCIA_LABEL } from '@/components/checklists/CategoriaConfig'
import { gerarClienteId } from '@/lib/utils'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { CategoriaChecklist, Frequencia } from '@prisma/client'

type Escola = {
  id: string
  nome: string
  cidade: string | null
  bairro: string | null
}

type ChecklistOpcao = {
  id: string
  nome: string
  categoria: CategoriaChecklist
  frequencia: Frequencia
  isTemplate: boolean
  totalItens: number
}

interface Props {
  escolas: Escola[]
  checklists: ChecklistOpcao[]
  escolaIdInicial?: string
  checklistIdInicial?: string
}

type Step = 'escola' | 'checklist' | 'confirmar'

export function NovaInspecaoClient({ escolas, checklists, escolaIdInicial, checklistIdInicial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>(escolaIdInicial && checklistIdInicial ? 'confirmar' : escolaIdInicial ? 'checklist' : 'escola')
  const [escolaId, setEscolaId] = useState(escolaIdInicial ?? '')
  const [checklistId, setChecklistId] = useState(checklistIdInicial ?? '')
  const [buscaEscola, setBuscaEscola] = useState('')
  const [buscaChecklist, setBuscaChecklist] = useState('')

  const escolaSelecionada = escolas.find((e) => e.id === escolaId)
  const checklistSelecionado = checklists.find((c) => c.id === checklistId)

  const escolasFiltradas = escolas.filter(
    (e) =>
      e.nome.toLowerCase().includes(buscaEscola.toLowerCase()) ||
      e.cidade?.toLowerCase().includes(buscaEscola.toLowerCase())
  )

  const checklistsFiltrados = checklists.filter(
    (c) =>
      c.nome.toLowerCase().includes(buscaChecklist.toLowerCase()) ||
      CATEGORIA_CONFIG[c.categoria].label.toLowerCase().includes(buscaChecklist.toLowerCase())
  )

  function selecionarEscola(id: string) {
    setEscolaId(id)
    setStep('checklist')
  }

  function selecionarChecklist(id: string) {
    setChecklistId(id)
    setStep('confirmar')
  }

  function iniciar() {
    startTransition(async () => {
      const clienteId = gerarClienteId()
      const result = await iniciarInspecaoAction({ escolaId, checklistId, clienteId })

      if ('erro' in result) {
        toast.error(result.erro)
        return
      }

      if (result.inspecaoExistenteId) {
        toast.info('Você tem uma inspeção em andamento para esta escola. Retomando...')
      } else if (result.jaAplicadoHoje) {
        toast.warning('Este checklist já foi aplicado hoje nesta escola.')
      }

      router.push(`/inspecoes/${result.inspecaoId}/responder`)
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => {
          if (step === 'checklist') setStep('escola')
          else if (step === 'confirmar') setStep('checklist')
          else router.push('/inspecoes')
        }}
        className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] transition-colors"
      >
        <ArrowLeft size={14} /> {step === 'escola' ? 'Inspeções' : 'Voltar'}
      </button>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {(['escola', 'checklist', 'confirmar'] as Step[]).map((s, i) => {
          const labels = ['Escola', 'Checklist', 'Confirmar']
          const done = ['escola', 'checklist', 'confirmar'].indexOf(step) > i
          const active = step === s
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                done ? 'bg-[#00963A] text-white' : active ? 'bg-[#0E2E60] text-white' : 'bg-neutral-200 text-neutral-500'
              )}>
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span className={cn('text-sm font-medium', active ? 'text-[#0E2E60]' : done ? 'text-[#00963A]' : 'text-neutral-400')}>
                {labels[i]}
              </span>
              {i < 2 && <div className={cn('flex-1 h-px', done ? 'bg-[#00963A]' : 'bg-neutral-200')} />}
            </div>
          )
        })}
      </div>

      {/* Step: Escola */}
      {step === 'escola' && (
        <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="font-semibold text-[#0F1B2D] font-heading flex items-center gap-2">
              <School size={18} className="text-[#0E2E60]" /> Selecionar Escola
            </h2>
            <p className="text-sm text-[#5A7089] mt-0.5">{escolas.length} escola{escolas.length !== 1 ? 's' : ''} disponível{escolas.length !== 1 ? 'is' : ''}</p>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-neutral-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A7089]" />
              <input
                type="text"
                placeholder="Buscar escola..."
                value={buscaEscola}
                onChange={(e) => setBuscaEscola(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#D5E3F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
              />
            </div>
          </div>

          <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
            {escolasFiltradas.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400 italic text-center">Nenhuma escola encontrada.</p>
            ) : (
              escolasFiltradas.map((escola) => (
                <button
                  key={escola.id}
                  onClick={() => selecionarEscola(escola.id)}
                  className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-[#EEF4FD] transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#0F1B2D]">{escola.nome}</p>
                    {(escola.cidade || escola.bairro) && (
                      <p className="text-xs text-[#5A7089]">
                        {[escola.bairro, escola.cidade].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={15} className="text-[#5A7089] shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step: Checklist */}
      {step === 'checklist' && (
        <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h2 className="font-semibold text-[#0F1B2D] font-heading flex items-center gap-2">
              <ClipboardList size={18} className="text-[#0E2E60]" /> Selecionar Checklist
            </h2>
            <p className="text-sm text-[#5A7089] mt-0.5">
              Escola: <span className="font-semibold text-[#0F1B2D]">{escolaSelecionada?.nome}</span>
            </p>
          </div>

          <div className="px-5 py-3 border-b border-neutral-100">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5A7089]" />
              <input
                type="text"
                placeholder="Buscar checklist..."
                value={buscaChecklist}
                onChange={(e) => setBuscaChecklist(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-[#D5E3F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
              />
            </div>
          </div>

          <div className="divide-y divide-neutral-100 max-h-[400px] overflow-y-auto">
            {checklistsFiltrados.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400 italic text-center">Nenhum checklist encontrado.</p>
            ) : (
              checklistsFiltrados.map((cl) => {
                const catConfig = CATEGORIA_CONFIG[cl.categoria]
                return (
                  <button
                    key={cl.id}
                    onClick={() => selecionarChecklist(cl.id)}
                    className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-3 hover:bg-[#EEF4FD] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-full min-h-[2rem] rounded-full shrink-0"
                        style={{ backgroundColor: catConfig.cor }}
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-[#0F1B2D]">{cl.nome}</p>
                          {cl.isTemplate && (
                            <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#0E2E60] bg-[#EEF4FD] px-1.5 py-0.5 rounded">
                              <Shield size={9} /> Template
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#5A7089]">
                          {catConfig.label} · {FREQUENCIA_LABEL[cl.frequencia]} · {cl.totalItens} itens
                        </p>
                      </div>
                    </div>
                    <ArrowRight size={15} className="text-[#5A7089] shrink-0" />
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Step: Confirmar */}
      {step === 'confirmar' && escolaSelecionada && checklistSelecionado && (
        <div className="space-y-4">
          <div className="bg-white border border-[#D5E3F0] rounded-xl p-5">
            <h2 className="font-semibold text-[#0F1B2D] font-heading mb-4">Confirmar Inspeção</h2>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[#F8FAFD] rounded-lg">
                <School size={16} className="text-[#0E2E60] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#5A7089] font-medium uppercase tracking-wide">Escola</p>
                  <p className="text-sm font-semibold text-[#0F1B2D]">{escolaSelecionada.nome}</p>
                  {(escolaSelecionada.cidade || escolaSelecionada.bairro) && (
                    <p className="text-xs text-[#5A7089]">
                      {[escolaSelecionada.bairro, escolaSelecionada.cidade].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-[#F8FAFD] rounded-lg">
                <ClipboardList size={16} className="text-[#0E2E60] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-[#5A7089] font-medium uppercase tracking-wide">Checklist</p>
                  <p className="text-sm font-semibold text-[#0F1B2D]">{checklistSelecionado.nome}</p>
                  <p className="text-xs text-[#5A7089]">
                    {CATEGORIA_CONFIG[checklistSelecionado.categoria].label} · {checklistSelecionado.totalItens} itens
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertCircle size={15} className="shrink-0" />
            Verifique os dados antes de iniciar. A inspeção será salva automaticamente conforme você responde.
          </div>

          <button
            onClick={iniciar}
            disabled={isPending}
            className="w-full py-3 bg-[#0E2E60] text-white font-semibold rounded-xl hover:bg-[#133878] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? 'Iniciando...' : 'Iniciar Inspeção →'}
          </button>
        </div>
      )}
    </div>
  )
}
