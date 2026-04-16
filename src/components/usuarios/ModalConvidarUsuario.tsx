'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { enviarConviteAction } from '@/actions/convite.actions'
import { cn } from '@/lib/utils'
import { Loader2, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Papel } from '@prisma/client'

const PAPEIS_CONVIDAVEIS: { value: Papel; label: string }[] = [
  { value: 'NUTRICIONISTA', label: 'Nutricionista' },
  { value: 'DIRETOR_ESCOLA', label: 'Diretor de Escola' },
  { value: 'MERENDEIRA', label: 'Merendeira' },
]

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  papel: z.enum(['NUTRICIONISTA', 'DIRETOR_ESCOLA', 'MERENDEIRA'] as const, {
    required_error: 'Selecione um papel',
  }),
  escolasIds: z.array(z.string()).optional(),
  mensagemPersonalizada: z.string().max(200, 'Máximo 200 caracteres').optional(),
})

type FormValues = z.infer<typeof schema>

interface Escola {
  id: string
  nome: string
}

interface ModalConvidarUsuarioProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  escolas: Escola[]
  onSuccess?: () => void
}

export function ModalConvidarUsuario({
  open,
  onOpenChange,
  escolas,
  onSuccess,
}: ModalConvidarUsuarioProps) {
  const [isPending, startTransition] = useTransition()
  const [escolasSelecionadas, setEscolasSelecionadas] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const papel = watch('papel')
  const mensagem = watch('mensagemPersonalizada') ?? ''

  function toggleEscola(id: string) {
    setEscolasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    )
  }

  function handleClose() {
    reset()
    setEscolasSelecionadas([])
    onOpenChange(false)
  }

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const result = await enviarConviteAction({
        email: data.email,
        papel: data.papel,
        escolasIds: escolasSelecionadas.length > 0 ? escolasSelecionadas : undefined,
        mensagemPersonalizada: data.mensagemPersonalizada || undefined,
      })

      if (result.sucesso) {
        toast.success(`Convite enviado para ${data.email}`, {
          icon: <CheckCircle2 size={16} className="text-green-600" />,
        })
        handleClose()
        onSuccess?.()
      } else {
        toast.error(result.erro)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-[#0E2E60] px-6 py-5 text-white">
          <DialogTitle className="text-white text-lg font-bold">
            Convidar novo usuário
          </DialogTitle>
          <p className="text-blue-200 text-sm mt-1">
            O convidado receberá um e-mail com link de acesso.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {/* E-mail */}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail *</Label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              />
              <Input
                id="email"
                type="email"
                placeholder="nutri@prefeitura.gov.br"
                className={cn('pl-9', errors.email && 'border-red-500')}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Papel */}
          <div className="space-y-2">
            <Label>Papel *</Label>
            <div className="space-y-2">
              {PAPEIS_CONVIDAVEIS.map((p) => (
                <label
                  key={p.value}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    papel === p.value
                      ? 'border-[#0E2E60] bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  )}
                >
                  <input
                    type="radio"
                    value={p.value}
                    {...register('papel')}
                    className="accent-[#0E2E60]"
                  />
                  <span className="text-sm font-medium text-[#0F1B2D]">{p.label}</span>
                </label>
              ))}
            </div>
            {errors.papel && (
              <p className="text-xs text-red-500">{errors.papel.message}</p>
            )}
          </div>

          {/* Escolas */}
          {escolas.length > 0 && (
            <div className="space-y-2">
              <Label>Atribuir a escolas (opcional)</Label>
              <div className="max-h-36 overflow-y-auto space-y-1.5 p-1">
                {escolas.map((escola) => (
                  <label
                    key={escola.id}
                    className={cn(
                      'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all text-sm',
                      escolasSelecionadas.includes(escola.id)
                        ? 'border-[#00963A] bg-green-50'
                        : 'border-neutral-100 hover:border-neutral-200 bg-white'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={escolasSelecionadas.includes(escola.id)}
                      onChange={() => toggleEscola(escola.id)}
                      className="accent-[#00963A]"
                    />
                    <span className="text-[#0F1B2D]">{escola.nome}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Mensagem personalizada */}
          <div className="space-y-1.5">
            <Label htmlFor="mensagem">
              Mensagem personalizada{' '}
              <span className="text-neutral-400 font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="mensagem"
              placeholder="Adicione uma mensagem de boas-vindas..."
              rows={3}
              maxLength={200}
              className="resize-none text-sm"
              {...register('mensagemPersonalizada')}
            />
            <p className="text-xs text-neutral-400 text-right">{mensagem.length}/200</p>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
            <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#0E2E60] hover:bg-[#133878]"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Enviar convite
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
