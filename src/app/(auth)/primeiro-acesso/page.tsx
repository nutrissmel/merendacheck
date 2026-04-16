"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle, CheckCircle2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { concluirPrimeiroAcessoAction } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const firstAccessSchema = z.object({
  senha: z.string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
    .regex(/[0-9]/, "Deve conter ao menos um número"),
  confirmacaoSenha: z.string(),
  termos: z.boolean().refine(v => v === true, "Você deve aceitar os termos"),
}).refine((data) => data.senha === data.confirmacaoSenha, {
  message: "As senhas não coincidem",
  path: ["confirmacaoSenha"],
});

type FirstAccessFormValues = z.infer<typeof firstAccessSchema>;

export default function FirstAccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FirstAccessFormValues>({
    resolver: zodResolver(firstAccessSchema),
    defaultValues: { termos: false }
  });

  const senha = watch("senha");

  const onSubmit = async (data: FirstAccessFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await concluirPrimeiroAcessoAction({ senha: data.senha });
      
      if (result.sucesso) {
        router.push("/dashboard");
      } else {
        setError(result.erro || "Erro ao configurar conta.");
      }
    } catch (e) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-blue-50 relative overflow-hidden">
      {/* Pattern de fundo */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hexagons" width="50" height="43.3" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
              <path d="M25 0L50 14.4V43.3L25 57.7L0 43.3V14.4L25 0z" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hexagons)" />
        </svg>
      </div>

      <Card className="w-full max-w-lg relative z-10 border-none shadow-2xl shadow-blue-900/10 rounded-3xl overflow-hidden">
        <div className="h-2 bg-blue-800" />
        <CardHeader className="text-center pt-10">
          <div className="w-20 h-20 bg-blue-800 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-800/20">
            <User size={40} />
          </div>
          <CardTitle className="text-3xl font-heading font-bold text-blue-800">
            Bem-vindo ao MerendaCheck
          </CardTitle>
          <CardDescription className="text-base text-neutral-500 mt-2">
            Olá! Este é o seu primeiro acesso. <br />
            Configure sua senha para começar a usar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-10 px-10">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <PasswordInput
                id="senha"
                placeholder="••••••••"
                className={cn(errors.senha && "border-red-500")}
                {...register("senha")}
              />
              <PasswordStrength password={senha} />
              {errors.senha && (
                <p className="text-xs text-red-500 mt-1">{errors.senha.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmacaoSenha">Confirmar nova senha</Label>
              <PasswordInput
                id="confirmacaoSenha"
                placeholder="••••••••"
                className={cn(errors.confirmacaoSenha && "border-red-500")}
                {...register("confirmacaoSenha")}
              />
              {errors.confirmacaoSenha && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmacaoSenha.message}</p>
              )}
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
              {errors.termos && (
                <p className="text-xs text-red-500">{errors.termos.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-700 h-12 text-base font-semibold shadow-lg shadow-blue-800/20"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Finalizar configuração"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
