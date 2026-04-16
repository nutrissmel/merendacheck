"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { loginAction } from "@/actions/auth.actions";
import { Logo } from "@/components/shared/Logo";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loginAction(data);
      
      if (result.sucesso) {
        const redirect = searchParams.get("redirect") || result.redirectUrl;
        router.push(redirect);
      } else {
        setError(result.erro || "Erro inesperado ao entrar.");
      }
    } catch (e) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const erroParam = searchParams.get("erro");
  const sucessoParam = searchParams.get("sucesso");

  return (
    <AuthLayout>
      <div className="lg:hidden mb-8">
        <Logo size="md" />
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-blue-800 mb-2">
          Bem-vindo de volta
        </h2>
        <p className="text-neutral-500">
          Entre com suas credenciais para acessar o painel.
        </p>
      </div>

      {(error || erroParam) && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">
            {error || (erroParam === "conta-desativada" ? "Sua conta foi desativada. Contate o administrador." : "Erro ao entrar.")}
          </p>
        </div>
      )}

      {sucessoParam === "senha-alterada" && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 flex items-start gap-3 text-green-600 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">Sua senha foi alterada com sucesso. Faça login agora.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail institucional</Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
              <Mail size={18} />
            </div>
            <Input
              id="email"
              type="email"
              placeholder="ex: nutri@prefeitura.gov.br"
              className={cn("pl-10", errors.email && "border-red-500")}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link
              href="/esqueci-senha"
              className="text-xs font-semibold text-blue-800 hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <PasswordInput
            id="senha"
            placeholder="••••••••"
            className={cn(errors.senha && "border-red-500")}
            {...register("senha")}
          />
          {errors.senha && (
            <p className="text-xs text-red-500 mt-1">{errors.senha.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-blue-800 hover:bg-blue-700 h-12 text-base font-semibold group"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <>
              Entrar no sistema
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </>
          )}
        </Button>
      </form>

      <div className="mt-12 pt-6 border-t border-neutral-200 text-center">
        <p className="text-sm text-neutral-500">
          Feito para prefeituras brasileiras.
        </p>
      </div>
    </AuthLayout>
  );
}

function CheckCircle2({ className, size }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
