import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F9FD] flex flex-col">
      {/* Header simples */}
      <header className="bg-white border-b border-[#D5E3F0] shadow-[0_1px_3px_rgba(14,46,96,0.04)]">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#0E2E60] rounded-lg flex items-center justify-center">
              <CheckCircle2 size={14} className="text-white" />
            </div>
            <span className="font-bold text-[#0F1B2D] font-heading text-sm">MerendaCheck</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-[#5A7089] hover:text-[#0E2E60] transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D5E3F0] bg-white mt-12">
        <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-[#A8BDD4]">
          <span>© {new Date().getFullYear()} MerendaCheck. Todos os direitos reservados.</span>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-[#0E2E60] transition-colors">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-[#0E2E60] transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
