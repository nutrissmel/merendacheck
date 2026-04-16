'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { escolaSchema } from '@/lib/validations'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { z } from 'zod'

export type EscolaFormData = z.infer<typeof escolaSchema>

const TURNOS = [
  { value: 'MATUTINO',   label: 'Matutino'   },
  { value: 'VESPERTINO', label: 'Vespertino' },
  { value: 'NOTURNO',    label: 'Noturno'    },
  { value: 'INTEGRAL',   label: 'Integral'   },
] as const

interface EscolaFormProps {
  defaultValues?: Partial<EscolaFormData>
  onSubmit: (data: EscolaFormData) => Promise<void>
  isLoading?: boolean
  modo: 'criar' | 'editar'
}

export function EscolaForm({ defaultValues, onSubmit, isLoading: _isLoading, modo: _modo }: EscolaFormProps) {
  const [buscandoCep, setBuscandoCep] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EscolaFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(escolaSchema) as any,
    defaultValues: {
      nome: '',
      codigoInep: '',
      numeroAlunos: 0,
      turnos: [],
      endereco: '',
      bairro: '',
      cidade: '',
      cep: '',
      ...defaultValues,
    },
  })

  const cepValue = watch('cep')
  const turnosSelecionados = watch('turnos') ?? []

  // Auto-preenchimento de CEP
  useEffect(() => {
    const cepLimpo = (cepValue ?? '').replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setBuscandoCep(true)
      try {
        const res = await fetch(`/api/cep/${cepLimpo}`, { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        if (data.erro) return
        if (data.logradouro) setValue('endereco', data.logradouro, { shouldValidate: true })
        if (data.bairro)     setValue('bairro', data.bairro, { shouldValidate: true })
        if (data.localidade) setValue('cidade', data.localidade, { shouldValidate: true })
        toast.success('Endereço preenchido automaticamente.')
      } catch {
        // ignorar abort
      } finally {
        setBuscandoCep(false)
      }
    }, 600)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [cepValue, setValue])

  function toggleTurno(turno: string) {
    const atual = turnosSelecionados as string[]
    const novo = atual.includes(turno) ? atual.filter((t) => t !== turno) : [...atual, turno]
    setValue('turnos', novo as EscolaFormData['turnos'], { shouldValidate: true })
  }

  return (
    <form id="escola-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── DADOS BÁSICOS ── */}
      <div>
        <p className="text-xs font-bold text-[#5A7089] uppercase tracking-widest mb-4">Dados Básicos</p>
        <div className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome da escola *</Label>
            <Input
              id="nome"
              {...register('nome')}
              placeholder="Ex: EMEF João Paulo II"
              className={cn('mt-1', errors.nome && 'border-red-500')}
            />
            {errors.nome && <p className="text-xs text-red-500 mt-1">{errors.nome.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigoInep">Código INEP</Label>
              <Input
                id="codigoInep"
                {...register('codigoInep')}
                placeholder="8 dígitos"
                maxLength={8}
                className={cn('mt-1', errors.codigoInep && 'border-red-500')}
              />
              {errors.codigoInep && <p className="text-xs text-red-500 mt-1">{errors.codigoInep.message}</p>}
            </div>
            <div>
              <Label htmlFor="numeroAlunos">Número de alunos *</Label>
              <Input
                id="numeroAlunos"
                type="number"
                min={0}
                {...register('numeroAlunos')}
                className={cn('mt-1', errors.numeroAlunos && 'border-red-500')}
              />
              {errors.numeroAlunos && <p className="text-xs text-red-500 mt-1">{errors.numeroAlunos.message}</p>}
            </div>
          </div>

          <div>
            <Label>Turnos *</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TURNOS.map(({ value, label }) => {
                const ativo = turnosSelecionados.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleTurno(value)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                      ativo
                        ? 'bg-[#0E2E60] text-white border-[#0E2E60]'
                        : 'bg-white text-neutral-600 border-neutral-300 hover:border-[#0E2E60] hover:text-[#0E2E60]'
                    )}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
            {errors.turnos && <p className="text-xs text-red-500 mt-1">{errors.turnos.message}</p>}
          </div>
        </div>
      </div>

      <div className="h-px bg-neutral-200" />

      {/* ── ENDEREÇO ── */}
      <div>
        <p className="text-xs font-bold text-[#5A7089] uppercase tracking-widest mb-4">Endereço</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <div className="relative mt-1">
                <Input
                  id="cep"
                  {...register('cep')}
                  placeholder="00000-000"
                  maxLength={9}
                  className={cn(errors.cep && 'border-red-500')}
                />
                {buscandoCep && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 size={14} className="animate-spin text-neutral-400" />
                  </div>
                )}
                {!buscandoCep && (
                  <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300" />
                )}
              </div>
              {errors.cep && <p className="text-xs text-red-500 mt-1">{errors.cep.message}</p>}
            </div>
            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" {...register('cidade')} placeholder="Ex: Luziânia" className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" {...register('endereco')} placeholder="Rua, número" className="mt-1" />
          </div>

          <div>
            <Label htmlFor="bairro">Bairro</Label>
            <Input id="bairro" {...register('bairro')} placeholder="Ex: Centro" className="mt-1" />
          </div>
        </div>
      </div>
    </form>
  )
}
