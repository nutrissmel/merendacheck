import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { trialAtivo } from "@/lib/plano";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export async function TrialBanner() {
  try {
  const tenantId = await getTenantId();
  if (!tenantId) return null;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { planoStatus: true, trialExpiresAt: true }
  });

  if (!tenant || tenant.planoStatus !== 'TRIAL') return null;

  const { ativo, diasRestantes } = await trialAtivo(tenantId);

  const isUrgent = diasRestantes < 3;
  const isExpired = !ativo;

  return (
    <div className={cn(
      "w-full py-2 md:py-3 px-3 md:px-6 flex items-center justify-between gap-2 border-b transition-colors",
      isExpired ? "bg-red-600 border-red-700 text-white" :
      isUrgent ? "bg-red-50 border-red-100 text-red-800" :
      "bg-amber-50 border-amber-100 text-amber-800"
    )}>
      <div className="flex items-center gap-2 min-w-0">
        {isExpired ? <AlertTriangle size={16} className="shrink-0" /> : <Clock size={16} className="shrink-0" />}
        <p className="text-xs md:text-sm font-medium truncate">
          {isExpired ? (
            <>
              <span className="hidden sm:inline">Seu período de teste expirou. Assine um plano para continuar.</span>
              <span className="sm:hidden font-semibold">Trial expirado</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline">Trial gratuito: <strong>{diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}</strong></span>
              <span className="sm:hidden font-semibold">Trial: {diasRestantes}d restante{diasRestantes !== 1 ? 's' : ''}</span>
            </>
          )}
        </p>
      </div>

      <Link
        href="/planos"
        className={cn(
          "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 py-1 px-3 md:px-4 rounded-full transition-all shrink-0",
          isExpired ? "bg-white text-red-600 hover:bg-neutral-100" :
          isUrgent ? "bg-red-600 text-white hover:bg-red-700" :
          "bg-amber-500 text-white hover:bg-amber-600"
        )}
      >
        <span className="hidden sm:inline">{isExpired ? "Assinar agora" : "Escolher plano"}</span>
        <span className="sm:hidden">{isExpired ? "Assinar" : "Plano"}</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
  } catch {
    return null;
  }
}
