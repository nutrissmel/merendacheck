"use client";

import { useEffect, useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, 
  School, 
  ClipboardCheck, 
  Users, 
  ArrowRight, 
  PartyPopper,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function WelcomeModal({ nomeMunicipio }: { nomeMunicipio: string }) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const isNew = searchParams.get("bem-vindo") === "true";
    const hasSeen = localStorage.getItem("merendacheck_welcome_seen");

    if (isNew && !hasSeen) {
      setOpen(true);
    }
  }, [searchParams]);

  const handleClose = () => {
    localStorage.setItem("merendacheck_welcome_seen", "true");
    setOpen(false);
    // Limpar a query param da URL sem recarregar
    const params = new URLSearchParams(searchParams.toString());
    params.delete("bem-vindo");
    router.replace(`/dashboard?${params.toString()}`);
  };

  const steps = [
    { 
      title: "Cadastre suas escolas", 
      desc: "Adicione as unidades que serão inspecionadas.", 
      icon: School, 
      href: "/escolas",
      color: "bg-blue-100 text-blue-800"
    },
    { 
      title: "Configure os checklists", 
      desc: "Personalize os critérios conforme o PNAE.", 
      icon: ClipboardCheck, 
      href: "/checklists",
      color: "bg-green-100 text-green-800"
    },
    { 
      title: "Convide sua equipe", 
      desc: "Adicione nutricionistas e diretores.", 
      icon: Users, 
      href: "/usuarios",
      color: "bg-amber-100 text-amber-800"
    },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
        <div className="bg-blue-800 p-8 text-center text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <PartyPopper size={32} className="text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">
              Bem-vindo ao MerendaCheck, {nomeMunicipio}!
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-base">
              Seu sistema está pronto. Siga os próximos passos para começar a digitalizar suas inspeções.
            </DialogDescription>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid gap-4">
            {steps.map((s, i) => (
              <Link 
                key={i} 
                href={s.href}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-neutral-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                onClick={handleClose}
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", s.color)}>
                  <s.icon size={24} />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-blue-800 text-sm">{s.title}</h4>
                  <p className="text-xs text-neutral-500">{s.desc}</p>
                </div>
                <ArrowRight size={18} className="text-neutral-300 group-hover:text-blue-800 transition-colors" />
              </Link>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Trial Ativo</p>
                <p className="text-sm text-amber-700">14 dias restantes</p>
              </div>
            </div>
            <div className="w-32 h-2 bg-amber-200 rounded-full overflow-hidden">
              <div className="w-full h-full bg-amber-500" />
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-0">
          <Button 
            onClick={handleClose}
            className="w-full bg-blue-800 hover:bg-blue-700 h-12 rounded-xl font-bold"
          >
            Começar a explorar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
