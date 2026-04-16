'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, School, Users, Zap, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Resultado {
  id: string
  tipo: 'escola' | 'usuario' | 'acao'
  label: string
  sub?: string
  href: string
}

const ACOES_FIXAS: Resultado[] = [
  { id: 'nova-escola',   tipo: 'acao', label: 'Nova escola',         href: '/escolas/nova' },
  { id: 'convidar',      tipo: 'acao', label: 'Convidar usuário',    href: '/configuracoes/usuarios' },
  { id: 'nova-inspecao', tipo: 'acao', label: 'Nova inspeção',       href: '/inspecoes/nova' },
  { id: 'relatorios',    tipo: 'acao', label: 'Ver relatórios',      href: '/relatorios' },
]

const ICONE_TIPO = {
  escola:  School,
  usuario: Users,
  acao:    Zap,
}

const COR_TIPO: Record<string, string> = {
  escola:  'text-[#0E2E60] bg-[#EEF4FD]',
  usuario: 'text-[#00963A] bg-[#D1F7E2]',
  acao:    'text-amber-700 bg-amber-50',
}

const LABEL_TIPO: Record<string, string> = {
  escola:  'Escolas',
  usuario: 'Usuários',
  acao:    'Ações rápidas',
}

interface BuscaGlobalProps {
  aberto: boolean
  onFechar: () => void
  escolas?: { id: string; nome: string; cidade?: string | null }[]
  usuarios?: { id: string; nome: string; email: string }[]
}

export function BuscaGlobal({ aberto, onFechar, escolas = [], usuarios = [] }: BuscaGlobalProps) {
  const [query, setQuery] = useState('')
  const [indiceSelecionado, setIndiceSelecionado] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Focar input quando abre
  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setIndiceSelecionado(0)
    }
  }, [aberto])

  const resultados = useCallback((): Resultado[] => {
    const q = query.toLowerCase().trim()

    if (!q) return ACOES_FIXAS

    const escolasFiltradas: Resultado[] = escolas
      .filter((e) => e.nome.toLowerCase().includes(q))
      .slice(0, 4)
      .map((e) => ({ id: e.id, tipo: 'escola', label: e.nome, sub: e.cidade ?? undefined, href: `/escolas/${e.id}` }))

    const usuariosFiltrados: Resultado[] = usuarios
      .filter((u) => u.nome.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 4)
      .map((u) => ({ id: u.id, tipo: 'usuario', label: u.nome, sub: u.email, href: `/configuracoes/usuarios/${u.id}` }))

    const acoesFiltradas = ACOES_FIXAS.filter((a) => a.label.toLowerCase().includes(q))

    return [...escolasFiltradas, ...usuariosFiltrados, ...acoesFiltradas]
  }, [query, escolas, usuarios])

  const lista = resultados()

  function navegar(href: string) {
    onFechar()
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndiceSelecionado((i) => Math.min(i + 1, lista.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndiceSelecionado((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && lista[indiceSelecionado]) {
      navegar(lista[indiceSelecionado].href)
    }
  }

  // Agrupar por tipo
  const grupos: { tipo: string; items: Resultado[] }[] = []
  for (const item of lista) {
    const grupo = grupos.find((g) => g.tipo === item.tipo)
    if (grupo) grupo.items.push(item)
    else grupos.push({ tipo: item.tipo, items: [item] })
  }

  let globalIdx = 0

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onFechar}
      />

      {/* Painel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#D5E3F0] overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-200">
          <Search size={16} className="text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIndiceSelecionado(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar escolas, usuários ou ações..."
            className="flex-1 text-sm outline-none placeholder:text-neutral-400 bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-700">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-neutral-200 text-[10px] text-neutral-400 font-mono">
            Esc
          </kbd>
        </div>

        {/* Resultados */}
        <div className="max-h-80 overflow-y-auto py-1">
          {lista.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Nenhum resultado encontrado</p>
          ) : (
            grupos.map(({ tipo, items }) => (
              <div key={tipo}>
                <p className="px-4 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  {LABEL_TIPO[tipo] ?? tipo}
                </p>
                {items.map((item) => {
                  const isSelected = globalIdx === indiceSelecionado
                  const currentIdx = globalIdx++
                  const Icone = ICONE_TIPO[item.tipo]
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setIndiceSelecionado(currentIdx)}
                      onClick={() => navegar(item.href)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected ? 'bg-[#EEF4FD]' : 'hover:bg-[#F5F9FD]'
                      )}
                    >
                      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', COR_TIPO[item.tipo])}>
                        <Icone size={13} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0F1B2D] truncate">{item.label}</p>
                        {item.sub && (
                          <p className="text-xs text-neutral-400 truncate">{item.sub}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-neutral-100 px-4 py-2 flex items-center gap-3 text-[10px] text-neutral-400">
          <span className="flex items-center gap-1"><kbd className="font-mono px-1 border border-neutral-200 rounded">↑↓</kbd> navegar</span>
          <span className="flex items-center gap-1"><kbd className="font-mono px-1 border border-neutral-200 rounded">↵</kbd> selecionar</span>
          <span className="flex items-center gap-1"><kbd className="font-mono px-1 border border-neutral-200 rounded">Esc</kbd> fechar</span>
        </div>
      </div>
    </div>
  )
}

// Botão para usar no Header
export function BotaoBusca({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg border border-neutral-200 bg-[#F5F9FD] text-sm text-neutral-400 hover:border-[#0E2E60] hover:text-[#0E2E60] transition-colors"
      aria-label="Busca global"
    >
      <Search size={13} />
      <span className="text-xs">Buscar...</span>
      <kbd className="hidden md:inline text-[10px] font-mono border border-neutral-200 rounded px-1 ml-1">Ctrl K</kbd>
    </button>
  )
}
