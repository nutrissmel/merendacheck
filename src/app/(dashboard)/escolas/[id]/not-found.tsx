import Link from 'next/link'
import { School, ArrowLeft } from 'lucide-react'

export default function EscolaNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-[#EEF4FD] flex items-center justify-center mb-6">
        <School size={40} className="text-[#0E2E60]" />
      </div>

      <h1 className="text-3xl font-bold text-[#0F1B2D] font-heading mb-2">
        Escola não encontrada
      </h1>
      <p className="text-[#5A7089] text-base max-w-sm mb-8">
        A escola que você está procurando não existe ou você não tem permissão para acessá-la.
      </p>

      <Link
        href="/escolas"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0E2E60] text-white font-semibold text-sm hover:bg-[#133878] transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar para escolas
      </Link>
    </div>
  )
}
