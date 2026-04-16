'use client'

import { useState, useEffect } from 'react'
import { History, RefreshCw, Download, Trash2, FileText, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'

interface ItemHistorico {
  id: string
  tipo: string
  label: string
  periodo: { inicio: string; fim: string }
  url: string
  geradoEm: string
}

const STORAGE_KEY = 'mc_relatorios_historico'

function fmtData(iso: string) {
  try { return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) } catch { return iso }
}

function fmtPeriodo(inicio: string, fim: string) {
  try {
    const i = format(new Date(inicio), 'dd/MM/yyyy', { locale: ptBR })
    const f = format(new Date(fim), 'dd/MM/yyyy', { locale: ptBR })
    return `${i} – ${f}`
  } catch { return `${inicio} – ${fim}` }
}

export function AbaHistorico() {
  const [historico, setHistorico] = useState<ItemHistorico[]>([])
  const [carregado, setCarregado] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setHistorico(JSON.parse(raw))
    } catch {}
    setCarregado(true)
  }, [])

  function remover(id: string) {
    const novo = historico.filter((h) => h.id !== id)
    setHistorico(novo)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novo))
    toast.success('Removido do histórico.')
  }

  function limparTudo() {
    setHistorico([])
    localStorage.removeItem(STORAGE_KEY)
    toast.success('Histórico limpo.')
  }

  if (!carregado) return null

  if (historico.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#D5E3F0] p-12 text-center shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
        <History size={36} className="text-[#A8BDD4] mx-auto mb-3" />
        <p className="text-base font-semibold text-[#0F1B2D] font-heading">Nenhum relatório gerado</p>
        <p className="text-sm text-[#5A7089] mt-1">
          Os relatórios gerados nesta sessão aparecerão aqui para download rápido.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#5A7089]">{historico.length} relatório{historico.length !== 1 ? 's' : ''} gerado{historico.length !== 1 ? 's' : ''}</p>
        <button
          onClick={limparTudo}
          className="text-xs text-[#5A7089] hover:text-[#DC2626] transition-colors flex items-center gap-1"
        >
          <Trash2 size={12} /> Limpar histórico
        </button>
      </div>

      <div className="space-y-3">
        {historico.map((item) => {
          const isExcel = item.tipo === 'Excel'
          return (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-[#D5E3F0] p-4 shadow-[0_1px_3px_rgba(14,46,96,0.06)] flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isExcel ? 'bg-[#F0FDF4]' : 'bg-[#EEF4FD]'}`}>
                {isExcel
                  ? <FileSpreadsheet size={18} className="text-[#00963A]" />
                  : <FileText size={18} className="text-[#0E2E60]" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F1B2D] truncate">{item.label}</p>
                <p className="text-xs text-[#5A7089] mt-0.5">{fmtPeriodo(item.periodo.inicio, item.periodo.fim)}</p>
                <p className="text-[10px] text-[#A8BDD4] mt-0.5">Gerado em {fmtData(item.geradoEm)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={item.url}
                  download
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0E2E60] text-white text-xs font-semibold hover:bg-[#133878] transition-colors"
                >
                  <Download size={12} />
                  Baixar
                </a>
                <a
                  href={item.url.replace('&download=true', '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#D5E3F0] text-xs font-medium text-[#0E2E60] hover:bg-[#EEF4FD] transition-colors"
                >
                  <RefreshCw size={12} />
                  Regen.
                </a>
                <button
                  onClick={() => remover(item.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#D5E3F0] text-[#5A7089] hover:bg-red-50 hover:text-[#DC2626] hover:border-red-200 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-[#A8BDD4] text-center">
        O histórico é salvo localmente neste navegador e pode ser limpo a qualquer momento.
      </p>
    </div>
  )
}
