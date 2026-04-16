'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { Loader2, ArrowRight, XCircle, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { Logo } from '@/components/shared/Logo'
import { PapelBadge } from '@/components/shared/PapelBadge'
import { buscarConviteByTokenAction, aceitarConviteAction } from '@/actions/convite.actions'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Papel } from '@prisma/client'

type ConviteData = {
  id: string
  email: string
  papel: Papel
  nomeMunicipio: string
  nomeConvidadoPor: string
  expiresAt: Date
  valido: boolean
  aceito: boolean
} | null

const schema = z
  .object({
    nome: z.string().min(3, 'Nome completo obrigatório (mínimo 3 caracteres)').max(100),
    senha: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Inclua pelo menos um número'),
    confirmarSenha: z.string(),
    termos: z.boolean().refine((v) => v === true, 'Você deve aceitar os termos'),
  })
  .refine((d) => d.senha === d.confirmarSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarSenha'],
  })

type FormValues = z.infer<typeof schema>

export default function ConvitePage({ params }: { params: { token: string } }) {
  const [convite, setConvite] = useState<ConviteData>(undefined as any)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    buscarConviteByTokenAction(params.token).then((data) => {
      setConvite(data)
      setLoading(false)
    })
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F9FD] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#0E2E60]" size={40} />
      </div>
    )
  }

  if (!convite) {
    return <TelaTokenInvalido motivo="not_found" />
  }

  if (convite.aceito) {
    return <TelaTokenInvalido motivo="already_used" />
  }

  if (!convite.valido) {
    return <TelaTokenInvalido motivo="expired" />
  }

  return <FormularioAceiteConvite convite={convite} token={params.token} />
}

