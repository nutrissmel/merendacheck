import { z } from "zod";

export const escolaSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(150, 'Nome muito longo'),
  codigoInep: z.string()
    .regex(/^\d{8}$/, 'INEP deve ter 8 dígitos')
    .optional()
    .or(z.literal('')),
  endereco: z.string().max(200).optional().or(z.literal('')),
  bairro: z.string().max(100).optional().or(z.literal('')),
  cidade: z.string().max(100).optional().or(z.literal('')),
  cep: z.string()
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
    .optional()
    .or(z.literal('')),
  numeroAlunos: z.coerce.number()
    .min(0, 'Número de alunos não pode ser negativo')
    .max(99999, 'Número de alunos muito alto'),
  turnos: z.array(z.enum(['MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL']))
    .min(1, 'Selecione pelo menos um turno'),
})

export const escolaUpdateSchema = escolaSchema.partial()

export const usuarioSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  papel: z.enum(["SUPER_ADMIN", "ADMIN_MUNICIPAL", "NUTRICIONISTA", "DIRETOR_ESCOLA", "MERENDEIRA"]),
  ativo: z.boolean().default(true),
});

export const alterarNomeSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome deve conter apenas letras'),
})

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  novaSenha: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Inclua pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Inclua pelo menos um número'),
  confirmarNovaSenha: z.string(),
}).refine((d) => d.novaSenha === d.confirmarNovaSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarNovaSenha'],
}).refine((d) => d.novaSenha !== d.senhaAtual, {
  message: 'Nova senha deve ser diferente da senha atual',
  path: ['novaSenha'],
})

export const alterarPapelSchema = z.object({
  papel: z.enum([
    'ADMIN_MUNICIPAL',
    'NUTRICIONISTA',
    'DIRETOR_ESCOLA',
    'MERENDEIRA',
  ] as const),
})

export const checklistSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(150, 'Nome muito longo'),
  descricao: z.string().max(500).optional().or(z.literal('')),
  categoria: z.enum([
    'TEMPERATURA', 'RECEBIMENTO_GENEROS', 'HIGIENE_PESSOAL',
    'INSTALACOES', 'PREPARACAO_DISTRIBUICAO', 'CONTROLE_PRAGAS',
    'HIGIENIZACAO_UTENSILIOS', 'OUTRO',
  ] as const),
  frequencia: z.enum([
    'DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'SOB_DEMANDA',
  ] as const),
})

export const iniciarInspecaoSchema = z.object({
  escolaId: z.string().uuid('Escola inválida'),
  checklistId: z.string().uuid('Checklist inválido'),
  clienteId: z.string().optional(),
})

export const salvarRespostaSchema = z.object({
  inspecaoId: z.string().uuid(),
  itemId: z.string().uuid(),
  respostaSimNao: z.boolean().optional(),
  respostaNumerica: z.number().optional(),
  respostaTexto: z.string().max(1000).optional(),
  conforme: z.boolean().nullable().optional(),
  observacao: z.string().max(500).optional(),
})

export const finalizarInspecaoSchema = z.object({
  inspecaoId: z.string().uuid(),
  assinaturaUrl: z.string().url().optional().or(z.literal('')),
  latLng: z.string().regex(/^-?\d+\.\d+,-?\d+\.\d+$/).optional(),
})

// ─── NC + Ações (Sprint 13) ───────────────────────────────────────────────────

export const ncUpdateSchema = z.object({
  titulo: z.string().min(5, 'Título muito curto').max(200).optional(),
  descricao: z.string().max(1000).optional().or(z.literal('')),
  severidade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'CRITICA'] as const).optional(),
  prazoResolucao: z.date().nullable().optional(),
})

export const criarAcaoSchema = z.object({
  descricao: z.string()
    .min(10, 'Descreva a ação com pelo menos 10 caracteres')
    .max(500, 'Descrição muito longa'),
  responsavelId: z.string().uuid().optional(),
  prazo: z.date().optional(),
  prioridade: z.enum(['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const),
})

export const concluirAcaoSchema = z.object({
  acaoId: z.string().uuid(),
  observacaoConclusao: z.string()
    .min(10, 'Descreva o que foi feito')
    .max(1000),
  evidenciaUrl: z.string().url().optional(),
})

export const resolverNcManualSchema = z.object({
  observacao: z.string()
    .min(10, 'Explique como a NC foi resolvida')
    .max(1000),
})

// ─── Checklist item ───────────────────────────────────────────────────────────

export const checklistItemSchema = z.object({
  pergunta: z.string()
    .min(5, 'Pergunta muito curta')
    .max(300, 'Pergunta muito longa'),
  descricao: z.string().max(500).optional().or(z.literal('')),
  tipoResposta: z.enum([
    'SIM_NAO', 'NUMERICO', 'TEXTO_LIVRE',
    'MULTIPLA_ESCOLHA', 'FOTO', 'ESCALA',
  ] as const),
  obrigatorio: z.boolean().default(true),
  isCritico: z.boolean().default(false),
  fotoObrigatoria: z.boolean().default(false),
  valorMinimo: z.number().optional(),
  valorMaximo: z.number().optional(),
  unidade: z.string().max(20).optional(),
  opcoes: z.array(z.string().min(1)).optional(),
  peso: z.number().min(0.1).max(10).default(1.0),
}).superRefine((data, ctx) => {
  if (data.tipoResposta === 'NUMERICO') {
    if (data.valorMinimo === undefined) {
      ctx.addIssue({ code: 'custom', path: ['valorMinimo'], message: 'Valor mínimo obrigatório para tipo numérico' })
    }
    if (data.valorMaximo === undefined) {
      ctx.addIssue({ code: 'custom', path: ['valorMaximo'], message: 'Valor máximo obrigatório para tipo numérico' })
    }
    if (data.valorMinimo !== undefined && data.valorMaximo !== undefined && data.valorMinimo >= data.valorMaximo) {
      ctx.addIssue({ code: 'custom', path: ['valorMaximo'], message: 'Valor máximo deve ser maior que o mínimo' })
    }
  }
  if (data.tipoResposta === 'MULTIPLA_ESCOLHA') {
    if (!data.opcoes || data.opcoes.length < 2) {
      ctx.addIssue({ code: 'custom', path: ['opcoes'], message: 'Adicione pelo menos 2 opções' })
    }
  }
})
