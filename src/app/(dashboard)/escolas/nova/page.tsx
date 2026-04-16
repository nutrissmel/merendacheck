'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { EscolaForm } from '@/components/escolas/EscolaForm'
import { criarEscolaAction } from '@/actions/escola.actions'
import { toast } from 'sonner'
import type { EscolaFormData } from '@/components/escolas/EscolaForm'

export default function NovaEscolaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(data: EscolaFormData) {
    setIsLoading(true)
    const res = await criarEscolaAction(data)
    setIsLoading(false)

    if (res.sucesso) {
      toast.success('Escola criada com sucesso!')
      router.push(`/escolas/${res.escola.id}`)
    } else {
      toast.error(res.erro)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/escolas"
          className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para escolas
        </Link>
        <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">Nova escola</h1>
        <p className="text-sm text-[#5A7089] mt-1">Preencha os dados para cadastrar uma nova escola.</p>
        <div className="mt-4 h-px bg-[#D5E3F0]" />
      </div>

      {/* Form card */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
        <EscolaForm modo="criar" onSubmit={handleSubmit} isLoading={isLoading} />

        {/* Submit button outside form */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
          <Link
            href="/escolas"
            className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            form="escola-form"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] disabled:opacity-60 transition-colors flex items-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            )}
            Criar escola
          </button>
        </div>
      </div>
    </div>
  )
}
