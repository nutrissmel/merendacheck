import { Logo } from "@/components/shared/Logo"
import Link from "next/link"
import { PLANOS_DETALHES } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  ArrowRight,
  CheckCircle2,
  Check,
  School,
  ClipboardCheck,
  Users,
  Zap,
  BarChart3,
  AlertTriangle,
  Calendar,
  FileText,
  Smartphone,
  Bell,
  Lock,
  Building2,
  Download,
  WifiOff,
  ChevronRight,
} from "lucide-react"

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Checklists PNAE",
    description:
      "Critérios técnicos pré-configurados conforme as normas do Programa Nacional de Alimentação Escolar. Execute inspeções completas com validação passo a passo.",
    color: "bg-blue-50 text-blue-800",
    items: ["Critérios FNDE/PNAE incluídos", "Múltiplas seções por checklist", "Fotos e observações por item", "Assinatura digital do responsável"],
  },
  {
    icon: BarChart3,
    title: "Dashboard Analítico",
    description:
      "Visualize em tempo real a conformidade de toda a rede municipal. Gráficos de tendência, ranking de escolas e alertas automáticos.",
    color: "bg-green-50 text-green-700",
    items: ["Conformidade histórica e heatmap", "Ranking das escolas monitoradas", "KPIs atualizados em tempo real", "Filtros por escola e período"],
  },
  {
    icon: AlertTriangle,
    title: "Gestão de Não Conformidades",
    description:
      "Registre NCs com severidade, prazo de resolução e responsável. Acompanhe o ciclo completo de abertura até resolução com histórico auditável.",
    color: "bg-red-50 text-red-600",
    items: ["Severidade: Crítica, Alta, Média, Baixa", "Prazo automático por severidade", "Notificações push de vencimento", "Histórico completo de ações"],
  },
  {
    icon: Calendar,
    title: "Agendamentos Automáticos",
    description:
      "Programe inspeções recorrentes e nunca perca uma visita. O sistema calcula automaticamente a próxima execução e notifica toda a equipe.",
    color: "bg-amber-50 text-amber-700",
    items: ["Recorrência configurável", "Notificação prévia automática", "Controle de pendências do dia", "Histórico de execuções"],
  },
  {
    icon: FileText,
    title: "Relatórios Profissionais",
    description:
      "Exporte relatórios técnicos em PDF ou Excel com um clique. Layouts prontos para prestação de contas à FNDE e ao Conselho de Alimentação Escolar.",
    color: "bg-purple-50 text-purple-700",
    items: ["PDF e Excel em 1 clique", "Layout técnico para FNDE", "Filtros por período e escola", "Histórico completo de inspeções"],
  },
  {
    icon: WifiOff,
    title: "Funciona Offline",
    description:
      "Realize inspeções mesmo sem conexão à internet. Os dados sincronizam automaticamente quando a rede é restaurada — perfeito para escolas rurais.",
    color: "bg-neutral-100 text-neutral-900",
    items: ["PWA instalável no celular", "Sincronização automática", "Funciona em redes 2G/3G", "Dados protegidos localmente"],
  },
]

const STEPS = [
  {
    step: "01",
    icon: Building2,
    title: "Configure seu município",
    desc: "Cadastre as escolas, configure os usuários com os papéis adequados (nutricionista, diretor, merendeira) e personalize os checklists PNAE para sua realidade.",
  },
  {
    step: "02",
    icon: ClipboardCheck,
    title: "Execute as inspeções",
    desc: "Nutricionistas e merendeiras realizam inspeções guiadas pelo sistema, com critérios técnicos pré-configurados e registro imediato de não conformidades.",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Monitore e reporte",
    desc: "Acompanhe a conformidade de toda a rede em tempo real, gerencie NCs por prioridade e exporte relatórios técnicos para prestação de contas.",
  },
]

