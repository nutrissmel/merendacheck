'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export function BotaoExportarCSV() {
  const [carregando, setCarregando] = useState(false)

  async function handleExportar() {
    setCarregando(true)
    try {
      const res = await fetch('/api/usuarios/exportar')
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body.erro ?? 'Erro ao exportar. Tente novamente.')
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.headers.get('X-Filename') ?? 'usuarios.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Erro ao exportar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <button
      onClick={handleExportar}
      disabled={carregando}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-300 text-sm font-medium text-neutral-600 hover:border-[#0E2E60] hover:text-[#0E2E60] transition-colors disabled:opacity-50"
    >
      {carregando ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Download size={13} />
      )}
      {carregando ? 'Gerando...' : 'Exportar CSV'}
    </button>
  )
}
