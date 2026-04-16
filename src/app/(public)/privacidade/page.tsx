import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — MerendaCheck',
  description: 'Política de privacidade e proteção de dados do MerendaCheck conforme LGPD',
}

const SECOES = [
  {
    id: '1',
    titulo: '1. Quais dados coletamos',
    conteudo: `Coletamos os seguintes dados pessoais:\n\n• Dados de cadastro: nome, e-mail, cargo/papel, CPF (quando exigido por relatórios FNDE)\n• Dados do município: nome do município, CNPJ da prefeitura, código IBGE, dados de contato\n• Dados de uso: logs de acesso (IP, User-Agent, horário), ações realizadas na plataforma\n• Dados operacionais: inspeções realizadas, notas e observações de conformidade, fotos de evidências\n• Dados de faturamento: dados do cartão são processados exclusivamente pela Stripe (não armazenamos dados de cartão)`,
  },
  {
    id: '2',
    titulo: '2. Como usamos os dados',
    conteudo: `Utilizamos seus dados para:\n\n• Prestação do serviço de gestão de inspeções de alimentação escolar\n• Geração de relatórios FNDE e documentos de conformidade\n• Envio de notificações e alertas sobre inspeções e não conformidades\n• Segurança da plataforma e prevenção de fraudes\n• Melhoria contínua do serviço (dados anonimizados)\n• Cumprimento de obrigações legais e regulatórias\n• Comunicações sobre o serviço (atualizações, manutenções, faturas)`,
  },
  {
    id: '3',
    titulo: '3. Base legal para tratamento',
    conteudo: `Tratamos seus dados com base nas seguintes hipóteses legais da LGPD (Art. 7º e Art. 11):\n\n• Execução de contrato: para prestação do serviço contratado (Art. 7º, V)\n• Cumprimento de obrigação legal: atendimento às normas do PNAE e prestação de contas ao FNDE (Art. 7º, II)\n• Legítimo interesse: melhoria do serviço, segurança e comunicações relevantes (Art. 7º, IX)\n• Consentimento: quando solicitamos permissões específicas (ex: notificações push) (Art. 7º, I)`,
  },
  {
    id: '4',
    titulo: '4. Compartilhamento de dados',
    conteudo: `Compartilhamos dados apenas nas seguintes situações:\n\n• Provedores de serviço (subprocessadores): Supabase (banco de dados e autenticação), Vercel (hospedagem), Stripe (pagamentos), Resend (e-mails transacionais) — todos com contratos de proteção de dados adequados\n• Obrigação legal: quando exigido por lei, regulação ou ordem judicial\n• Com o próprio tenant: administradores do município têm acesso aos dados de usuários de seu tenant\n\nNão vendemos, alugamos ou compartilhamos dados pessoais com terceiros para fins comerciais.`,
  },
  {
    id: '5',
    titulo: '5. Retenção e exclusão de dados',
    conteudo: `• Dados de conta: mantidos enquanto a assinatura estiver ativa + 30 dias após cancelamento\n• Logs de auditoria: mantidos por 5 anos (exigência de legislação de transparência pública)\n• Dados operacionais (inspeções, NCs): mantidos enquanto necessário para prestação de contas ao FNDE\n• Dados de faturamento: mantidos conforme exigência fiscal (5 anos)\n\nApós exclusão: dados pessoais identificáveis são removidos ou anonimizados. Dados estatísticos anonimizados podem ser mantidos indefinidamente para fins de pesquisa e melhoria do serviço.`,
  },
  {
    id: '6',
    titulo: '6. Direitos do titular',
    conteudo: `Conforme a LGPD (Art. 18), você tem os seguintes direitos:\n\n• Confirmação e acesso: saber se tratamos seus dados e acessá-los\n• Correção: corrigir dados incompletos, inexatos ou desatualizados\n• Anonimização ou bloqueio: para dados desnecessários ou tratados em desconformidade\n• Portabilidade: receber seus dados em formato estruturado\n• Eliminação: solicitar a exclusão de dados tratados com base em consentimento\n• Informação: saber com quem compartilhamos seus dados\n• Revogação do consentimento: para tratamentos baseados em consentimento\n\nExerça seus direitos em: Configurações → LGPD, ou contate privacidade@merendacheck.com.br`,
  },
  {
    id: '7',
    titulo: '7. Cookies e tecnologias similares',
    conteudo: `Utilizamos cookies e tecnologias similares para:\n\n• Autenticação e manutenção de sessão (essenciais — não podem ser desabilitados)\n• Preferências de usuário (ex: tema, filtros)\n• Analytics de uso da plataforma (dados anonimizados)\n\nNão utilizamos cookies de rastreamento ou publicidade de terceiros.\n\nVocê pode gerenciar cookies nas configurações do seu navegador, mas a desativação de cookies essenciais impedirá o uso da plataforma.`,
  },
  {
    id: '8',
    titulo: '8. Contato do DPO (Encarregado)',
    conteudo: `Nosso Encarregado pelo Tratamento de Dados Pessoais (DPO) está disponível para:\n• Esclarecer dúvidas sobre o tratamento de dados\n• Receber reclamações e solicitações dos titulares\n• Mediar comunicação com a ANPD quando necessário\n\nDPO: Equipe de Privacidade MerendaCheck\nE-mail: privacidade@merendacheck.com.br\nResposta em até 15 dias úteis conforme LGPD`,
  },
  {
    id: '9',
    titulo: '9. Alterações desta política',
    conteudo: `Podemos atualizar esta Política periodicamente. Notificaremos por e-mail e notificação na plataforma com antecedência mínima de 15 dias para alterações relevantes.\n\nA versão vigente é sempre a disponível nesta página, identificada pela data de vigência no topo do documento.\n\nO uso continuado da plataforma após o aviso constitui concordância com a Política atualizada.`,
  },
]

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Cabeçalho */}
      <div className="mb-8 pb-6 border-b border-[#D5E3F0]">
        <h1 className="text-2xl font-bold text-[#0F1B2D] font-heading mb-2">Política de Privacidade</h1>
        <div className="flex items-center gap-3 text-sm text-[#5A7089] flex-wrap">
          <span className="bg-[#EEF4FD] text-[#0E2E60] font-semibold px-2.5 py-1 rounded-lg text-xs">v2.1</span>
          <span>Vigente desde 01/01/2026</span>
          <span className="bg-[#D1F7E2] text-[#00963A] font-semibold px-2.5 py-1 rounded-lg text-xs">Conforme LGPD — Lei 13.709/2018</span>
          <span>·</span>
          <Link href="/termos" className="text-[#0E2E60] font-semibold hover:underline">
            Termos de Uso →
          </Link>
        </div>
      </div>

      {/* Índice */}
      <nav className="bg-[#F5F9FD] border border-[#D5E3F0] rounded-xl p-5 mb-8">
        <p className="text-xs font-bold text-[#5A7089] uppercase tracking-wider mb-3">Índice</p>
        <ol className="space-y-1.5">
          {SECOES.map((s) => (
            <li key={s.id}>
              <a href={`#secao-${s.id}`} className="text-sm text-[#0E2E60] hover:underline">
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

      {/* DPO card */}
      <div className="mt-10 bg-[#EEF4FD] rounded-xl p-5 border border-[#D5E3F0]">
        <p className="text-xs font-bold text-[#0E2E60] uppercase tracking-wider mb-2">Contato do DPO</p>
        <p className="text-sm text-[#5A7089]">
          Dúvidas ou solicitações sobre seus dados pessoais:{' '}
          <a href="mailto:privacidade@merendacheck.com.br" className="text-[#0E2E60] font-semibold hover:underline">
            privacidade@merendacheck.com.br
          </a>
        </p>
        <p className="text-xs text-[#A8BDD4] mt-1">Resposta em até 15 dias úteis</p>
      </div>

      <div className="mt-8 pt-6 border-t border-[#D5E3F0] text-xs text-[#A8BDD4]">
        <p>MerendaCheck — Plataforma de Gestão de Alimentação Escolar</p>
      </div>
    </div>
  )
}
