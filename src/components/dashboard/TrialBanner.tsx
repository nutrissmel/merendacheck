import prisma from "@/lib/prisma";
import { getTenantId } from "@/lib/auth";
import { trialAtivo } from "@/lib/plano";
import Link from "next/link";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export async function TrialBanner() {
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
      "w-full py-3 px-6 flex items-center justify-between border-b transition-colors",
      isExpired ? "bg-red-600 border-red-700 text-white" :
      isUrgent ? "bg-red-50 border-red-100 text-red-800" :
      "bg-amber-50 border-amber-100 text-amber-800"
    )}>
      <div className="flex items-center gap-3">
        {isExpired ? <AlertTriangle size={18} /> : <Clock size={18} />}
        <p className="text-sm font-medium">
          {isExpired ? (
            "Seu período de teste expirou. Assine um plano para continuar acessando o sistema."
          ) : (
            <>
              Trial gratuito: <strong>{diasRestantes} {diasRestantes === 1 ? 'dia restante' : 'dias restantes'}</strong>
            </>
          )}
        </p>
      </div>

      <Link 
        href="/planos" 
        className={cn(
          "text-xs font-bold uppercase tracking-wider flex items-center gap-2 py-1.5 px-4 rounded-full transition-all",
          isExpired ? "bg-white text-red-600 hover:bg-neutral-100" :
          isUrgent ? "bg-red-600 text-white hover:bg-red-700" :
          "bg-amber-500 text-white hover:bg-amber-600"
        )}
      >
        {isExpired ? "Assinar agora" : "Escolher plano"}
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
