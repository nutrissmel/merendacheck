"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { confirmarNovaSenhaAction } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";

const newPasswordSchema = z.object({
  senha: z.string()
    .min(8, "Mínimo de 8 caracteres")
    .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
    .regex(/[0-9]/, "Deve conter ao menos um número"),
  confirmacaoSenha: z.string(),
}).refine((data) => data.senha === data.confirmacaoSenha, {
  message: "As senhas não coincidem",
  path: ["confirmacaoSenha"],
});

type NewPasswordFormValues = z.infer<typeof newPasswordSchema>;

export default function NewPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
  });

  const senha = watch("senha");

  const onSubmit = async (data: NewPasswordFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await confirmarNovaSenhaAction(data);
      
      if (result.sucesso) {
        router.push("/login?sucesso=senha-alterada");
      } else {
        setError(result.erro || "Erro ao alterar senha.");
      }
    } catch (e) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-heading font-bold text-blue-800 mb-2">
          Nova senha
        </h2>
        <p className="text-neutral-500">
          Crie uma senha forte para proteger sua conta.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
          <AlertCircle className="shrink-0 mt-0.5" size={18} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <Button
          type="submit"
          className="w-full bg-blue-800 hover:bg-blue-700 h-12 text-base font-semibold"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            "Alterar senha e entrar"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
