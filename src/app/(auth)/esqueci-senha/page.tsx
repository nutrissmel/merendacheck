"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { solicitarResetSenhaAction } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await solicitarResetSenhaAction(data);
      
      if (result.sucesso) {
        setSuccess(true);
        setEmailSent(data.email);
      } else {
        setError(result.erro || "Erro ao solicitar recuperação.");
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
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-semibold text-blue-800 hover:gap-2 transition-all gap-1 mb-6"
        >
          <ArrowLeft size={16} />
          Voltar para o login
        </Link>
        <h2 className="text-3xl font-heading font-bold text-blue-800 mb-2">
          Recuperar senha
        </h2>
        <p className="text-neutral-500">
          Enviaremos um link para você redefinir sua senha.
        </p>
      </div>

      {success ? (
        <div className="p-6 rounded-2xl bg-green-50 border border-green-100 text-center animate-in zoom-in-95 duration-300">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-green-800 mb-2">E-mail enviado!</h3>
          <p className="text-sm text-green-700 mb-6">
            Enviamos um link de recuperação para <strong>{emailSent}</strong>. 
            Verifique sua caixa de entrada e pasta de spam.
          </p>
          <Button
            variant="outline"
            className="w-full border-green-200 text-green-700 hover:bg-green-100"
            onClick={() => setSuccess(false)}
          >
            Tentar outro e-mail
          </Button>
        </div>
      ) : (
        <>
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-600">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail cadastrado</Label>
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

            <Button
              type="submit"
              className="w-full bg-blue-800 hover:bg-blue-700 h-12 text-base font-semibold"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                "Enviar link de recuperação"
              )}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}
