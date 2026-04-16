'use client'

import { useState, useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Loader2, Save, LogOut, CheckCircle2, Settings, Bell, Mail, Smartphone } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { PapelBadge, PAPEL_AVATAR_COLOR } from '@/components/shared/PapelBadge'
import { alterarNomeAction, alterarSenhaAction } from '@/actions/usuario.actions'
import { logoutAction } from '@/actions/auth.actions'
import { buscarPreferencias, salvarPreferencias } from '@/actions/notificacoes.actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Papel } from '@prisma/client'
import type { PrefsNotif } from '@/actions/notificacoes.actions'

type UserInfo = {
  nome: string
  email: string
  papel: Papel
  nomeMunicipio: string
  estado: string
  createdAt: string
}

const nomeSchema = z.object({
  nome: z.string().min(3, 'Mínimo 3 caracteres').max(100),
})

const senhaSchema = z
  .object({
    senhaAtual: z.string().min(1, 'Obrigatório'),
    novaSenha: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
      .regex(/[0-9]/, 'Inclua pelo menos um número'),
    confirmarNovaSenha: z.string(),
  })
  .refine((d) => d.novaSenha === d.confirmarNovaSenha, {
    message: 'As senhas não conferem',
    path: ['confirmarNovaSenha'],
  })

type NomeValues = z.infer<typeof nomeSchema>
type SenhaValues = z.infer<typeof senhaSchema>

