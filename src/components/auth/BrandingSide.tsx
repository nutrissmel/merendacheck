import { Logo } from "@/components/shared/Logo";
import { CheckCircle2 } from "lucide-react";

export function BrandingSide() {
  return (
    <div className="hidden lg:flex flex-col justify-between bg-blue-800 p-12 text-white relative overflow-hidden">
      {/* Pattern Geométrico */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10">
        <Logo variant="light" size="lg" className="mb-12" />
        
        <h1 className="text-4xl font-heading font-bold leading-tight mb-6">
          Conformidade e qualidade em cada prato servido.
        </h1>
        
        <ul className="space-y-6">
          <li className="flex items-start gap-3">
            <CheckCircle2 className="text-green-400 mt-1 shrink-0" size={24} />
            <div>
              <p className="font-semibold text-lg">Checklists PNAE digitalizados</p>
              <p className="text-blue-100">Agilidade e precisão técnica nas inspeções diárias.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="text-green-400 mt-1 shrink-0" size={24} />
            <div>
              <p className="font-semibold text-lg">Não conformidades com plano de ação</p>
              <p className="text-blue-100">Resolução rápida de problemas com rastreabilidade total.</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle2 className="text-green-400 mt-1 shrink-0" size={24} />
            <div>
              <p className="font-semibold text-lg">Dashboard em tempo real</p>
              <p className="text-blue-100">Visão estratégica da alimentação escolar do seu município.</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="relative z-10">
        <div className="bg-blue-700/50 rounded-2xl p-6 backdrop-blur-sm border border-blue-600">
          <p className="text-blue-100 text-sm mb-2">Trusted by</p>
          <p className="text-2xl font-bold">Já usado por mais de 50 municípios brasileiros.</p>
        </div>
      </div>
    </div>
  );
}
