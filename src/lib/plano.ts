import prisma from "@/lib/prisma";
import { Plano } from "@prisma/client";
import { differenceInDays, isAfter } from "date-fns";

export const LIMITES_PLANO = {
  STARTER:     { escolas: 10,  usuarios: 30  },
  CRESCIMENTO: { escolas: 30,  usuarios: 100 },
  MUNICIPAL:   { escolas: 100, usuarios: 9999 },
  ENTERPRISE:  { escolas: 9999, usuarios: 9999 },
} as const;

export async function podeAdicionarEscola(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plano: true },
  });

  if (!tenant) return { pode: false, atual: 0, limite: 0, plano: Plano.STARTER };

  const atual = await prisma.escola.count({ where: { tenantId } });
  const limite = LIMITES_PLANO[tenant.plano as keyof typeof LIMITES_PLANO].escolas;

  return {
    pode: atual < limite,
    atual,
    limite,
    plano: tenant.plano,
  };
}

export async function podeAdicionarUsuario(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { plano: true },
  });

  if (!tenant) return { pode: false, atual: 0, limite: 0, plano: Plano.STARTER };

  const atual = await prisma.usuario.count({ where: { tenantId } });
  const limite = LIMITES_PLANO[tenant.plano as keyof typeof LIMITES_PLANO].usuarios;

  return {
    pode: atual < limite,
    atual,
    limite,
    plano: tenant.plano,
  };
}

export async function trialAtivo(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { trialExpiresAt: true, planoStatus: true },
  });

  if (!tenant || !tenant.trialExpiresAt) {
    return { ativo: false, diasRestantes: 0, expiresAt: null };
  }

  const ativo = isAfter(new Date(tenant.trialExpiresAt), new Date());
  const diasRestantes = Math.max(0, differenceInDays(new Date(tenant.trialExpiresAt), new Date()));

  return {
    ativo,
    diasRestantes,
    expiresAt: tenant.trialExpiresAt,
  };
}