export default function PerfilPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/perfil')
      .then((r) => r.json())
      .then((d) => { setUser(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="animate-spin text-[#0E2E60]" size={32} />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-24 text-[#5A7089]">
        Erro ao carregar perfil.
      </div>
    )
  }

  return <PerfilContent user={user} />
}

function PerfilContent({ user }: { user: UserInfo }) {
  const [nomeAtual, setNomeAtual] = useState(user.nome)
  const [isPendingNome, startNome] = useTransition()
  const [isPendingSenha, startSenha] = useTransition()
  const { theme, setTheme } = useTheme()
  const [prefs, setPrefs] = useState<PrefsNotif | null>(null)
  const [salvandoPrefs, setSalvandoPrefs] = useState(false)

  useEffect(() => {
    buscarPreferencias().then(setPrefs).catch(() => {})
  }, [])

  async function handleSalvarPrefs() {
    if (!prefs) return
    setSalvandoPrefs(true)
    const res = await salvarPreferencias(prefs)
    setSalvandoPrefs(false)
    if (res.sucesso) toast.success('Preferências salvas!')
    else toast.error(res.erro ?? 'Erro ao salvar')
  }

  function togglePref(key: keyof PrefsNotif) {
    setPrefs((p) => p ? { ...p, [key]: !p[key] } : p)
  }

  const nomeForm = useForm<NomeValues>({
    resolver: zodResolver(nomeSchema),
    defaultValues: { nome: user.nome },
  })

  const senhaForm = useForm<SenhaValues>({
    resolver: zodResolver(senhaSchema),
  })

  const novaSenha = senhaForm.watch('novaSenha')
  const avatarColor = PAPEL_AVATAR_COLOR[user.papel]

  const onSaveNome = (data: NomeValues) => {
    startNome(async () => {
      const result = await alterarNomeAction(data)
      if ('erro' in result) {
        toast.error(result.erro)
        return
      }
      setNomeAtual(data.nome)
      toast.success('Nome atualizado com sucesso!')
    })
  }

  const onSaveSenha = (data: SenhaValues) => {
    startSenha(async () => {
      const result = await alterarSenhaAction(data)
      if ('erro' in result) {
        toast.error(result.erro)
        if ('campo' in result && result.campo) {
          senhaForm.setError(result.campo as any, { message: result.erro })
        }
        return
      }
      toast.success('Senha alterada com sucesso!')
      senhaForm.reset()
    })
  }

  const membroDesde = format(new Date(user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0E2E60]">Meu Perfil</h1>
        <p className="text-sm text-[#5A7089] mt-1">Gerencie suas informações pessoais e senha.</p>
      </div>

      {/* Card de identidade */}
      <div className="bg-white rounded-2xl border border-[#D5E3F0] p-8">
        <div className="flex items-center gap-6">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shrink-0"
            style={{ backgroundColor: avatarColor }}
          >
            {nomeAtual.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-[#0F1B2D]">{nomeAtual}</h2>
            <PapelBadge papel={user.papel} size="md" />
            <p className="text-sm text-[#5A7089]">{user.email}</p>
            <p className="text-sm text-[#5A7089]">
              {user.nomeMunicipio} — {user.estado}
            </p>
            <p className="text-xs text-[#5A7089]">Membro desde {membroDesde}</p>
          </div>
        </div>
      </div>

      {/* Alterar nome */}
      <div className="bg-white rounded-2xl border border-[#D5E3F0] p-6">
        <h3 className="text-base font-bold text-[#0E2E60] mb-5">Alterar nome</h3>
        <form onSubmit={nomeForm.handleSubmit(onSaveNome)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              className={cn(nomeForm.formState.errors.nome && 'border-red-500')}
              {...nomeForm.register('nome')}
            />
            {nomeForm.formState.errors.nome && (
              <p className="text-xs text-red-500">{nomeForm.formState.errors.nome.message}</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#0E2E60] hover:bg-[#133878] gap-2"
              disabled={isPendingNome}
            >
              {isPendingNome ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Salvar nome
            </Button>
          </div>
        </form>
      </div>

      {/* Alterar senha */}
      <div className="bg-white rounded-2xl border border-[#D5E3F0] p-6">
        <h3 className="text-base font-bold text-[#0E2E60] mb-5">Alterar senha</h3>
        <form onSubmit={senhaForm.handleSubmit(onSaveSenha)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <PasswordInput
              id="senhaAtual"
              placeholder="••••••••"
              className={cn(senhaForm.formState.errors.senhaAtual && 'border-red-500')}
              {...senhaForm.register('senhaAtual')}
            />
            {senhaForm.formState.errors.senhaAtual && (
              <p className="text-xs text-red-500">
                {senhaForm.formState.errors.senhaAtual.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <PasswordInput
              id="novaSenha"
              placeholder="Mínimo 8 caracteres"
              className={cn(senhaForm.formState.errors.novaSenha && 'border-red-500')}
              {...senhaForm.register('novaSenha')}
            />
            {novaSenha && <PasswordStrength password={novaSenha} />}
            {senhaForm.formState.errors.novaSenha && (
              <p className="text-xs text-red-500">
                {senhaForm.formState.errors.novaSenha.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmarNovaSenha">Confirmar nova senha</Label>
            <PasswordInput
              id="confirmarNovaSenha"
              placeholder="Repita a nova senha"
              className={cn(senhaForm.formState.errors.confirmarNovaSenha && 'border-red-500')}
              {...senhaForm.register('confirmarNovaSenha')}
            />
            {senhaForm.formState.errors.confirmarNovaSenha && (
              <p className="text-xs text-red-500">
                {senhaForm.formState.errors.confirmarNovaSenha.message}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-[#0E2E60] hover:bg-[#133878] gap-2"
              disabled={isPendingSenha}
            >
              {isPendingSenha ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Alterar senha
            </Button>
          </div>
        </form>
      </div>

      {/* Preferências */}
      <div className="bg-white rounded-2xl border border-[#D5E3F0] p-6">
        <h3 className="text-base font-bold text-[#0E2E60] mb-5 flex items-center gap-2">
          <Settings size={16} />
          Preferências
        </h3>

        <div className="space-y-6">
          {/* Tema */}
          <div>
            <p className="text-sm font-semibold text-[#0F1B2D] mb-3">Tema</p>
            <div className="flex flex-col gap-2">
              {[
                { value: 'light', label: 'Claro' },
                { value: 'dark',  label: 'Escuro' },
                { value: 'system', label: 'Sistema' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="tema"
                    value={value}
                    checked={theme === value}
                    onChange={() => setTheme(value)}
                    className="accent-[#0E2E60]"
                  />
                  <span className="text-sm text-[#0F1B2D]">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notificações granulares */}
          {prefs && (
            <div>
              <p className="text-sm font-semibold text-[#0F1B2D] mb-3 flex items-center gap-2">
                <Bell size={14} /> Preferências de notificação
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#EEF4FD]">
                      <th className="text-left py-2 font-semibold text-[#5A7089]">Evento</th>
                      <th className="text-center py-2 w-16 font-semibold text-[#5A7089]">
                        <Mail size={12} className="inline mr-1" />E-mail
                      </th>
                      <th className="text-center py-2 w-16 font-semibold text-[#5A7089]">
                        <Smartphone size={12} className="inline mr-1" />Push
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EEF4FD]">
                    {([
                      { label: 'NC crítica criada',     emailKey: 'emailNcCritica',         pushKey: 'pushNcCritica' },
                      { label: 'NC resolvida',          emailKey: 'emailNcResolvida',        pushKey: 'pushNcResolvida' },
                      { label: 'NC vencida',            emailKey: 'emailNcVencida',          pushKey: 'pushNcVencida' },
                      { label: 'Inspeção reprovada',    emailKey: 'emailInspecaoReprovada',  pushKey: 'pushInspecaoReprovada' },
                      { label: 'Lembrete agendamento',  emailKey: 'emailAgendamento',        pushKey: 'pushAgendamento' },
                    ] as { label: string; emailKey: keyof PrefsNotif; pushKey: keyof PrefsNotif }[]).map((row) => (
                      <tr key={row.emailKey}>
                        <td className="py-2.5 text-[#0F1B2D]">{row.label}</td>
                        <td className="py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={!!prefs[row.emailKey]}
                            onChange={() => togglePref(row.emailKey)}
                            className="accent-[#0E2E60] w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={!!prefs[row.pushKey]}
                            onChange={() => togglePref(row.pushKey)}
                            className="accent-[#0E2E60] w-4 h-4 cursor-pointer"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={handleSalvarPrefs}
                  disabled={salvandoPrefs}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0E2E60] text-white text-sm font-semibold hover:bg-[#133878] transition-colors disabled:opacity-50"
                >
                  {salvandoPrefs ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Salvar preferências
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sair */}
      <div className="bg-white rounded-2xl border border-[#D5E3F0] p-6">
        <h3 className="text-base font-bold text-[#0E2E60] mb-2">Sair da conta</h3>
        <p className="text-sm text-[#5A7089] mb-4">
          Você será redirecionado para a tela de login.
        </p>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 gap-2"
          >
            <LogOut size={16} />
            Sair da conta
          </Button>
        </form>
      </div>
    </div>
  )
}
