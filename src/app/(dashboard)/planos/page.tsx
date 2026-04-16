import { getServerUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PLANOS_DETALHES } from "@/lib/constants";
import { Check, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default async function PlanosPage() {
  const user = await getServerUser();
  
  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId },
    select: { plano: true, planoStatus: true }
  });

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-blue-800">Escolha o plano ideal</h1>
          <p className="text-neutral-500 max-w-2xl mx-auto">
            Digitalize sua gestão de merenda escolar com a melhor ferramenta B2G do Brasil. 
            Escolha o plano que melhor atende às necessidades do seu município.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.entries(PLANOS_DETALHES).map(([key, p]) => {
            const isCurrent = tenant?.plano === key;
            const isTrial = tenant?.planoStatus === 'TRIAL';
            const isPopular = (p as any).destaque;

            return (
              <div 
                key={key} 
                className={cn(
                  "relative bg-white rounded-3xl p-8 border transition-all hover:shadow-xl hover:shadow-blue-900/5 flex flex-col",
                  isPopular ? "border-blue-800 ring-1 ring-blue-800 scale-105 z-10" : "border-neutral-200"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-800 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full flex items-center gap-2">
                    <Star size={12} fill="currentColor" />
                    Mais Popular
                  </div>
                )}

                {isCurrent && isTrial && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full">
                    Seu Plano Atual (Trial)
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-xl font-bold text-blue-800 mb-2">{p.nome}</h3>
                  <p className="text-sm text-neutral-500 leading-relaxed">{p.descricao}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-blue-800">
                      {p.preco ? `R$ ${p.preco}` : "Sob consulta"}
                    </span>
                    {p.preco && <span className="text-neutral-400 text-sm">/mês</span>}
                  </div>
                </div>

                <div className="flex-1 space-y-4 mb-8">
                  <div className="flex items-center gap-3 text-sm font-bold text-blue-800">
                    <Check size={18} className="text-green-600" />
                    Até {p.escolas} escolas
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-blue-800">
                    <Check size={18} className="text-green-600" />
                    Até {p.usuarios} usuários
                  </div>
                  {p.recursos.map((r, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm text-neutral-500">
                      <Check size={18} className="text-green-600 shrink-0" />
                      {r}
                    </div>
                  ))}
                </div>

                <Link 
                  href={`/planos/checkout?plano=${key}`}
                  className={cn(
                    "w-full h-12 rounded-xl flex items-center justify-center font-bold transition-all",
                    isPopular 
                      ? "bg-blue-800 text-white hover:bg-blue-700 shadow-lg shadow-blue-800/20" 
                      : "bg-neutral-100 text-blue-800 hover:bg-neutral-200"
                  )}
                >
                  {p.preco ? "Assinar este plano" : "Falar com consultor"}
                  <ArrowRight size={18} className="ml-2" />
                </Link>
              </div>
            );
          })}
        </div>

        <footer className="text-center space-y-6 pt-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 py-2 px-6 rounded-full text-sm font-medium">
            <Check size={18} className="text-green-600" />
            20% de desconto no pagamento anual
          </div>
          <p className="text-neutral-400 text-xs">
            TODO: Integrar Stripe no Sprint 18. Os pagamentos serão processados de forma segura.
          </p>
        </footer>
      </div>
    </div>
  );
}
