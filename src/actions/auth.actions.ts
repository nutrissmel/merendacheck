'use server'

import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getRedirectPorPapel } from "@/lib/auth";

export async function loginAction(data: { email: string; senha: string }) {
  try {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.senha,
  });

  if (error) {
    console.error('[loginAction] Supabase auth error:', error.message)
    return { sucesso: false, erro: error.message };
  }

  let usuario
  try {
    usuario = await prisma.usuario.findUnique({
      where: { supabaseUserId: authData.user.id },
    });
  } catch (dbErr) {
    console.error('[loginAction] Prisma error:', dbErr)
    return { sucesso: false, erro: 'Erro ao acessar banco de dados.' }
  }

  if (!usuario) {
    return { sucesso: false, erro: "Usuário não encontrado no sistema." };
  }

  if (!usuario.ativo) {
    await supabase.auth.signOut();
    return { sucesso: false, erro: "Sua conta foi desativada. Contate o administrador." };
  }

  // SUPER_ADMIN: sessão sem expiração (renovar automaticamente)
  if (usuario.papel === 'SUPER_ADMIN') {
    await supabase.auth.updateUser({
      data: { super_admin: true },
    })
  }

  const redirectUrl = usuario.papel === 'SUPER_ADMIN'
    ? '/super-admin'
    : usuario.primeiroAcesso
      ? '/primeiro-acesso'
      : getRedirectPorPapel(usuario.papel)

  return { sucesso: true, redirectUrl };
  } catch (e) {
    console.error('[loginAction] Unexpected error:', e)
    return { sucesso: false, erro: `Erro inesperado: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function solicitarResetSenhaAction(data: { email: string }) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/nova-senha`,
  });

  if (error) {
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true };
}

export async function confirmarNovaSenhaAction(data: { senha: string; confirmacaoSenha: string }) {
  if (data.senha !== data.confirmacaoSenha) {
    return { sucesso: false, erro: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: data.senha,
  });

  if (error) {
    return { sucesso: false, erro: error.message };
  }

  return { sucesso: true };
}

export async function concluirPrimeiroAcessoAction(data: { senha: string }) {
  const supabase = await createClient();
  
  // Atualizar senha no Auth
  const { data: { user }, error: authError } = await supabase.auth.updateUser({
    password: data.senha,
  });

  if (authError || !user) {
    return { sucesso: false, erro: authError?.message || "Erro ao atualizar senha." };
  }

  // Atualizar flag no banco
  await prisma.usuario.update({
    where: { supabaseUserId: user.id },
    data: { primeiroAcesso: false },
  });

  return { sucesso: true };
}
