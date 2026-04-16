'use client'

import { useState, useTransition } from 'react'
import { criarAcaoAction, atualizarAcaoAction, type AcaoCompletada } from '@/actions/naoConformidade.actions'
import { PrioridadeBadge } from './PrioridadeBadge'
import { X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Prioridade } from '@prisma/client'

interface Usuario {
  id: string
  nome: string
  email: string
}

interface ModalAcaoProps {
  ncId: string
  tituloNC: string
  acao?: AcaoCompletada // edit mode
  usuarios: Usuario[]
  onClose: () => void
  onSalvo: () => void
}

const PRIORIDADES: Prioridade[] = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE']

const TAP: React.CSSProperties = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
}

export function ModalAcao({ ncId, tituloNC, acao, usuarios, onClose, onSalvo }: ModalAcaoProps) {
  const [descricao, setDescricao] = useState(acao?.descricao ?? '')
  const [responsavelId, setResponsavelId] = useState(acao?.responsavel?.id ?? '')
  const [prazo, setPrazo] = useState(
    acao?.prazo ? new Date(acao.prazo).toISOString().split('T')[0] : ''
  )
  const [prioridade, setPrioridade] = useState<Prioridade>(acao?.prioridade ?? 'MEDIA')
  const [buscaUsuario, setBuscaUsuario] = useState('')
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [isPending, startTransition] = useTransition()

  const usuariosFiltrados = usuarios.filter((u) =>
    u.nome.toLowerCase().includes(buscaUsuario.toLowerCase()) ||
    u.email.toLowerCase().includes(buscaUsuario.toLowerCase())
  )

  const responsavelSelecionado = usuarios.find((u) => u.id === responsavelId)

  const handleSalvar = () => {
    if (descricao.trim().length < 10) {
      toast.error('Descreva a ação com pelo menos 10 caracteres')
      return
    }

    startTransition(async () => {
      const data = {
        descricao: descricao.trim(),
        responsavelId: responsavelId || undefined,
        prazo: prazo ? new Date(prazo) : undefined,
        prioridade,
      }

      const result = acao
        ? await atualizarAcaoAction(acao.id, data)
        : await criarAcaoAction(ncId, data)

      if ('erro' in result) {
        toast.error(result.erro)
        return
      }

      if (responsavelSelecionado) {
        toast.success(`Ação ${acao ? 'atualizada' : 'criada'}. ${responsavelSelecionado.nome} foi notificado por e-mail ✓`)
      } else {
        toast.info(`Ação ${acao ? 'atualizada' : 'criada'} sem responsável definido`)
      }

      onSalvo()
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-acao-titulo"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#D5E3F0] flex items-start justify-between shrink-0">
            <div>
              <h2 id="modal-acao-titulo" className="text-base font-bold text-[#0F1B2D]">
                {acao ? 'Editar ação corretiva' : 'Nova ação corretiva'}
              </h2>
              <p className="text-xs text-[#5A7089] mt-0.5 truncate max-w-xs">NC: {tituloNC}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#5A7089] hover:text-[#0F1B2D] transition-colors ml-4 shrink-0"
              style={TAP}
              aria-label="Fechar modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
            {/* Descrição */}
            <div>
              <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                O que deve ser feito? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva a ação corretiva com detalhes suficientes para o responsável executá-la..."
                rows={3}
                maxLength={500}
                className="w-full rounded-xl border border-[#D5E3F0] bg-[#F5F9FD] px-3 py-2.5 text-sm text-[#0F1B2D] placeholder:text-[#A8BDD4] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] resize-none"
              />
              <p className="text-xs text-[#A8BDD4] text-right mt-1">{descricao.length}/500</p>
            </div>

            {/* Responsável */}
            <div>
              <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                Responsável
              </label>
              {responsavelSelecionado && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-[#EEF4FD] rounded-xl border border-[#D9E8FA]">
                  <div className="w-7 h-7 rounded-full bg-[#0E2E60]/10 flex items-center justify-center text-xs font-bold text-[#0E2E60]">
                    {responsavelSelecionado.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F1B2D] truncate">{responsavelSelecionado.nome}</p>
                    <p className="text-xs text-[#5A7089] truncate">{responsavelSelecionado.email}</p>
                  </div>
                  <button
                    onClick={() => setResponsavelId('')}
                    className="text-[#5A7089] hover:text-[#DC2626]"
                    style={TAP}
                    aria-label="Remover responsável"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  placeholder={usuarios.length === 0 ? 'Nenhum usuário disponível' : 'Buscar ou selecionar usuário...'}
                  value={buscaUsuario}
                  onChange={(e) => setBuscaUsuario(e.target.value)}
                  onFocus={() => setDropdownAberto(true)}
                  onBlur={() => setTimeout(() => setDropdownAberto(false), 150)}
                  disabled={usuarios.length === 0}
                  className="w-full rounded-xl border border-[#D5E3F0] bg-[#F5F9FD] px-3 py-2.5 text-sm text-[#0F1B2D] placeholder:text-[#A8BDD4] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {dropdownAberto && usuarios.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full border border-[#D5E3F0] rounded-xl overflow-hidden bg-white shadow-lg max-h-44 overflow-y-auto">
                    {usuariosFiltrados.length === 0 ? (
                      <p className="px-3 py-3 text-xs text-[#5A7089] text-center">Nenhum usuário encontrado para "{buscaUsuario}"</p>
                    ) : (
                      usuariosFiltrados.map((u) => (
                        <button
                          key={u.id}
                          onMouseDown={() => { setResponsavelId(u.id); setBuscaUsuario(''); setDropdownAberto(false) }}
                          className="w-full px-3 py-2.5 text-left hover:bg-[#EEF4FD] transition-colors flex items-center gap-2.5 border-b border-[#F0F7FF] last:border-0"
                          style={TAP}
                        >
                          <div className="w-7 h-7 rounded-full bg-[#0E2E60]/10 flex items-center justify-center text-xs font-bold text-[#0E2E60] shrink-0">
                            {u.nome.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-[#0F1B2D] font-medium truncate">{u.nome}</p>
                            <p className="text-xs text-[#5A7089] truncate">{u.email}</p>
                          </div>
                          {u.id === responsavelId && (
                            <span className="ml-auto text-[10px] font-bold text-[#0E2E60] bg-[#EEF4FD] px-1.5 py-0.5 rounded shrink-0">selecionado</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Prazo + Prioridade */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">Prazo</label>
                <input
                  type="date"
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-[#D5E3F0] bg-[#F5F9FD] px-3 py-2.5 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 focus:border-[#0E2E60]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#0F1B2D] mb-1.5">
                  Prioridade <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-col gap-1">
                  {PRIORIDADES.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPrioridade(p)}
                      className={`px-3 py-1.5 rounded-lg text-left text-xs font-semibold border transition-all ${
                        prioridade === p
                          ? 'ring-2 ring-[#0E2E60] ring-offset-1'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={TAP}
                    >
                      <PrioridadeBadge prioridade={p} size="sm" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#D5E3F0] flex gap-3 shrink-0">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[#D5E3F0] text-sm font-semibold text-[#5A7089] hover:bg-[#F5F9FD] transition-colors"
              style={TAP}
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={isPending || descricao.trim().length < 10}
              className="flex-1 h-10 rounded-xl bg-[#0E2E60] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#133878] disabled:opacity-50 transition-colors"
              style={TAP}
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {acao ? 'Atualizar' : 'Salvar e notificar →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
