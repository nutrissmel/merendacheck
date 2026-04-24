'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { excluirInspecaoAction } from '@/actions/inspecao.actions'
import { ModalConfirmarExclusao } from '@/components/shared/ModalConfirmarExclusao'
import { toast } from 'sonner'

interface Props {
  inspecaoId: string
  escolaNome: string
}

export function ExcluirInspecaoButton({ inspecaoId, escolaNome }: Props) {
  const router = useRouter()
  const [modalAberto, setModalAberto] = useState(false)
  const [excluindo, setExcluindo] = useState(false)

  async function handleExcluir(justificativa: string) {
    setExcluindo(true)
    const result = await excluirInspecaoAction(inspecaoId, justificativa)
    setExcluindo(false)
    if ('erro' in result) {
      toast.error(result.erro)
    } else {
      toast.success('Inspeção excluída.')
      setModalAberto(false)
      router.push('/inspecoes')
    }
  }

  return (
    <>
      <button
        onClick={() => setModalAberto(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
      >
        <Trash2 size={15} /> Excluir inspeção
      </button>

      <ModalConfirmarExclusao
        aberto={modalAberto}
        titulo={`Excluir inspeção de "${escolaNome}"?`}
        descricao="Todas as respostas, fotos, não conformidades e ações corretivas vinculadas a esta inspeção serão permanentemente removidas."
        placeholder="Ex: Inspeção duplicada, dados incorretos, inspeção iniciada por engano..."
        carregando={excluindo}
        onFechar={() => setModalAberto(false)}
        onConfirmar={handleExcluir}
      />
    </>
  )
}