const ROLES = [
  {
    role: "Administrador Municipal",
    desc: "Visão completa de todas as escolas, dashboard analítico, gestão de equipe e relatórios consolidados do município.",
    icon: Building2,
  },
  {
    role: "Nutricionista",
    desc: "Criação e gestão de checklists, execução de inspeções, acompanhamento de NCs e geração de relatórios técnicos.",
    icon: ClipboardCheck,
  },
  {
    role: "Diretor de Escola",
    desc: "Acompanhamento em tempo real das inspeções e não conformidades da própria escola, sem acesso a outras unidades.",
    icon: School,
  },
  {
    role: "Merendeira",
    desc: "Execução guiada de checklists diários com interface simplificada, otimizada para uso em tablet e celular.",
    icon: Users,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── Navbar ──────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md border-b border-neutral-200 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-neutral-500">
            <Link href="#recursos" className="hover:text-blue-800 transition-colors">
              Recursos
            </Link>
            <Link href="#como-funciona" className="hover:text-blue-800 transition-colors">
              Como Funciona
            </Link>
            <Link href="#planos" className="hover:text-blue-800 transition-colors">
              Planos
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-neutral-500 hover:text-blue-800 transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm shadow-green-600/20 transition-colors"
            >
              Trial Gratuito
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="pt-16 bg-blue-800 overflow-hidden relative">
        {/* Background decor */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-48 -right-48 w-[700px] h-[700px] rounded-full bg-blue-700/40 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-green-600/8 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-36 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Copy */}
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                <Zap size={12} className="fill-green-400" />
                Plataforma certificada PNAE
              </div>

              <h1 className="text-5xl lg:text-[3.5rem] font-bold font-heading text-white leading-[1.1] tracking-tight">
                Gestão profissional da{" "}
                <span className="text-green-400">merenda escolar</span> do seu
                município.
              </h1>

              <p className="text-xl text-blue-100 leading-relaxed max-w-lg">
                Da inspeção ao relatório final — tudo em uma plataforma. Conformidade
                com o PNAE, gestão de não conformidades e dashboard analítico para
                toda a rede escolar.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-xl shadow-green-900/30 transition-colors"
                >
                  Começar Trial Gratuito
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-2xl text-lg border border-white/20 transition-colors"
                >
                  Ver como funciona
                </Link>
              </div>

              <div className="flex items-center gap-6 pt-2 flex-wrap">
                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  14 dias grátis, sem cartão
                </div>
                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  Setup em menos de 5 minutos
                </div>
                <div className="flex items-center gap-2 text-blue-200 text-sm">
                  <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  Suporte em português
                </div>
              </div>
            </div>

            {/* Real UI Preview */}
            <div className="hidden lg:block relative">
              <div className="bg-white/[0.07] backdrop-blur-xl border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
                {/* Header bar */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white/90">
                    Dashboard — Prefeitura Municipal
                  </div>
                  <div className="text-xs text-blue-300 bg-white/10 px-3 py-1 rounded-lg">
                    Hoje, Abr 2026
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Conformidade", value: "94,2%", detail: "↑ 2.1% este mês", dc: "text-green-400" },
                    { label: "Escolas ativas", value: "48", detail: "monitoradas", dc: "text-blue-300" },
                    { label: "NCs Abertas", value: "3", detail: "2 críticas", dc: "text-red-400" },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white/10 rounded-2xl p-3 space-y-1">
                      <div className="text-[11px] text-blue-300">{kpi.label}</div>
                      <div className="text-xl font-bold text-white">{kpi.value}</div>
                      <div className={cn("text-[11px]", kpi.dc)}>{kpi.detail}</div>
                    </div>
                  ))}
                </div>

                {/* Inspection card */}
                <div className="bg-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">EMEF João Paulo II</div>
                      <div className="text-[11px] text-blue-300 mt-0.5">Inspeção #482 · Cozinha Principal</div>
                    </div>
                    <div className="bg-green-500/20 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full border border-green-500/30">
                      87% conforme
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      { item: "Higiene e limpeza dos equipamentos", ok: true },
                      { item: "Temperatura de armazenamento (≤ 4°C)", ok: true },
                      { item: "Controle de pragas e vetores", ok: true },
                      { item: "Validade dos gêneros alimentícios", ok: false },
                    ].map((row) => (
                      <div key={row.item} className="flex items-center gap-2.5 text-xs">
                        <div
                          className={cn(
                            "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                            row.ok ? "bg-green-500/30" : "bg-red-500/30"
                          )}
                        >
                          {row.ok ? (
                            <Check size={9} className="text-green-400" />
                          ) : (
                            <span className="text-red-400 text-[8px] font-black leading-none">!</span>
                          )}
                        </div>
                        <span className={row.ok ? "text-blue-100" : "text-red-300"}>{row.item}</span>
                        {!row.ok && (
                          <span className="ml-auto text-red-400 font-bold text-[10px] uppercase tracking-wide">NC</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert + Schedule row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-500/15 border border-amber-500/25 rounded-xl p-3 flex items-start gap-2">
                    <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-bold text-amber-300">NC Crítica</div>
                      <div className="text-[11px] text-amber-200/70 mt-0.5">Prazo: 2 dias</div>
                    </div>
                  </div>
                  <div className="bg-blue-600/30 border border-blue-400/20 rounded-xl p-3 flex items-start gap-2">
                    <Bell size={13} className="text-blue-300 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-bold text-blue-200">Agendamento</div>
                      <div className="text-[11px] text-blue-300/70 mt-0.5">Amanhã, 09h00</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-green-600 text-white rounded-2xl px-4 py-3 shadow-xl shadow-green-900/40 text-sm font-bold flex items-center gap-2">
                <Download size={15} />
                Relatório PDF gerado
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 mt-8" />
      </section>

      {/* ─── Stats Bar ───────────────────────────────────────────── */}
      <section className="py-16 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-neutral-200">
            {[
              {
                value: "PNAE",
                label: "Conformidade garantida",
                desc: "Critérios atualizados conforme FNDE",
              },
              {
                value: "5 min",
                label: "Para o primeiro setup",
                desc: "Onboarding guiado do início ao fim",
              },
              {
                value: "14 dias",
                label: "Trial totalmente gratuito",
                desc: "Sem cartão de crédito necessário",
              },
              {
                value: "99,9%",
                label: "Uptime SLA garantido",
                desc: "Infraestrutura cloud de alta disponibilidade",
              },
            ].map((s) => (
              <div key={s.label} className="text-center lg:px-8 space-y-1.5">
                <div className="text-4xl font-bold text-blue-800 font-heading">{s.value}</div>
                <div className="font-bold text-neutral-900 text-sm">{s.label}</div>
                <div className="text-xs text-neutral-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────── */}
      <section id="recursos" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-3 text-green-600 text-xs font-bold uppercase tracking-widest">
              <div className="w-6 h-px bg-green-600" />
              Funcionalidades
              <div className="w-6 h-px bg-green-600" />
            </div>
            <h2 className="text-4xl font-bold font-heading text-blue-800">
              Tudo o que você precisa para garantir a qualidade da merenda
            </h2>
            <p className="text-neutral-500 text-lg leading-relaxed">
              Módulos integrados e pensados especificamente para a realidade das prefeituras brasileiras.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl border border-neutral-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-50 transition-all group bg-white"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform",
                    f.color
                  )}
                >
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">{f.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed mb-5">{f.description}</p>
                <ul className="space-y-2">
                  {f.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-neutral-600">
                      <Check size={13} className="text-green-600 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────────── */}
      <section id="como-funciona" className="py-24 px-6 bg-neutral-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 text-green-600 text-xs font-bold uppercase tracking-widest">
              <div className="w-6 h-px bg-green-600" />
              Como Funciona
              <div className="w-6 h-px bg-green-600" />
            </div>
            <h2 className="text-4xl font-bold font-heading text-blue-800">Em 3 passos simples</h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
              Do cadastro à primeira inspeção em menos de 5 minutos. Zero curva de aprendizado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.step} className="relative bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-blue-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold font-heading">{s.step}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ChevronRight size={16} className="text-neutral-300 ml-auto hidden md:block" />
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-5">
                  <s.icon size={24} className="text-blue-800" />
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">{s.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles + Security ────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Roles */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 text-green-600 text-xs font-bold uppercase tracking-widest">
                  <div className="w-6 h-px bg-green-600" />
                  Para cada papel
                </div>
                <h2 className="text-4xl font-bold font-heading text-blue-800">
                  Acesso personalizado para cada membro da equipe
                </h2>
                <p className="text-neutral-500 leading-relaxed">
                  Cinco níveis de acesso configuráveis. Cada usuário vê exatamente
                  o que precisa — nem mais, nem menos.
                </p>
              </div>
              <div className="space-y-3">
                {ROLES.map((r) => (
                  <div
                    key={r.role}
                    className="flex items-start gap-4 p-5 rounded-2xl border border-neutral-200 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-800 transition-colors">
                      <r.icon
                        size={20}
                        className="text-blue-800 group-hover:text-white transition-colors"
                      />
                    </div>
                    <div>
                      <div className="font-bold text-blue-800 text-sm">{r.role}</div>
                      <div className="text-neutral-500 text-sm mt-1 leading-relaxed">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security + Offline */}
            <div className="space-y-5">
              <div className="bg-blue-800 rounded-3xl p-8 text-white space-y-6">
                <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center">
                  <Lock size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-heading mb-2">Segurança e conformidade</h3>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Dados da alimentação escolar são sensíveis. O MerendaCheck foi construído
                    com as melhores práticas de segurança da informação e privacidade de dados.
                  </p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Autenticação em 2 fatores (2FA)",
                    "Criptografia end-to-end em trânsito",
                    "Auditoria de todas as ações do sistema",
                    "Dados armazenados no Brasil (LGPD)",
                    "Controle granular de permissões por papel",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={11} className="text-white" />
                      </div>
                      <span className="text-blue-100">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="bg-green-600 rounded-3xl p-6 text-white flex flex-col gap-4">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-base">Funciona offline</div>
                    <div className="text-green-100 text-sm mt-1 leading-relaxed">
                      Instale como app no celular. Sync automático ao reconectar.
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 flex flex-col gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Bell size={20} className="text-blue-800" />
                  </div>
                  <div>
                    <div className="font-bold text-base text-blue-800">Notificações push</div>
                    <div className="text-neutral-500 text-sm mt-1 leading-relaxed">
                      Alertas de NCs vencendo e agendamentos do dia.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────── */}
      <section id="planos" className="py-24 px-6 bg-neutral-50">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 text-green-600 text-xs font-bold uppercase tracking-widest">
              <div className="w-6 h-px bg-green-600" />
              Planos e Preços
              <div className="w-6 h-px bg-green-600" />
            </div>
            <h2 className="text-4xl font-bold font-heading text-blue-800">
              Transparência total, sem surpresas
            </h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
              Escolha o plano ideal para o tamanho do seu município. Todos incluem 14 dias de trial gratuito.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {Object.entries(PLANOS_DETALHES).map(([key, p]) => {
              const isDestaque = (p as any).destaque === true
              return (
                <div
                  key={key}
                  className={cn(
                    "bg-white rounded-3xl border flex flex-col relative transition-all",
                    isDestaque
                      ? "border-blue-800 shadow-2xl shadow-blue-900/15 ring-1 ring-blue-800 lg:-mt-3"
                      : "border-neutral-200 hover:border-blue-200 hover:shadow-md"
                  )}
                >
                  {isDestaque && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <div className="bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                        Mais Popular
                      </div>
                    </div>
                  )}
                  <div className={cn("p-7 flex-1 flex flex-col", isDestaque && "pt-10")}>
                    <div className="mb-5">
                      <h3 className="text-xl font-bold text-blue-800 mb-1">{p.nome}</h3>
                      <p className="text-xs text-neutral-500">{p.descricao}</p>
                    </div>
                    <div className="mb-5 pb-5 border-b border-neutral-100">
                      {p.preco ? (
                        <div className="flex items-end gap-1">
                          <span className="text-xs text-neutral-400 mb-1.5">R$</span>
                          <span className="text-4xl font-bold text-blue-800 font-heading leading-none">
                            {p.preco.toLocaleString("pt-BR")}
                          </span>
                          <span className="text-neutral-400 text-sm mb-1">/mês</span>
                        </div>
                      ) : (
                        <div className="text-2xl font-bold text-blue-800">Sob consulta</div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-5">
                      <div className="bg-neutral-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-blue-800">
                          {p.escolas === 9999 ? "Ilim." : p.escolas}
                        </div>
                        <div className="text-[11px] text-neutral-500">escolas</div>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 text-center">
                        <div className="text-lg font-bold text-blue-800">
                          {p.usuarios === 9999 ? "Ilim." : p.usuarios}
                        </div>
                        <div className="text-[11px] text-neutral-500">usuários</div>
                      </div>
                    </div>
                    <ul className="space-y-2.5 mb-7 flex-1">
                      {p.recursos.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-600">{r}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/cadastro"
                      className={cn(
                        "w-full text-center py-3 px-4 rounded-xl font-bold text-sm transition-colors block",
                        isDestaque
                          ? "bg-blue-800 hover:bg-blue-700 text-white shadow-md"
                          : "bg-neutral-100 hover:bg-neutral-200 text-blue-800"
                      )}
                    >
                      {p.preco ? "Começar Trial" : "Falar com Vendas"}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-center text-sm text-neutral-500">
            Todos os planos incluem 14 dias de trial gratuito · Cancele quando quiser · Sem taxa de implantação
          </p>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-800 rounded-3xl p-12 lg:p-16 text-center space-y-8 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-700/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/3" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-green-600/15 rounded-full blur-3xl -translate-x-1/2 translate-y-1/3" />
              <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid-cta" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-cta)" />
              </svg>
            </div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold font-heading text-white">
                Pronto para transformar a gestão da merenda?
              </h2>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                Comece agora com 14 dias totalmente gratuitos. Sem cartão de crédito,
                sem burocracia. Suporte em português durante todo o trial.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/cadastro"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-10 py-4 rounded-2xl text-lg shadow-xl shadow-green-900/30 transition-colors"
                >
                  Criar conta gratuita
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-10 py-4 rounded-2xl text-lg border border-white/20 transition-colors"
                >
                  Já tenho uma conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-2 space-y-4">
              <Logo size="md" variant="light" />
              <p className="text-neutral-400 text-sm leading-relaxed max-w-xs">
                A plataforma B2G definitiva para gestão da alimentação escolar em municípios
                brasileiros. Conformidade com o PNAE, transparência e saúde para nossos alunos.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Produto
              </h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>
                  <Link href="#recursos" className="hover:text-white transition-colors">
                    Recursos
                  </Link>
                </li>
                <li>
                  <Link href="#como-funciona" className="hover:text-white transition-colors">
                    Como Funciona
                  </Link>
                </li>
                <li>
                  <Link href="#planos" className="hover:text-white transition-colors">
                    Planos e Preços
                  </Link>
                </li>
                <li>
                  <Link href="/cadastro" className="hover:text-white transition-colors">
                    Começar Trial Gratuito
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Entrar
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
                Legal e Suporte
              </h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>
                  <Link href="/termos" className="hover:text-white transition-colors">
                    Termos de Uso
                  </Link>
                </li>
                <li>
                  <Link href="/privacidade" className="hover:text-white transition-colors">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link
                    href="mailto:contato@merendacheck.com.br"
                    className="hover:text-white transition-colors"
                  >
                    contato@merendacheck.com.br
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600">
            <span>© 2026 MerendaCheck · Todos os direitos reservados.</span>
            <span>Desenvolvido no Brasil para prefeituras brasileiras</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
