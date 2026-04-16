'use client'

import { useState } from 'react'
import { Shield, Download, UserX, Trash2, ExternalLink, Loader2, CheckCircle2 } from 'lucide-react'
import {
  solicitarExportacaoDadosAction,
  anonimizarUsuarioAction,
  solicitarExclusaoMunicipioAction,
  buscarUsuariosParaAnonimizarAction,
} from '@/actions/lgpd.actions'
import { toast } from 'sonner'
import Link from 'next/link'

interface Usuario {
  id: string
  nome: string
  email: string
  papel: string
}

interface Props {
  usuarios: Usuario[]
  nomeTenant: string
}

export function SecaoLGPD({ usuarios, nomeTenant }: Props) {
  const [exportando, setExportando] = useState(false)
  const [exportado, setExportado] = useState(false)
  const [usuarioSelecionado, setUsuarioSelecionado] = useState('')
  const [confirmacaoAnon, setConfirmacaoAnon] = useState('')
  const [anonimizando, setAnonimizando] = useState(false)
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState('')
  const [solicitandoExclusao, setSolicitandoExclusao] = useState(false)
  const [prazoExclusao, setPrazoExclusao] = useState<Date | null>(null)

  async function handleExportar() {
    setExportando(true)
    const res = await solicitarExportacaoDadosAction()
    setExportando(false)
    if (res.sucesso) {
      setExportado(true)
      toast.success(res.mensagem)
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao solicitar exportação')
    }
  }

  async function handleAnonimizar() {
    if (!usuarioSelecionado) { toast.error('Selecione um usuário'); return }
    if (confirmacaoAnon !== 'CONFIRMAR') { toast.error('Digite CONFIRMAR no campo'); return }

    setAnonimizando(true)
    const res = await anonimizarUsuarioAction(usuarioSelecionado, confirmacaoAnon)
    setAnonimizando(false)

    if (res.sucesso) {
      toast.success('Usuário anonimizado com sucesso')
      setUsuarioSelecionado('')
      setConfirmacaoAnon('')
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao anonimizar')
    }
  }

  async function handleSolicitarExclusao() {
    if (confirmacaoExclusao !== nomeTenant) {
      toast.error(`Digite o nome exato: "${nomeTenant}"`)
      return
    }

    setSolicitandoExclusao(true)
    const res = await solicitarExclusaoMunicipioAction(confirmacaoExclusao)
    setSolicitandoExclusao(false)

    if (res.sucesso) {
      setPrazoExclusao(res.prazoExclusao)
      toast.success('Solicitação registrada. Entraremos em contato.')
    } else {
      toast.error('erro' in res ? res.erro : 'Erro ao solicitar exclusão')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-[#0F1B2D] font-heading flex items-center gap-2">
          <Shield size={16} className="text-[#0E2E60]" />
          Proteção de Dados (LGPD)
        </h2>
        <p className="text-sm text-[#5A7089] mt-0.5">Lei Geral de Proteção de Dados Pessoais — Lei 13.709/2018</p>
      </div>

      {/* Exportação de dados */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Exportação de dados pessoais</h3>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-[#5A7089]">
            Baixe todos os dados pessoais armazenados no sistema. O arquivo inclui usuários, inspeções e logs de auditoria.
          </p>

          {exportado ? (
            <div className="flex items-center gap-2 text-[#00963A] text-sm font-semibold">
              <CheckCircle2 size={16} />
              Solicitação registrada — verifique seu e-mail em breve
            </div>
          ) : (
            <button
              onClick={handleExportar}
              disabled={exportando}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#0E2E60] text-[#0E2E60] text-sm font-semibold hover:bg-[#EEF4FD] transition-colors disabled:opacity-50"
            >
              {exportando ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Solicitar exportação completa
            </button>
          )}
        </div>
      </div>

      {/* Anonimizar usuário */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Exclusão de dados (Direito ao Esquecimento)</h3>
        </div>
        <div className="px-4 py-4 space-y-4">
          <div className="flex items-start gap-2 text-[#F59E0B] bg-[#FEF3C7] rounded-lg p-3">
            <span className="text-base">⚠️</span>
            <p className="text-xs text-[#92400E]">
              Esta ação é <strong>irreversível</strong>. Remove todos os dados pessoais identificáveis. Inspeções e NCs são anonimizadas (mantidas para relatórios).
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">Usuário para anonimizar</label>
            <select
              value={usuarioSelecionado}
              onChange={(e) => setUsuarioSelecionado(e.target.value)}
              className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-[#0E2E60]/20 bg-white"
            >
              <option value="">Selecione um usuário...</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>{u.nome} — {u.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">
              Digite <strong className="text-[#DC2626]">CONFIRMAR</strong> para prosseguir
            </label>
            <input
              type="text"
              value={confirmacaoAnon}
              onChange={(e) => setConfirmacaoAnon(e.target.value)}
              placeholder="CONFIRMAR"
              className="w-full h-9 rounded-lg border border-[#D5E3F0] px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
            />
          </div>

          <button
            onClick={handleAnonimizar}
            disabled={anonimizando || !usuarioSelecionado || confirmacaoAnon !== 'CONFIRMAR'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-40"
          >
            {anonimizando ? <Loader2 size={14} className="animate-spin" /> : <UserX size={14} />}
            Anonimizar usuário
          </button>
        </div>
      </div>

      {/* Consentimento e termos */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#EEF4FD]">
          <h3 className="text-sm font-bold text-[#0F1B2D]">Consentimento e Termos</h3>
        </div>
        <div className="px-4 py-4 space-y-3">
          <div className="text-sm text-[#5A7089] space-y-1">
            <p>Versão atual dos termos: <strong className="text-[#0F1B2D]">v2.1</strong> — vigente desde 01/01/2026</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/termos"
              target="_blank"
              className="flex items-center gap-1 text-sm text-[#0E2E60] font-semibold hover:underline"
            >
              Ver Termos de Uso <ExternalLink size={12} />
            </Link>
            <span className="text-[#D5E3F0]">|</span>
            <Link
              href="/privacidade"
              target="_blank"
              className="flex items-center gap-1 text-sm text-[#0E2E60] font-semibold hover:underline"
            >
              Ver Política de Privacidade <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      {/* Exclusão total */}
      <div className="bg-[#FFF5F5] border border-[#DC2626]/30 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[#DC2626]/20">
          <h3 className="text-sm font-bold text-[#DC2626]">Exclusão total do município</h3>
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-sm text-[#5A7089]">
            Remove <strong>TODOS</strong> os dados do município permanentemente. O processo leva 30 dias conforme a LGPD.
          </p>

          {prazoExclusao ? (
            <div className="text-sm text-[#00963A] font-semibold flex items-center gap-1">
              <CheckCircle2 size={14} />
              Solicitação registrada. Prazo: {prazoExclusao.toLocaleDateString('pt-BR')}
            </div>
          ) : (
            <details className="group">
              <summary className="flex items-center gap-1.5 text-sm text-[#DC2626] font-semibold cursor-pointer list-none">
                <Trash2 size={14} />
                Solicitar exclusão do município...
              </summary>
              <div className="mt-3 space-y-3">
                <label className="text-xs font-semibold text-[#5A7089] block mb-1.5">
                  Digite o nome exato do município: <strong className="text-[#DC2626]">{nomeTenant}</strong>
                </label>
                <input
                  type="text"
                  value={confirmacaoExclusao}
                  onChange={(e) => setConfirmacaoExclusao(e.target.value)}
                  placeholder={nomeTenant}
                  className="w-full h-9 rounded-lg border border-[#DC2626]/40 px-3 text-sm text-[#0F1B2D] focus:outline-none focus:ring-2 focus:ring-red-200 bg-white"
                />
                <button
                  onClick={handleSolicitarExclusao}
                  disabled={solicitandoExclusao || confirmacaoExclusao !== nomeTenant}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#DC2626] text-white text-sm font-semibold disabled:opacity-40"
                >
                  {solicitandoExclusao ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Confirmar solicitação de exclusão
                </button>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
