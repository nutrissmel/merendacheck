'use client'

import { useRouter } from 'next/navigation'
import { ScrollText, ChevronLeft, ChevronRight } from 'lucide-react'

type Log = {
  id: string
  acao: string
  createdAt: Date
  ip: string | null
  alvoTipo: string | null
  alvoNome: string | null
  usuario: { nome: string; email: string; papel: string } | null
  tenant: { nome: string; estado: string } | null
}

const ACAO_COR: Record<string, string> = {
  LOGIN_REALIZADO:  'bg-green-100 text-green-700',
  LOGIN_FALHOU:     'bg-red-100 text-red-700',
  LOGOUT_REALIZADO: 'bg-neutral-100 text-neutral-600',
  USUARIO_CRIADO:   'bg-blue-100 text-blue-700',
  INSPECAO_FINALIZADA: 'bg-green-100 text-green-700',
  NC_GERADA:        'bg-red-100 text-red-700',
  NC_RESOLVIDA:     'bg-green-100 text-green-700',
  '2FA_ATIVADO':    'bg-purple-100 text-purple-700',
}

function formatarData(date: Date) {
  return new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function AuditoriaGlobalClient({
  logs,
  total,
  totalPaginas,
  paginaAtual,
}: {
  logs: Log[]
  total: number
  totalPaginas: number
  paginaAtual: number
}) {
  const router = useRouter()

  function irPara(p: number) {
    router.push(`/super-admin/auditoria?pagina=${p}`)
  }

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-6">
        <ScrollText size={20} className="text-[#0E2E60]" />
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#0F1B2D]">Auditoria Global</h1>
          <p className="text-sm text-[#5A7089]">{total.toLocaleString('pt-BR')} eventos registrados</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#EEF4FD] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EEF4FD] bg-[#F5F9FD]">
              <th className="text-left text-xs font-semibold text-[#5A7089] px-5 py-3">Data/Hora</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Ação</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Usuário</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Município</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">Alvo</th>
              <th className="text-left text-xs font-semibold text-[#5A7089] px-3 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F5F9FD]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#F5F9FD]/50 transition-colors">
                <td className="px-5 py-3 text-xs text-[#5A7089] whitespace-nowrap">
                  {formatarData(log.createdAt)}
                </td>
                <td className="px-3 py-3">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${ACAO_COR[log.acao] ?? 'bg-neutral-100 text-neutral-600'}`}>
                    {log.acao.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <p className="text-xs font-medium text-[#0F1B2D]">{log.usuario?.nome ?? '—'}</p>
                  <p className="text-[10px] text-[#5A7089]">{log.usuario?.papel?.replace('_', ' ')}</p>
                </td>
                <td className="px-3 py-3 text-xs text-[#5A7089]">
                  {log.tenant ? `${log.tenant.nome} (${log.tenant.estado})` : '—'}
                </td>
                <td className="px-3 py-3">
                  {log.alvoNome ? (
                    <div>
                      <p className="text-xs text-[#0F1B2D]">{log.alvoNome}</p>
                      {log.alvoTipo && <p className="text-[10px] text-[#5A7089]">{log.alvoTipo}</p>}
                    </div>
                  ) : '—'}
                </td>
                <td className="px-3 py-3 text-xs text-[#5A7089] font-mono">{log.ip ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#5A7089]">
                  Nenhum evento encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#EEF4FD]">
            <p className="text-xs text-[#5A7089]">
              Página {paginaAtual} de {totalPaginas}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => irPara(paginaAtual - 1)}
                disabled={paginaAtual <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] disabled:opacity-40"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => irPara(paginaAtual + 1)}
                disabled={paginaAtual >= totalPaginas}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] disabled:opacity-40"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
