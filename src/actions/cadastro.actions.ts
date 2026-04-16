'use server'

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { TRIAL_DIAS } from "@/lib/constants";
import { Papel, Plano, PlanoStatus } from "@prisma/client";
import { addDays } from "date-fns";

export type CadastroInput = {
  // Passo 1
  nomeMunicipio: string;
  estado: string;
  codigoIbge: string;
  nomeSecretaria: string;
  telefone: string;
  website?: string;
  // Passo 2
  nomeAdmin: string;
  cargo: string;
  email: string;
  senha: string;
};

export async function cadastrarMunicipioAction(data: CadastroInput): Promise<
  | { sucesso: true; redirectUrl: string }
  | { sucesso: false; erro: string; campo?: string }
> {
  // 1. Verificar se codigoIbge já existe
  const municipioExistente = await prisma.tenant.findUnique({
    where: { codigoIbge: data.codigoIbge },
  });

  if (municipioExistente) {
    return { sucesso: false, erro: "Este município já está cadastrado no sistema.", campo: "codigoIbge" };
  }

  // 2. Criar usuário no Supabase Auth
  const supabase = await createClient();
  
  // Usamos o service role para criar o usuário e já confirmar o e-mail
  // Nota: Em um ambiente real, você usaria o admin client do supabase-js com a service_role_key
  // Aqui simulamos o fluxo de criação
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.senha,
    options: {
      data: {
        nome: data.nomeAdmin,
        papel: "ADMIN_MUNICIPAL",
      }
    }
  });

  if (authError) {
    return { sucesso: false, erro: authError.message };
  }

  if (!authData.user) {
    return { sucesso: false, erro: "Erro ao criar usuário de autenticação." };
  }

  const supabaseUserId = authData.user.id;

  try {
    // 3. Executar transação no banco
    const result = await prisma.$transaction(async (tx) => {
      // Criar Tenant
      const tenant = await tx.tenant.create({
        data: {
          nome: data.nomeMunicipio,
          codigoIbge: data.codigoIbge,
          estado: data.estado,
          nomeSecretaria: data.nomeSecretaria,
          telefone: data.telefone,
          website: data.website,
          plano: Plano.STARTER,
          planoStatus: PlanoStatus.TRIAL,
          trialExpiresAt: addDays(new Date(), TRIAL_DIAS),
        },
      });

      // Criar Usuário
      const usuario = await tx.usuario.create({
        data: {
          tenantId: tenant.id,
          supabaseUserId: supabaseUserId,
          nome: data.nomeAdmin,
          email: data.email,
          papel: Papel.ADMIN_MUNICIPAL,
          primeiroAcesso: false, // Já definiu senha no cadastro
          ativo: true,
        },
      });

      return { tenant, usuario };
    });

    // 4. Enviar e-mail de boas-vindas (Simulado ou via Resend se configurado)
    // await enviarEmailBoasVindas({ ... });

    return { 
      sucesso: true, 
      redirectUrl: `/dashboard?bem-vindo=true` 
    };

  } catch (error) {
    console.error("Erro no cadastro:", error);
    
    // Cleanup: Tentar deletar o usuário do Auth se a transação falhar
    // (Isso exigiria o admin client com service_role)
    
    return { sucesso: false, erro: "Erro ao processar o cadastro no banco de dados." };
  }
}