// ─────────────────────────────────────────────────────────────────
// Tela de erro
// ─────────────────────────────────────────────────────────────────
function TelaTokenInvalido({ motivo }: { motivo: 'not_found' | 'expired' | 'already_used' }) {
  const mensagens = {
    not_found: {
      titulo: 'Convite não encontrado',
      descricao: 'Este link de convite não existe. Verifique se copiou o link corretamente.',
    },
    expired: {
      titulo: 'Convite expirado',
      descricao:
        'Este link de convite não é mais válido. Convites expiram em 72 horas após o envio.',
    },
    already_used: {
      titulo: 'Convite já utilizado',
      descricao: 'Este convite já foi aceito. Faça login com suas credenciais.',
    },
  }

  const { titulo, descricao } = mensagens[motivo]

  return (
    <div className="min-h-screen bg-[#F5F9FD] flex items-center justify-center px-4">
      {/* Pattern geométrico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 border-[60px] border-[#0E2E60]/5 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 border-[40px] border-[#00963A]/5 rounded-full -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/8 border border-[#D5E3F0] overflow-hidden">
          {/* Header */}
          <div className="bg-[#0E2E60] px-8 py-8 flex justify-center">
            <Logo variant="light" size="md" />
          </div>

          {/* Conteúdo */}
          <div className="px-8 py-10 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} className="text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-[#0E2E60] mb-3">{titulo}</h1>
            <p className="text-[#5A7089] leading-relaxed mb-8">{descricao}</p>

            {motivo !== 'already_used' && (
              <p className="text-sm text-[#5A7089] mb-8">
                Solicite um novo convite ao administrador do seu município.
              </p>
            )}

            <Link href="/login">
              <Button className="w-full bg-[#0E2E60] hover:bg-[#133878] h-12 font-semibold rounded-xl">
                {motivo === 'already_used' ? 'Fazer login' : 'Já tenho conta — Fazer login'}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Formulário de aceite
// ─────────────────────────────────────────────────────────────────
function FormularioAceiteConvite({
  convite,
  token,
}: {
  convite: NonNullable<ConviteData>
  token: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [erro, setErro] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const senha = watch('senha')
  const expiresFormatada = format(new Date(convite.expiresAt), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  })

  const onSubmit = (data: FormValues) => {
    setErro(null)
    startTransition(async () => {
      const result = await aceitarConviteAction({
        token,
        nome: data.nome,
        senha: data.senha,
        confirmarSenha: data.confirmarSenha,
      })

      if (result.sucesso) {
        router.push(result.redirectUrl)
      } else {
        setErro(result.erro)
      }
    })
  }

  return (
    <div className="min-h-screen bg-[#F5F9FD] flex items-center justify-center px-4 py-12">
      {/* Pattern geométrico */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 border-[60px] border-[#0E2E60]/5 rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 border-[40px] border-[#00963A]/5 rounded-full -translate-x-1/3 translate-y-1/3" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/8 border border-[#D5E3F0] overflow-hidden">
          {/* Header */}
          <div className="bg-[#0E2E60] px-8 py-8 text-center text-white">
            <Logo variant="light" size="md" className="justify-center mb-4" />
            <h1 className="text-xl font-bold">Você foi convidado!</h1>
            <p className="text-blue-200 text-sm mt-1">
              <span className="font-semibold text-white">{convite.nomeConvidadoPor}</span> convidou
              você para o município de{' '}
              <span className="font-semibold text-white">{convite.nomeMunicipio}</span>
            </p>
          </div>

          {/* Papel */}
          <div className="px-8 pt-6 pb-0 flex items-center gap-3 bg-[#EEF4FD] border-b border-[#D9E8FA]">
            <p className="text-xs text-[#5A7089] font-semibold uppercase tracking-wider py-3">
              Seu papel:
            </p>
            <PapelBadge papel={convite.papel} size="md" />
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-8 space-y-5">
            <p className="text-sm font-semibold text-[#0E2E60]">
              Complete seu cadastro para começar:
            </p>

            {erro && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {erro}
              </div>
            )}

            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                placeholder="Seu nome completo"
                className={cn(errors.nome && 'border-red-500')}
                {...register('nome')}
              />
              {errors.nome && <p className="text-xs text-red-500">{errors.nome.message}</p>}
            </div>

            {/* E-mail (readonly) */}
            <div className="space-y-1.5">
              <Label htmlFor="email-readonly">E-mail</Label>
              <Input
                id="email-readonly"
                value={convite.email}
                readOnly
                className="bg-[#EEF4FD] text-[#5A7089] cursor-not-allowed"
              />
            </div>

            {/* Senha */}
            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha *</Label>
              <PasswordInput
                id="senha"
                placeholder="Mínimo 8 caracteres"
                className={cn(errors.senha && 'border-red-500')}
                {...register('senha')}
              />
              {senha && <PasswordStrength password={senha} />}
              {errors.senha && <p className="text-xs text-red-500">{errors.senha.message}</p>}
            </div>

            {/* Confirmar senha */}
            <div className="space-y-1.5">
              <Label htmlFor="confirmarSenha">Confirmar senha *</Label>
              <PasswordInput
                id="confirmarSenha"
                placeholder="Repita a senha"
                className={cn(errors.confirmarSenha && 'border-red-500')}
                {...register('confirmarSenha')}
              />
              {errors.confirmarSenha && (
                <p className="text-xs text-red-500">{errors.confirmarSenha.message}</p>
              )}
            </div>

            {/* Termos */}
            <div className="space-y-1">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-neutral-300 accent-[#0E2E60]"
                  {...register('termos')}
                />
                <span className="text-sm text-[#5A7089] leading-snug">
                  Li e aceito os{' '}
                  <Link href="/termos" className="text-[#0E2E60] font-semibold hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link
                    href="/privacidade"
                    className="text-[#0E2E60] font-semibold hover:underline"
                  >
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
              {errors.termos && (
                <p className="text-xs text-red-500">{errors.termos.message}</p>
              )}
            </div>

            {/* Botão */}
            <Button
              type="submit"
              className="w-full h-12 bg-[#00963A] hover:bg-[#007A30] font-bold rounded-xl shadow-lg shadow-green-600/20"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={18} className="mr-2" />
                  Entrar no MerendaCheck
                </>
              )}
            </Button>

            {/* Expiração */}
            <p className="text-center text-xs text-[#5A7089]">
              Convite válido até:{' '}
              <span className="font-semibold text-[#0E2E60]">{expiresFormatada}</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
