// Lista completa de estados brasileiros
export const ESTADOS_BRASIL = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
] as const;

// Planos com detalhes completos
export const PLANOS_DETALHES = {
  STARTER: {
    nome: 'Starter',
    descricao: 'Ideal para municípios pequenos',
    preco: 297,
    escolas: 10,
    usuarios: 30,
    recursos: [
      'Checklists PNAE incluídos',
      'Dashboard básico',
      'Não conformidades',
      'Suporte por e-mail',
      'Exportação PDF',
    ],
  },
  CRESCIMENTO: {
    nome: 'Crescimento',
    descricao: 'Para times em expansão',
    preco: 697,
    escolas: 30,
    usuarios: 100,
    recursos: [
      'Tudo do Starter',
      'Agendamentos automáticos',
      'Relatórios avançados',
      'Suporte prioritário',
      'API de integração',
    ],
  },
  MUNICIPAL: {
    nome: 'Municipal',
    descricao: 'Para municípios estruturados',
    preco: 1497,
    escolas: 100,
    usuarios: 9999,
    recursos: [
      'Tudo do Crescimento',
      'Usuários ilimitados',
      'Gerente de sucesso dedicado',
      'Onboarding personalizado',
      'SLA garantido',
    ],
    destaque: true,
  },
  ENTERPRISE: {
    nome: 'Enterprise',
    descricao: 'Para operações complexas',
    preco: null, // sob consulta
    escolas: 9999,
    usuarios: 9999,
    recursos: [
      'Tudo do Municipal',
      'Escolas ilimitadas',
      'Contrato personalizado',
      'Implantação assistida',
      'Integração com sistemas legados',
    ],
  },
} as const;

// Duração do trial em dias
export const TRIAL_DIAS = 14;

// Domínios de e-mail bloqueados no cadastro
export const EMAILS_BLOQUEADOS = [
  'gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com',
  'live.com', 'icloud.com', 'uol.com.br', 'bol.com.br',
];
