'use client'

import { useState, useEffect, useRef } from 'react'
import { Trash2, Save, ChevronDown, ChevronUp, Camera, AlertCircle, Layers } from 'lucide-react'
import type { ChecklistItem } from '@prisma/client'
import type { CriarItemInput } from '@/actions/checklist.actions'
import { OpcoesList } from './OpcoesList'
import { cn } from '@/lib/utils'

const TIPO_OPCOES = [
  { value: 'SIM_NAO',         label: 'Sim / Não',        descricao: 'Resposta binária + N/A' },
  { value: 'NUMERICO',        label: 'Numérico',          descricao: 'Valor com mínimo e máximo' },
  { value: 'TEXTO_LIVRE',     label: 'Texto livre',       descricao: 'Campo de observação' },
  { value: 'MULTIPLA_ESCOLHA',label: 'Múltipla escolha',  descricao: 'Selecionar uma opção' },
  { value: 'FOTO',            label: 'Foto',              descricao: 'Registro fotográfico' },
  { value: 'ESCALA',          label: 'Escala 1 – 5',      descricao: 'Nota de 1 a 5' },
] as const

interface ItemConfigPanelProps {
  item: ChecklistItem
  onSalvar: (data: Partial<CriarItemInput>) => Promise<void>
  onRemover: () => Promise<void>
  isSaving: boolean
  secoesDisponiveis?: string[]
}

