import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — MerendaCheck',
  description: 'Termos e condições de uso da plataforma MerendaCheck',
}

const SECOES = [
  {
    id: '1',
    titulo: '1. Objeto do serviço',
    conteudo: `O MerendaCheck é uma plataforma SaaS (Software as a Service) de gestão de inspeções de alimentação escolar, voltada exclusivamente a prefeituras, secretarias municipais de educação e entidades públicas vinculadas ao Programa Nacional de Alimentação Escolar (PNAE). O serviço permite o registro digital de inspeções, gestão de não conformidades, geração de relatórios e acompanhamento de conformidade alimentar nas unidades escolares do município.`,
  },
  {
    id: '2',
    titulo: '2. Cadastro e responsabilidades',
    conteudo: `2.1. O acesso à plataforma é restrito a pessoas jurídicas de direito público (municípios e suas secretarias) e seus representantes devidamente autorizados.\n\n2.2. O administrador municipal é responsável por toda utilização da plataforma por usuários cadastrados em seu tenant (organização), incluindo nutricionistas, inspetores e merendeiras.\n\n2.3. Os dados inseridos na plataforma são de responsabilidade exclusiva do tenant. O MerendaCheck não se responsabiliza por informações incorretas, incompletas ou fraudulentas inseridas pelos usuários.\n\n2.4. Cada usuário deve manter suas credenciais de acesso em sigilo. O compartilhamento de senhas é vedado.`,
  },
  {
    id: '3',
    titulo: '3. Uso adequado da plataforma',
    conteudo: `3.1. É vedado utilizar a plataforma para fins contrários à legislação brasileira, à moral e à ordem pública.\n\n3.2. É proibida a tentativa de acesso não autorizado a sistemas, bancos de dados ou contas de outros tenants.\n\n3.3. O usuário não deve realizar engenharia reversa, decompilar ou tentar extrair o código-fonte da plataforma.\n\n3.4. O uso da plataforma deve respeitar as normas do PNAE (Resolução FNDE nº 06/2020) e demais regulamentações aplicáveis à alimentação escolar.`,
  },
  {
    id: '4',
    titulo: '4. Dados e privacidade',
    conteudo: `4.1. O tratamento de dados pessoais é regido pela Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018) e detalhado na nossa Política de Privacidade.\n\n4.2. Os dados inseridos na plataforma pertencem ao tenant. O MerendaCheck atua como operador de dados nos termos da LGPD.\n\n4.3. Dados de uso são coletados para fins de melhoria do serviço, segurança e análise de performance, conforme descrito na Política de Privacidade.`,
  },
  {
    id: '5',
    titulo: '5. Propriedade intelectual',
    conteudo: `5.1. Todo o conteúdo da plataforma — incluindo software, design, logotipos, textos, algoritmos e modelos de relatório — é de propriedade exclusiva do MerendaCheck ou de seus licenciadores.\n\n5.2. A assinatura concede ao tenant uma licença de uso não exclusiva, intransferível e revogável para utilização da plataforma conforme os presentes Termos.\n\n5.3. Os relatórios e dados gerados a partir de informações do próprio tenant pertencem ao tenant.`,
  },
  {
    id: '6',
    titulo: '6. Pagamento e cancelamento',
    conteudo: `6.1. O serviço é comercializado por assinatura mensal ou anual, conforme plano contratado. Os preços são exibidos na página de planos.\n\n6.2. O cancelamento pode ser solicitado a qualquer momento. O acesso é mantido até o fim do período pago.\n\n6.3. Em caso de inadimplência superior a 15 dias, o acesso pode ser suspenso automaticamente. Os dados permanecem disponíveis por 30 dias após o cancelamento, salvo solicitação de exclusão.\n\n6.4. Municípios em período de teste gratuito (trial) de 14 dias têm acesso a todas as funcionalidades do plano selecionado, sem necessidade de cartão de crédito.`,
  },
  {
    id: '7',
    titulo: '7. Limitação de responsabilidade',
    conteudo: `7.1. O MerendaCheck se compromete a manter disponibilidade de 99,5% ao mês (exceto manutenções programadas com aviso prévio de 24h).\n\n7.2. Não nos responsabilizamos por decisões tomadas com base em dados inseridos incorretamente pelos usuários.\n\n7.3. Em nenhuma hipótese nossa responsabilidade excederá o valor pago pelo tenant nos últimos 12 meses.\n\n7.4. Não somos responsáveis por interrupções causadas por eventos fora de nosso controle (força maior, falhas de infraestrutura de terceiros, etc.).`,
  },
  {
    id: '8',
    titulo: '8. Alterações dos termos',
    conteudo: `8.1. O MerendaCheck pode atualizar estes Termos a qualquer momento, com aviso prévio de 30 dias por e-mail e notificação na plataforma.\n\n8.2. O uso continuado da plataforma após o aviso constitui aceitação dos novos Termos.\n\n8.3. Para alterações substanciais que afetem direitos dos tenants, será solicitada confirmação explícita.`,
  },
  {
    id: '9',
    titulo: '9. Legislação aplicável e foro',
    conteudo: `9.1. Estes Termos são regidos pela legislação brasileira.\n\n9.2. Fica eleito o foro da Comarca de Brasília-DF para dirimir quaisquer controvérsias decorrentes destes Termos, renunciando as partes a qualquer outro, por mais privilegiado que seja.\n\n9.3. Para questões relativas à Lei de Acesso à Informação (LAI — Lei nº 12.527/2011) e demais normas de transparência pública, o MerendaCheck cooperará com os órgãos competentes.`,
  },
]

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Cabeçalho */}
      <div className="mb-8 pb-6 border-b border-[#D5E3F0]">
        <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading mb-2">Termos de Uso</h1>
        <div className="flex items-center gap-3 text-sm text-[#5A7089]">
          <span className="bg-[#EEF4FD] text-[#0E2E60] font-semibold px-2.5 py-1 rounded-lg text-xs">v2.1</span>
          <span>Vigente desde 01/01/2026</span>
          <span>·</span>
          <Link href="/privacidade" className="text-[#0E2E60] font-semibold hover:underline">
            Política de Privacidade →
          </Link>
        </div>
      </div>

      {/* Índice */}
      <nav className="bg-[#F5F9FD] border border-[#D5E3F0] rounded-xl p-5 mb-8">
        <p className="text-xs font-bold text-[#5A7089] uppercase tracking-wider mb-3">Índice</p>
        <ol className="space-y-1.5">
          {SECOES.map((s) => (
            <li key={s.id}>
              <a
                href={`#secao-${s.id}`}
                className="text-sm text-[#0E2E60] hover:underline"
              >
                {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {/* Conteúdo */}
      <div className="space-y-8">
        {SECOES.map((s) => (
          <section key={s.id} id={`secao-${s.id}`}>
            <h2 className="text-base font-bold text-[#0F1B2D] font-heading mb-3">{s.titulo}</h2>
            <div className="text-sm text-[#5A7089] leading-relaxed whitespace-pre-line">
              {s.conteudo}
            </div>
          </section>
        ))}
      </div>

      {/* Rodapé */}
      <div className="mt-12 pt-6 border-t border-[#D5E3F0] text-xs text-[#A8BDD4]">
        <p>MerendaCheck — Plataforma de Gestão de Alimentação Escolar</p>
        <p className="mt-1">Contato: <a href="mailto:juridico@merendacheck.com.br" className="text-[#0E2E60] hover:underline">juridico@merendacheck.com.br</a></p>
      </div>
    </div>
  )
}
