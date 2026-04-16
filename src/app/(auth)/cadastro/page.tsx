"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Loader2, 
  Building2, 
  User, 
  ShieldCheck,
  Globe,
  Phone,
  Briefcase,
  Mail,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Logo } from "@/components/shared/Logo";
import { ESTADOS_BRASIL, EMAILS_BLOQUEADOS, PLANOS_DETALHES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { cadastrarMunicipioAction } from "@/actions/cadastro.actions";

// Schemas de validação
const passo1Schema = z.object({
  nomeMunicipio: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  estado: z.string().length(2, 'Selecione um estado'),
  codigoIbge: z.string().regex(/^\d{7}$/, 'IBGE deve ter 7 dígitos'),
  nomeSecretaria: z.string().min(5, 'Mínimo 5 caracteres').max(150),
  telefone: z.string().min(14, 'Telefone inválido'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
});

const passo2Schema = z.object({
  nomeAdmin: z.string().min(5, 'Nome completo obrigatório').max(100),
  cargo: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  email: z.string()
    .email('E-mail inválido')
    .refine(
      (email) => !EMAILS_BLOQUEADOS.some(d => email.toLowerCase().includes(d)),
      'Use um e-mail institucional (não gmail, hotmail, etc)'
    ),
  confirmarEmail: z.string().email(),
  senha: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Inclua pelo menos um número'),
  confirmarSenha: z.string(),
}).refine(d => d.email === d.confirmarEmail, {
  message: 'E-mails não conferem',
  path: ['confirmarEmail'],
}).refine(d => d.senha === d.confirmarSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarSenha'],
});

const passo3Schema = z.object({
  termos: z.boolean().refine(v => v === true, "Você deve aceitar os termos"),
});

type CadastroData = z.infer<typeof passo1Schema> & z.infer<typeof passo2Schema> & z.infer<typeof passo3Schema>;

export default function CadastroPage() {
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buscandoIbge, setBuscandoIbge] = useState(false);

  const fullSchema = z.object({
    ...passo1Schema.shape,
    ...passo2Schema.shape,
    ...passo3Schema.shape,
  });

  const form = useForm<CadastroData>({
    resolver: zodResolver(fullSchema),
    mode: "onChange",
    defaultValues: {
      termos: false,
    }
  });

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = form;

  const codigoIbge = watch("codigoIbge");
  const nomeMunicipio = watch("nomeMunicipio");
  const estado = watch("estado");
  const nomeAdmin = watch("nomeAdmin");
  const email = watch("email");

  // Busca automática de município por IBGE
  useEffect(() => {
    if (codigoIbge?.length === 7) {
      const buscarMunicipio = async () => {
        setBuscandoIbge(true);
        try {
          const res = await fetch(`/api/ibge/${codigoIbge}`);
          if (res.ok) {
            const data = await res.json();
            setValue("nomeMunicipio", data.nome, { shouldValidate: true });
            setValue("estado", data.uf, { shouldValidate: true });
          }
        } catch (e) {
          console.error("Erro ao buscar IBGE", e);
        } finally {
          setBuscandoIbge(false);
        }
      };
      buscarMunicipio();
    }
  }, [codigoIbge, setValue]);

  const onNext = async () => {
    const fieldsToValidate = passo === 1 
      ? ["nomeMunicipio", "estado", "codigoIbge", "nomeSecretaria", "telefone", "website"] 
      : ["nomeAdmin", "cargo", "email", "confirmarEmail", "senha", "confirmarSenha"];
    
    const isStepValid = await form.trigger(fieldsToValidate as any);
    if (isStepValid) setPasso(passo + 1);
  };

  const onSubmit = async (data: CadastroData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cadastrarMunicipioAction(data);
      if (result.sucesso) {
        router.push(result.redirectUrl);
      } else {
        setError((result as any).erro);
      }
    } catch (e) {
      setError("Erro inesperado ao realizar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, title: "Município", icon: Building2 },
    { id: 2, title: "Administrador", icon: User },
    { id: 3, title: "Confirmação", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-blue-50/50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-6 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-500">
            Já tem uma conta? 
            <Link href="/login" className="text-blue-800 font-bold hover:underline">Entrar</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-12 px-6">
        {/* Stepper */}
        <div className="w-full max-w-2xl mb-12">
          <div className="flex items-center justify-between relative">
            {/* Linha de fundo */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-neutral-200 -translate-y-1/2 z-0" />
            
            {steps.map((s) => (
              <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                  passo === s.id ? "bg-blue-800 border-blue-800 text-white shadow-lg shadow-blue-800/20" :
                  passo > s.id ? "bg-green-600 border-green-600 text-white" :
                  "bg-white border-neutral-200 text-neutral-400"
                )}>
                  {passo > s.id ? <Check size={20} /> : <s.icon size={20} />}
                </div>
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  passo === s.id ? "text-blue-800" : "text-neutral-400"
                )}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <p className="text-sm font-bold text-blue-800 uppercase tracking-widest">
              Passo {passo} de 3 — {passo === 1 ? "Dados do Município" : passo === 2 ? "Dados do Administrador" : "Plano e Confirmação"}
            </p>
          </div>
        </div>

        {/* Formulário */}
        <div className="w-full max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-neutral-100 overflow-hidden">
            <div className="p-8 sm:p-12">
              {error && (
                <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="shrink-0 mt-0.5" size={18} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <AnimatePresence mode="wait">
                {passo === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="codigoIbge">Código IBGE *</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            {buscandoIbge ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                          </div>
                          <Input
                            id="codigoIbge"
                            placeholder="7 dígitos"
                            className={cn("pl-10", errors.codigoIbge && "border-red-500")}
                            {...register("codigoIbge")}
                          />
                        </div>
                        {errors.codigoIbge && <p className="text-xs text-red-500">{errors.codigoIbge.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="estado">Estado *</Label>
                        <Select 
                          onValueChange={(v) => setValue("estado", v, { shouldValidate: true })}
                          value={estado}
                        >
                          <SelectTrigger className={cn(errors.estado && "border-red-500")}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_BRASIL.map((e) => (
                              <SelectItem key={e.uf} value={e.uf}>{e.nome}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.estado && <p className="text-xs text-red-500">{errors.estado.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nomeMunicipio">Nome do Município *</Label>
                      <Input
                        id="nomeMunicipio"
                        placeholder="Ex: Luziânia"
                        className={cn(errors.nomeMunicipio && "border-red-500")}
                        {...register("nomeMunicipio")}
                      />
                      {errors.nomeMunicipio && <p className="text-xs text-red-500">{errors.nomeMunicipio.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nomeSecretaria">Nome da Secretaria *</Label>
                      <Input
                        id="nomeSecretaria"
                        placeholder="Ex: Secretaria Municipal de Educação"
                        className={cn(errors.nomeSecretaria && "border-red-500")}
                        {...register("nomeSecretaria")}
                      />
                      {errors.nomeSecretaria && <p className="text-xs text-red-500">{errors.nomeSecretaria.message}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone de contato *</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            <Phone size={18} />
                          </div>
                          <Input
                            id="telefone"
                            placeholder="(XX) XXXXX-XXXX"
                            className={cn("pl-10", errors.telefone && "border-red-500")}
                            {...register("telefone")}
                          />
                        </div>
                        {errors.telefone && <p className="text-xs text-red-500">{errors.telefone.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Website (opcional)</Label>
                        <Input
                          id="website"
                          placeholder="https://..."
                          className={cn(errors.website && "border-red-500")}
                          {...register("website")}
                        />
                        {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {passo === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="nomeAdmin">Nome completo *</Label>
                        <Input
                          id="nomeAdmin"
                          placeholder="Seu nome"
                          className={cn(errors.nomeAdmin && "border-red-500")}
                          {...register("nomeAdmin")}
                        />
                        {errors.nomeAdmin && <p className="text-xs text-red-500">{errors.nomeAdmin.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cargo">Cargo *</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            <Briefcase size={18} />
                          </div>
                          <Input
                            id="cargo"
                            placeholder="Ex: Secretária de Educação"
                            className={cn("pl-10", errors.cargo && "border-red-500")}
                            {...register("cargo")}
                          />
                        </div>
                        {errors.cargo && <p className="text-xs text-red-500">{errors.cargo.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail institucional *</Label>
                        <div className="relative">
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                            <Mail size={18} />
                          </div>
                          <Input
                            id="email"
                            type="email"
                            placeholder="nutri@prefeitura.gov.br"
                            className={cn("pl-10", errors.email && "border-red-500")}
                            {...register("email")}
                          />
                        </div>
                        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmarEmail">Confirmar e-mail *</Label>
                        <Input
                          id="confirmarEmail"
                          type="email"
                          placeholder="Repita o e-mail"
                          className={cn(errors.confirmarEmail && "border-red-500")}
                          {...register("confirmarEmail")}
                        />
                        {errors.confirmarEmail && <p className="text-xs text-red-500">{errors.confirmarEmail.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="senha">Senha *</Label>
                        <PasswordInput
                          id="senha"
                          placeholder="••••••••"
                          className={cn(errors.senha && "border-red-500")}
                          {...register("senha")}
                        />
                        <PasswordStrength password={watch("senha")} />
                        {errors.senha && <p className="text-xs text-red-500">{errors.senha.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmarSenha">Confirmar senha *</Label>
                        <PasswordInput
                          id="confirmarSenha"
                          placeholder="••••••••"
                          className={cn(errors.confirmarSenha && "border-red-500")}
                          {...register("confirmarSenha")}
                        />
                        {errors.confirmarSenha && <p className="text-xs text-red-500">{errors.confirmarSenha.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {passo === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="bg-green-50 border border-green-100 rounded-2xl p-6 text-center">
                      <h3 className="text-xl font-bold text-green-800 mb-2">
                        🎉 Você está iniciando seu TRIAL GRATUITO de 14 dias!
                      </h3>
                      <p className="text-green-700 text-sm">
                        Acesso completo a todos os recursos sem cartão. <br />
                        Escolha seu plano quando quiser durante o período.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(PLANOS_DETALHES).map(([key, p]) => (
                        <div key={key} className={cn(
                          "p-4 rounded-xl border text-center transition-all",
                          key === "MUNICIPAL" ? "border-blue-800 bg-blue-50/50 ring-1 ring-blue-800" : "border-neutral-200 bg-white"
                        )}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">{p.nome}</p>
                          <p className="text-lg font-bold text-blue-800">R$ {p.preco || "---"}</p>
                          <p className="text-[10px] text-neutral-500">até {p.escolas} esc.</p>
                        </div>
                      ))}
                    </div>

                    <div className="bg-blue-50 rounded-2xl p-6 space-y-4">
                      <h4 className="font-bold text-blue-800 text-sm uppercase tracking-wider">Resumo do cadastro</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Município:</span>
                          <span className="font-semibold text-blue-800">{nomeMunicipio} — {estado}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Administrador:</span>
                          <span className="font-semibold text-blue-800">{nomeAdmin}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">E-mail:</span>
                          <span className="font-semibold text-blue-800">{email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-500">Trial gratuito:</span>
                          <span className="font-semibold text-green-600">14 dias a partir de hoje</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="termos"
                          className="mt-1 rounded border-neutral-300 text-blue-800 focus:ring-blue-800"
                          {...register("termos")}
                        />
                        <label htmlFor="termos" className="text-sm text-neutral-600 leading-tight">
                          Li e aceito os <Link href="/termos" className="text-blue-800 font-semibold hover:underline">Termos de Uso</Link> e <Link href="/privacidade" className="text-blue-800 font-semibold hover:underline">Política de Privacidade</Link>.
                        </label>
                      </div>
                      {errors.termos && <p className="text-xs text-red-500">{errors.termos.message}</p>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer do Card */}
            <div className="bg-neutral-50 p-8 border-t border-neutral-100 flex items-center justify-between">
              {passo > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="text-neutral-500 hover:text-blue-800"
                  onClick={() => setPasso(passo - 1)}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2" size={18} />
                  Voltar
                </Button>
              ) : (
                <div />
              )}

              {passo < 3 ? (
                <Button
                  type="button"
                  className="bg-blue-800 hover:bg-blue-700 px-8"
                  onClick={onNext}
                >
                  Continuar
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 px-8 shadow-lg shadow-green-600/20"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Criar minha conta"}
                </Button>
              )}
            </div>
          </form>
        </div>

        <p className="mt-12 text-sm text-neutral-500">
          © 2026 MerendaCheck — Todos os direitos reservados.
        </p>
      </main>
    </div>
  );
}
