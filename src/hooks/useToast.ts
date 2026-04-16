"use client";

import { toast } from "sonner";

export function useAppToast() {
  return {
    sucesso: (mensagem: string) => toast.success(mensagem),
    erro: (mensagem: string) => toast.error(mensagem),
    info: (mensagem: string) => toast(mensagem),
    aviso: (mensagem: string) => toast.warning(mensagem),
  };
}