export function ItemConfigPanel({ item, onSalvar, onRemover, isSaving, secoesDisponiveis = [] }: ItemConfigPanelProps) {
  const [pergunta, setPergunta] = useState(item.pergunta)
  const [descricao, setDescricao] = useState(item.descricao ?? '')
  const [tipoResposta, setTipoResposta] = useState(item.tipoResposta)
  const [obrigatorio, setObrigatorio] = useState(item.obrigatorio)
  const [isCritico, setIsCritico] = useState(item.isCritico)
  const [fotoObrigatoria, setFotoObrigatoria] = useState(item.fotoObrigatoria)
  const [valorMinimo, setValorMinimo] = useState<number | ''>(item.valorMinimo ?? '')
  const [valorMaximo, setValorMaximo] = useState<number | ''>(item.valorMaximo ?? '')
  const [unidade, setUnidade] = useState(item.unidade ?? '')
  const [opcoes, setOpcoes] = useState<string[]>(item.opcoes.length > 0 ? item.opcoes : ['', ''])
  const [peso, setPeso] = useState(item.peso)
  const [secao, setSecao] = useState((item as any).secao ?? '')
  const [descExpanded, setDescExpanded] = useState(!!item.descricao)
  const [confirmRemover, setConfirmRemover] = useState(false)
  const [novaSecao, setNovaSecao] = useState(false)

  const perguntaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when item changes
  useEffect(() => {
    setPergunta(item.pergunta)
    setDescricao(item.descricao ?? '')
    setTipoResposta(item.tipoResposta)
    setObrigatorio(item.obrigatorio)
    setIsCritico(item.isCritico)
    setFotoObrigatoria(item.fotoObrigatoria)
    setValorMinimo(item.valorMinimo ?? '')
    setValorMaximo(item.valorMaximo ?? '')
    setUnidade(item.unidade ?? '')
    setOpcoes(item.opcoes.length > 0 ? item.opcoes : ['', ''])
    setPeso(item.peso)
    setSecao((item as any).secao ?? '')
    setDescExpanded(!!item.descricao)
    setConfirmRemover(false)
    setNovaSecao(false)
  }, [item.id])

  // Auto-resize textarea
  useEffect(() => {
    const el = perguntaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 144) + 'px'
  }, [pergunta])

  function buildData(): Partial<CriarItemInput> {
    return {
      pergunta,
      descricao: descricao || undefined,
      tipoResposta,
      obrigatorio,
      isCritico,
      fotoObrigatoria: tipoResposta === 'FOTO' ? true : fotoObrigatoria,
      valorMinimo: valorMinimo !== '' ? Number(valorMinimo) : undefined,
      valorMaximo: valorMaximo !== '' ? Number(valorMaximo) : undefined,
      unidade: unidade || undefined,
      opcoes: tipoResposta === 'MULTIPLA_ESCOLHA' ? opcoes.filter(Boolean) : undefined,
      peso,
      secao: secao || undefined,
    }
  }

  async function handleSalvar() {
    await onSalvar(buildData())
  }

  async function handleRemover() {
    if (!confirmRemover) {
      setConfirmRemover(true)
      return
    }
    await onRemover()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex-1 space-y-5 p-5">
        {/* Pergunta */}
        <div>
          <label className="block text-xs font-bold text-[#0E2E60] uppercase tracking-wide mb-1.5">
            Pergunta <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={perguntaRef}
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Digite a pergunta..."
            rows={2}
            className="w-full px-3 py-2 text-sm border border-[#D5E3F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] resize-none leading-relaxed"
            style={{ minHeight: 64, maxHeight: 144 }}
          />
        </div>

        {/* Seção */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold text-[#0E2E60] uppercase tracking-wide mb-1.5">
            <Layers size={12} />
            Seção / Grupo
          </label>
          {!novaSecao ? (
            <div className="flex gap-2">
              <select
                value={secao}
                onChange={(e) => {
                  if (e.target.value === '__nova__') { setNovaSecao(true); setSecao('') }
                  else setSecao(e.target.value)
                }}
                className="flex-1 h-9 px-3 text-sm border border-[#D5E3F0] rounded-xl focus:outline-none focus:border-[#0E2E60] bg-white"
              >
                <option value="">Sem seção</option>
                {secoesDisponiveis.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="__nova__">+ Nova seção...</option>
              </select>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={secao}
                onChange={(e) => setSecao(e.target.value)}
                placeholder="Nome da seção (ex: Higiene Pessoal)"
                autoFocus
                className="flex-1 h-9 px-3 text-sm border border-[#D5E3F0] rounded-xl focus:outline-none focus:border-[#0E2E60]"
              />
              <button
                type="button"
                onClick={() => { setNovaSecao(false); if (!secoesDisponiveis.includes(secao)) {} }}
                className="text-xs px-2 py-1 rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#F5F9FD]"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => { setNovaSecao(false); setSecao('') }}
                className="text-xs px-2 py-1 rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#F5F9FD]"
              >
                ✕
              </button>
            </div>
          )}
          {secao && <p className="text-[10px] text-[#5A7089] mt-1">Item será agrupado em: <strong>{secao}</strong></p>}
        </div>

        {/* Descrição colapsável */}
        <div>
          <button
            type="button"
            onClick={() => setDescExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#5A7089] hover:text-[#0E2E60] transition-colors"
          >
            {descExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            Descrição / Texto de ajuda
          </button>
          {descExpanded && (
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Texto de apoio exibido para o inspetor..."
              rows={3}
              className="mt-2 w-full px-3 py-2 text-sm border border-[#D5E3F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] resize-none"
            />
          )}
        </div>

        {/* Tipo de resposta */}
        <div>
          <label className="block text-xs font-bold text-[#0E2E60] uppercase tracking-wide mb-2">
            Tipo de resposta <span className="text-red-500">*</span>
          </label>
          <div className="space-y-1.5">
            {TIPO_OPCOES.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all',
                  tipoResposta === opt.value
                    ? 'border-[#0E2E60] bg-[#EEF4FD]'
                    : 'border-neutral-200 hover:border-[#A8BDD4]'
                )}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={opt.value}
                  checked={tipoResposta === opt.value}
                  onChange={() => setTipoResposta(opt.value as typeof tipoResposta)}
                  className="accent-[#0E2E60]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#0F1B2D]">{opt.label}</p>
                  <p className="text-xs text-[#5A7089]">{opt.descricao}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Configurações específicas do tipo */}
        {tipoResposta === 'NUMERICO' && (
          <div className="p-3 bg-[#F5F9FD] rounded-xl border border-[#D5E3F0] space-y-3">
            <p className="text-xs font-bold text-[#0E2E60] uppercase tracking-wide">Configuração numérica</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#5A7089] mb-1">Valor mínimo *</label>
                <input
                  type="number"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full h-8 px-2 text-sm border border-[#D5E3F0] rounded-lg focus:outline-none focus:border-[#0E2E60]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5A7089] mb-1">Valor máximo *</label>
                <input
                  type="number"
                  value={valorMaximo}
                  onChange={(e) => setValorMaximo(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="100"
                  className="w-full h-8 px-2 text-sm border border-[#D5E3F0] rounded-lg focus:outline-none focus:border-[#0E2E60]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#5A7089] mb-1">Unidade (ex: °C, kg, ppm)</label>
              <input
                type="text"
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                placeholder="°C"
                maxLength={20}
                className="w-full h-8 px-2 text-sm border border-[#D5E3F0] rounded-lg focus:outline-none focus:border-[#0E2E60]"
              />
            </div>
          </div>
        )}

        {tipoResposta === 'MULTIPLA_ESCOLHA' && (
          <div className="p-3 bg-[#F5F9FD] rounded-xl border border-[#D5E3F0]">
            <p className="text-xs font-bold text-[#0E2E60] uppercase tracking-wide mb-3">Opções</p>
            <OpcoesList opcoes={opcoes} onChange={setOpcoes} />
          </div>
        )}

        {tipoResposta === 'ESCALA' && (
          <div className="p-3 bg-[#F5F9FD] rounded-xl border border-[#D5E3F0]">
            <p className="text-xs font-bold text-[#0E2E60] uppercase tracking-wide mb-2">Escala 1 – 5</p>
            <p className="text-xs text-[#5A7089]">O inspetor escolhe uma nota de 1 (ruim) a 5 (ótimo).</p>
          </div>
        )}

        {/* Opções do item */}
        <div className="p-3 bg-[#F5F9FD] rounded-xl border border-[#D5E3F0]">
          <p className="text-xs font-bold text-[#0E2E60] uppercase tracking-wide mb-3">Opções do item</p>
          <div className="space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={obrigatorio}
                onChange={(e) => setObrigatorio(e.target.checked)}
                className="w-4 h-4 accent-[#0E2E60] rounded"
              />
              <span className="text-sm text-[#0F1B2D]">Obrigatório</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isCritico}
                onChange={(e) => setIsCritico(e.target.checked)}
                className="w-4 h-4 accent-[#DC2626] rounded"
              />
              <span className="text-sm text-[#0F1B2D] flex items-center gap-1.5">
                <AlertCircle size={13} className="text-red-500" />
                Item crítico
              </span>
            </label>
            <label className={cn('flex items-center gap-2.5', tipoResposta === 'FOTO' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer')}>
              <input
                type="checkbox"
                checked={tipoResposta === 'FOTO' ? true : fotoObrigatoria}
                disabled={tipoResposta === 'FOTO'}
                onChange={(e) => setFotoObrigatoria(e.target.checked)}
                className="w-4 h-4 accent-[#0E2E60] rounded"
              />
              <span className="text-sm text-[#0F1B2D] flex items-center gap-1.5">
                <Camera size={13} className="text-blue-500" />
                Foto obrigatória
                {tipoResposta === 'FOTO' && <span className="text-xs text-[#5A7089]">(sempre)</span>}
              </span>
            </label>
          </div>
        </div>

        {/* Peso */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-[#0E2E60] uppercase tracking-wide">
              Peso na pontuação
            </label>
            <span className="text-sm font-bold text-[#0E2E60]">{peso.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={3.0}
            step={0.5}
            value={peso}
            onChange={(e) => setPeso(parseFloat(e.target.value))}
            className="w-full accent-[#0E2E60]"
          />
          <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
            <span>0.5× (menor)</span>
            <span>3.0× (maior)</span>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="p-4 border-t border-neutral-100 flex items-center justify-between gap-3">
        <button
          onClick={handleRemover}
          disabled={isSaving}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
            confirmRemover
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'border border-red-200 text-red-600 hover:bg-red-50'
          )}
        >
          <Trash2 size={14} />
          {confirmRemover ? 'Confirmar remoção' : 'Remover'}
        </button>

        <button
          onClick={handleSalvar}
          disabled={isSaving || !pergunta.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0E2E60] text-white rounded-xl text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? 'Salvando...' : 'Salvar item'}
        </button>
      </div>
    </div>
  )
}
