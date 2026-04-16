'use client'

import { useState, useEffect, useTransition } from 'react'
import { ClipboardList, Filter, ChevronDown, ChevronRight, Download, Loader2, ChevronLeft } from 'lucide-react'
import { listarAuditoriaAction, listarUsuariosAuditoriaAction, listarAcoesUnicasAction } from '@/actions/auditoria.actions'
import type { LogAuditoriaCompleto } from '@/actions/auditoria.actions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Usuario {
  id: string
  nome: string
  email: string
}

interface Props {
  usuariosIniciais: Usuario[]
  acoesIniciais: string[]
}

export function SecaoAuditLog({ usuariosIniciais, acoesIniciais }: Props) {
  const [logs, setLogs] = useState<LogAuditoriaCompleto[]>([])
  const [total, setTotal] = useState(0)
  const [paginas, setPaginas] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [carregando, setCarregando] = useState(true)
  const [isPending, startTransition] = useTransition()

  // Filtros
  const [filtroUsuario, setFiltroUsuario] = useState('')
  const [filtroAcao, setFiltroAcao] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')

  // Linha expandida
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    buscarLogs()
  }, [pagina])

  async function buscarLogs() {
    setCarregando(true)
    const res = await listarAuditoriaAction({
      usuarioId: filtroUsuario || undefined,
      acao: filtroAcao || undefined,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim + 'T23:59:59') : undefined,
      pagina,
    })
    setLogs(res.logs)
    setTotal(res.total)
    setPaginas(res.paginas)
    setCarregando(false)
  }

  function handleFiltrar() {
    setPagina(1)
    buscarLogs()
  }

  function handleExportarCSV() {
    if (logs.length === 0) return
    const cabecalho = 'data,usuario,email,acao,alvo,ip,userAgent'
    const linhas = logs.map((l) =>
      [
        format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        csvEscape(l.usuarioNome ?? 'Sistema'),
        csvEscape(l.usuarioEmail ?? ''),
        l.acao,
        csvEscape(l.alvoNome ?? l.alvoId ?? ''),
        l.ip ?? '',
        csvEscape(l.userAgent ?? ''),
      ].join(','),
    )
    const csv = [cabecalho, ...linhas].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-[#0F1B2D] font-heading flex items-center gap-2">
            <ClipboardList size={16} className="text-[#0E2E60]" />
            Audit Log
          </h2>
          <p className="text-sm text-[#5A7089] mt-0.5">Registro de todas as ações críticas do sistema · {total} entradas</p>
        </div>
        <button
          onClick={handleExportarCSV}
          disabled={logs.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5E3F0] text-sm text-[#0E2E60] font-semibold hover:bg-[#EEF4FD] transition-colors disabled:opacity-50"
        >
          <Download size={13} />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <select
          value={filtroUsuario}
          onChange={(e) => setFiltroUsuario(e.target.value)}
          className="h-8 rounded-lg border border-[#D5E3F0] px-2 text-sm text-[#0F1B2D] focus:outline-none bg-white"
        >
          <option value="">Todos os usuários</option>
          {usuariosIniciais.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>

        <select
          value={filtroAcao}
          onChange={(e) => setFiltroAcao(e.target.value)}
          className="h-8 rounded-lg border border-[#D5E3F0] px-2 text-sm text-[#0F1B2D] focus:outline-none bg-white"
        >
          <option value="">Todas as ações</option>
          {acoesIniciais.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          className="h-8 rounded-lg border border-[#D5E3F0] px-2 text-sm text-[#0F1B2D] focus:outline-none bg-white"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="flex-1 h-8 rounded-lg border border-[#D5E3F0] px-2 text-sm text-[#0F1B2D] focus:outline-none bg-white"
          />
          <button
            onClick={handleFiltrar}
            className="flex items-center gap-1 h-8 px-3 rounded-lg bg-[#0E2E60] text-white text-xs font-semibold hover:bg-[#133878] transition-colors"
          >
            <Filter size={11} />
            Filtrar
          </button>
        </div>
      </div>

      {/* Tabela de logs */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl overflow-hidden">
        {carregando ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#0E2E60]" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <ClipboardList size={32} className="text-[#D5E3F0] mx-auto mb-2" />
            <p className="text-sm text-[#5A7089]">Nenhum registro encontrado</p>
          </div>
        ) : (
          <div>
            {/* Cabeçalho */}
            <div className="grid grid-cols-[120px_140px_180px_1fr_32px] gap-2 px-4 py-2 bg-[#F5F9FD] border-b border-[#EEF4FD]">
              <span className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider">Data/Hora</span>
              <span className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider">Usuário</span>
              <span className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider">Ação</span>
              <span className="text-[10px] font-bold text-[#5A7089] uppercase tracking-wider">Alvo</span>
              <span />
            </div>

            <div className="divide-y divide-[#EEF4FD]">
              {logs.map((log) => (
                <div key={log.id}>
                  <button
                    onClick={() => setExpandido(expandido === log.id ? null : log.id)}
                    className="w-full grid grid-cols-[120px_140px_180px_1fr_32px] gap-2 px-4 py-2.5 hover:bg-[#F5F9FD] transition-colors text-left items-center"
                  >
                    <span className="text-xs text-[#5A7089]">
                      {format(new Date(log.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                    <span className="text-xs font-semibold text-[#0F1B2D] truncate">
                      {log.usuarioNome ?? 'Sistema'}
                    </span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${acaoCor(log.acao)}`}>
                      {log.acao}
                    </span>
                    <span className="text-xs text-[#5A7089] truncate">
                      {log.alvoNome ?? log.alvoId ?? '—'}
                    </span>
                    {expandido === log.id
                      ? <ChevronDown size={13} className="text-[#5A7089]" />
                      : <ChevronRight size={13} className="text-[#A8BDD4]" />
                    }
                  </button>

                  {expandido === log.id && (
                    <div className="px-4 pb-3 pt-1 bg-[#F5F9FD] border-t border-[#EEF4FD]">
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        {log.usuarioEmail && (
                          <div><span className="text-[#A8BDD4]">E-mail:</span> <span className="text-[#0F1B2D]">{log.usuarioEmail}</span></div>
                        )}
                        {log.alvoTipo && (
                          <div><span className="text-[#A8BDD4]">Tipo alvo:</span> <span className="text-[#0F1B2D]">{log.alvoTipo}</span></div>
                        )}
                        {log.ip && (
                          <div><span className="text-[#A8BDD4]">IP:</span> <span className="text-[#0F1B2D] font-mono">{log.ip}</span></div>
                        )}
                        {log.userAgent && (
                          <div className="col-span-2"><span className="text-[#A8BDD4]">User-Agent:</span> <span className="text-[#5A7089]">{log.userAgent.slice(0, 100)}</span></div>
                        )}
                        {log.detalhes && (
                          <div className="col-span-2">
                            <span className="text-[#A8BDD4]">Detalhes:</span>
                            <pre className="text-[#5A7089] mt-1 text-[10px] bg-white rounded p-2 overflow-x-auto">
                              {JSON.stringify(log.detalhes, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Paginação */}
      {paginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#5A7089] text-xs">{total} registros · Página {pagina} de {paginas}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, paginas) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPagina(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    pagina === p ? 'bg-[#0E2E60] text-white' : 'border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD]'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPagina((p) => Math.min(paginas, p + 1))}
              disabled={pagina === paginas}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-[#EEF4FD] disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function acaoCor(acao: string): string {
  if (acao.includes('CRIADA') || acao.includes('ATIVADO') || acao.includes('ACEITO') || acao.includes('RECEBIDO')) {
    return 'bg-[#D1F7E2] text-[#00963A]'
  }
  if (acao.includes('DESATIVADO') || acao.includes('CANCELADA') || acao.includes('FALHOU') || acao.includes('VENCIDA')) {
    return 'bg-[#FEE2E2] text-[#DC2626]'
  }
  if (acao.includes('LOGIN') || acao.includes('PAPEL') || acao.includes('CONFIGURACOES')) {
    return 'bg-[#EEF4FD] text-[#0E2E60]'
  }
  return 'bg-[#F5F9FD] text-[#5A7089]'
}

function csvEscape(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) return '"' + v.replace(/"/g, '""') + '"'
  return v
}
