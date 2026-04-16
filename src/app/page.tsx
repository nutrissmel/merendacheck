import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  CheckCircle2, 
  School, 
  ClipboardCheck, 
  Users, 
  ShieldCheck, 
  Zap, 
  BarChart3, 
  Globe,
  PlayCircle
} from "lucide-react";
import Link from "next/link";
import { PLANOS_DETALHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md border-b border-neutral-100 z-50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-blue-800">
            <Link href="#recursos" className="hover:text-blue-600 transition-colors">Recursos</Link>
            <Link href="#planos" className="hover:text-blue-600 transition-colors">Planos</Link>
            <Link href="#contato" className="hover:text-blue-600 transition-colors">Contato</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-bold text-blue-800 hover:underline">Entrar</Link>
            <Link href="/cadastro">
              <Button className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-full shadow-lg shadow-green-600/20">
                Começar Trial Gratuito
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-blue-800 text-white relative overflow-hidden">
        {/* Pattern Geométrico */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] border-[40px] border-white rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] border-[20px] border-white rounded-full -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 py-2 px-4 rounded-full text-xs font-bold uppercase tracking-widest">
              <Zap size={14} className="text-amber-400 fill-amber-400" />
              Gestão Inteligente de Merenda Escolar
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold font-heading leading-tight">
              Digitalize as inspeções de merenda do seu município.
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed max-w-xl">
              A ferramenta B2G mais completa para nutricionistas e gestores públicos. 
              Conformidade com o PNAE, relatórios em tempo real e gestão multi-escola.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/cadastro" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white h-14 px-10 text-lg font-bold rounded-2xl shadow-xl shadow-green-900/20">
                  Começar Trial Gratuito
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Button variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/10 h-14 px-10 text-lg font-bold rounded-2xl">
                <PlayCircle size={20} className="mr-2" />
                Ver Demonstração
              </Button>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 shadow-2xl">
              <div className="bg-white rounded-2xl overflow-hidden shadow-inner aspect-[16/10] flex items-center justify-center text-blue-800">
                <BarChart3 size={120} className="opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logos Section */}
      <section className="py-12 border-b border-neutral-100 bg-neutral-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-8">
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Desenvolvido para prefeituras brasileiras</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-2 font-bold text-xl text-blue-800">
                <Globe size={24} />
                MUNICÍPIO {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="recursos" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-blue-800">Tudo o que você precisa em um só lugar</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">
              Módulos integrados para garantir a qualidade da alimentação escolar em toda a rede municipal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Checklists PNAE", desc: "Critérios técnicos atualizados conforme as normas federais.", icon: ClipboardCheck, color: "bg-blue-100 text-blue-800" },
              { title: "Dashboard em Tempo Real", desc: "Visualize a conformidade de todas as escolas em um só painel.", icon: BarChart3, color: "bg-green-100 text-green-800" },
              { title: "Não Conformidades", desc: "Registre e acompanhe a resolução de problemas críticos.", icon: ShieldCheck, color: "bg-red-100 text-red-600" },
              { title: "Gestão Multi-escola", desc: "Controle centralizado para municípios de qualquer tamanho.", icon: School, color: "bg-amber-100 text-amber-800" },
              { title: "Equipe e Usuários", desc: "Níveis de acesso para nutricionistas, diretores e merendeiras.", icon: Users, color: "bg-purple-100 text-purple-800" },
              { title: "Relatórios PDF", desc: "Gere relatórios técnicos profissionais com apenas um clique.", icon: CheckCircle2, color: "bg-neutral-100 text-neutral-800" },
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-3xl border border-neutral-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all group">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", f.color)}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">{f.title}</h3>
                <p className="text-neutral-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section id="planos" className="py-24 px-6 bg-neutral-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-blue-800">Planos que cabem no seu orçamento</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto">
              Transparência total. Escolha o plano ideal para o tamanho do seu município.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(PLANOS_DETALHES).map(([key, p]) => (
              <div key={key} className={cn(
                "bg-white p-8 rounded-3xl border transition-all flex flex-col",
                (p as any).destaque ? "border-blue-800 ring-1 ring-blue-800 shadow-xl shadow-blue-900/10" : "border-neutral-200"
              )}>
                <h3 className="text-xl font-bold text-blue-800 mb-2">{p.nome}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-blue-800">{p.preco ? `R$ ${p.preco}` : "Sob consulta"}</span>
                  {p.preco && <span className="text-neutral-400 text-sm">/mês</span>}
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm font-bold text-blue-800">
                    <CheckCircle2 size={16} className="text-green-600" />
                    Até {p.escolas} escolas
                  </li>
                  {p.recursos.slice(0, 3).map((r, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-500">
                      <CheckCircle2 size={16} className="text-green-600" />
                      {r}
                    </li>
                  ))}
                </ul>
                <Link href="/cadastro">
                  <Button className={cn(
                    "w-full rounded-xl font-bold",
                    (p as any).destaque ? "bg-blue-800 hover:bg-blue-700" : "bg-neutral-100 text-blue-800 hover:bg-neutral-200"
                  )}>
                    Começar Agora
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-blue-800 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Logo size="md" />
            <p className="text-blue-100 max-w-sm">
              A plataforma definitiva para gestão da alimentação escolar em municípios brasileiros. 
              Conformidade, transparência e saúde para nossos alunos.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-xs text-blue-300">Produto</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link href="#recursos" className="hover:text-white">Recursos</Link></li>
              <li><Link href="#planos" className="hover:text-white">Planos</Link></li>
              <li><Link href="/login" className="hover:text-white">Entrar</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-widest text-xs text-blue-300">Suporte</h4>
            <ul className="space-y-2 text-sm text-blue-100">
              <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
              <li><Link href="/privacidade" className="hover:text-white">Privacidade</Link></li>
              <li><Link href="mailto:contato@merendacheck.com.br" className="hover:text-white">Contato</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/10 text-center text-xs text-blue-300">
          © 2026 MerendaCheck — Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
