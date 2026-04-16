'use client'

import { useState } from 'react'
import { Bell, Send, Loader2, Calendar } from 'lucide-react'
import { enviarEmailTesteRelatorio } from '@/actions/relatorios.actions'
import { toast } from 'sonner'
import { startOfMonth, endOfMonth } from 'date-fns'

export function ConfigAutoRelatorio({ compact = false }: { compact?: boolean }) {
  const [ativo, setAtivo] = useState(false)
  const [enviandoTeste, setEnviandoTeste] = useState(false)

  async function enviarTeste() {
    setEnviandoTeste(true)
    const agora = new Date()
    const res = await enviarEmailTesteRelatorio({
      inicio: startOfMonth(agora).toISOString().split('T')[0],
      fim: endOfMonth(agora).toISOString().split('T')[0],
    })
    setEnviandoTeste(false)
    if (res.sucesso) {
      toast.success('Email de teste enviado! Verifique sua caixa de entrada.')
    } else {
      toast.error(res.erro ?? 'Erro ao enviar email de teste.')
    }
  }

  // Versão compacta para sidebar
  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Bell size={12} className="text-neutral-400" />
            <span className="text-xs font-medium text-neutral-600">Envio mensal</span>
          </div>
          <button
            onClick={() => {
              setAtivo((v) => !v)
              toast.info(ativo ? 'Relatório automático desativado.' : 'Relatório automático ativado!')
            }}
            className={`relative w-9 h-5 rounded-full transition-colors ${ativo ? 'bg-blue-800' : 'bg-neutral-200'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <button
          onClick={enviarTeste}
          disabled={enviandoTeste}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          {enviandoTeste ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
          {enviandoTeste ? 'Enviando...' : 'Enviar teste'}
        </button>
      </div>
    )
  }

  // Versão completa
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Bell size={18} className="text-blue-800" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">Relatório automático mensal</h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Receba o relatório completo por email todo dia 1º do mês
          </p>
        </div>
        <button
          onClick={() => {
            setAtivo((v) => !v)
            toast.info(ativo ? 'Relatório automático desativado.' : 'Relatório automático ativado!')
          }}
          className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${ativo ? 'bg-blue-800' : 'bg-neutral-200'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {ativo && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4 flex items-start gap-2">
          <Calendar size={14} className="text-blue-800 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold">Próximo envio: dia 1º do próximo mês</p>
            <p className="text-blue-600 mt-0.5">
              O relatório do mês anterior será enviado automaticamente para seu email cadastrado.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-neutral-100">
        <button
          onClick={enviarTeste}
          disabled={enviandoTeste}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-neutral-200 text-sm font-medium text-blue-800 hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          {enviandoTeste ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {enviandoTeste ? 'Enviando...' : 'Enviar teste'}
        </button>
        <p className="text-xs text-neutral-400">
          Envia um email de exemplo para o seu endereço cadastrado
        </p>
      </div>
    </div>
  )
}
