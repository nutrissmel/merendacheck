'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { EscolaForm } from '@/components/escolas/EscolaForm'
import { buscarEscolaById, atualizarEscolaAction } from '@/actions/escola.actions'
import { toast } from 'sonner'
import type { EscolaFormData } from '@/components/escolas/EscolaForm'
import type { EscolaDetalhada } from '@/types/escola'
import type { Turno } from '@prisma/client'

export default function EditarEscolaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [escola, setEscola] = useState<EscolaDetalhada | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    buscarEscolaById(id)
      .then((data) => {
        setEscola(data)
        setCarregando(false)
      })
      .catch(() => {
        toast.error('Escola não encontrada.')
        router.replace('/escolas')
      })
  }, [id, router])

  async function handleSubmit(data: EscolaFormData) {
    setIsLoading(true)
    const res = await atualizarEscolaAction(id, data)
    setIsLoading(false)

    if (res.sucesso) {
      toast.success('Escola atualizada com sucesso!')
      router.push(`/escolas/${id}`)
    } else {
      toast.error(res.erro)
    }
  }

  if (carregando) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-[#0E2E60]" />
      </div>
    )
  }

  if (!escola) return null

  const defaultValues: Partial<EscolaFormData> = {
    nome: escola.nome,
    codigoInep: escola.codigoInep ?? '',
    numeroAlunos: escola.numeroAlunos,
    turnos: escola.turnos as Turno[],
    endereco: escola.endereco ?? '',
    bairro: escola.bairro ?? '',
    cidade: escola.cidade ?? '',
    cep: escola.cep ?? '',
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/escolas/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#5A7089] hover:text-[#0E2E60] mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Voltar para a escola
        </Link>
        <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading">Editar escola</h1>
        <p className="text-sm text-[#5A7089] mt-1">{escola.nome}</p>
        <div className="mt-4 h-px bg-[#D5E3F0]" />
      </div>

      {/* Form card */}
      <div className="bg-white border border-[#D5E3F0] rounded-xl p-6 shadow-[0_1px_3px_rgba(14,46,96,0.06)]">
        <EscolaForm
          modo="editar"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-neutral-200">
          <Link
            href={`/escolas/${id}`}
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
            {isLoading && <Loader2 size={14} className="animate-spin" />}
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  )
}
