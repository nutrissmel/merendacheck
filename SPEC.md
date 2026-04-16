# SPEC.md — MerendaCheck: Especificação Técnica Completa

> **Propósito:** Documento de referência para IAs e desenvolvedores. Leia antes de implementar qualquer feature ou fazer qualquer modificação no sistema.

---

## 1. Visão Geral do Produto

**MerendaCheck** é uma plataforma SaaS multi-tenant para gestão de inspeções de merenda escolar em municípios brasileiros. Permite que secretarias de educação cadastrem escolas, executem inspeções via checklists customizáveis, rastreiem não conformidades e gerem relatórios para órgãos como o FNDE.

**Usuários-alvo:** Secretarias municipais de educação, nutricionistas, diretores de escola, merendeiras.

---

## 2. Stack Tecnológica

### Runtime / Framework
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | ^16.2.2 | App Router, Server Components, Server Actions |
| React | ^19.0.0 | UI |
| TypeScript | ~5.8.2 | Tipagem estática |
| Node.js | LTS | Runtime servidor |

### Banco de Dados / ORM
| Tecnologia | Versão | Uso |
|---|---|---|
| PostgreSQL | — | Banco principal (via Supabase) |
| Prisma | ^6.19.3 | ORM — queries, migrações |
| Supabase | ^2.102.1 | Auth (JWT), storage, hosting PostgreSQL |

### Autenticação
- **Supabase Auth** para sessões JWT
- `@supabase/ssr` para cookies em Server Components/Actions
- Middleware Next.js (`middleware.ts`) para proteção de rotas
- `src/lib/auth.ts` para helpers server-side (`getServerUser`, `requirePapel`, etc.)

### UI / Estilo
| Lib | Uso |
|---|---|
| Tailwind CSS v4 | Estilização utilitária |
| shadcn/ui (customizado) | Componentes base (Button, Input, Label, Dialog…) |
| lucide-react | Ícones |
| Recharts | Gráficos no dashboard |
| sonner | Toast notifications |
| motion | Animações |
| @dnd-kit | Drag-and-drop (reordenação de itens de checklist) |

### Formulários / Validação
- **react-hook-form** + **zodResolver** para todos os formulários
- Schemas Zod centralizados em `src/lib/validations.ts`

### Funcionalidades Especiais
| Lib | Uso |
|---|---|
| Dexie / IndexedDB | Modo offline — armazena inspeções localmente |
| next-pwa + workbox | PWA — service worker, install banner |
| @react-pdf/renderer | Geração de PDF de relatórios |
| exceljs | Exportação Excel |
| resend + @react-email | Envio de e-mails transacionais |
| otplib + qrcode | 2FA (TOTP) |
| @google/genai | Integração com Gemini AI (análises) |
| @sentry/nextjs | Monitoramento de erros em produção |

---

## 3. Arquitetura Multi-Tenant

### Modelo de Isolamento
Cada município é um **Tenant**. Todo dado pertence a um `tenantId`. **Nunca** faça queries sem filtrar por `tenantId` (exceto em actions de SUPER_ADMIN).

### Hierarquia de entidades
```
Tenant (município)
  ├── Usuario[] (funcionários do município)
  ├── Escola[] (escolas do município)
  │     └── UsuarioEscola[] (vínculo usuário ↔ escola)
  ├── ChecklistModelo[] (templates de inspeção)
  │     └── ChecklistItem[] (perguntas do checklist)
  ├── Inspecao[] (inspeções realizadas)
  │     ├── RespostaItem[]
  │     └── NaoConformidade[]
  │           └── AcaoCorretiva[]
  ├── Agendamento[]
  ├── Convite[]
  ├── Notificacao[]
  └── LogAuditoria[]
```

---

## 4. Schema do Banco de Dados (Prisma)

### 4.1 Modelo `Tenant`
```prisma
model Tenant {
  id                   String      @id @default(uuid())
  nome                 String
  codigoIbge           String      @unique
  estado               String
  logoUrl              String?
  nomeSecretaria       String?
  telefone             String?
  emailInstitucional   String?
  website              String?
  cnpj                 String?
  // Billing
  plano                Plano       @default(STARTER)
  planoStatus          PlanoStatus @default(TRIAL)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  trialExpiresAt       DateTime?
  // Integrações
  apiKey               String?     @unique
  webhookUrl           String?
  webhookEventos       String[]    @default([])
  webhookAtivo         Boolean     @default(false)
  // Notificações
  notifNcCritica         Boolean  @default(true)
  notifInspecaoReprovada Boolean  @default(true)
  notifSemInspecaoDias   Int      @default(7)
  notifRelatorioMensal   Boolean  @default(true)
  notifEmailAdmin        Boolean  @default(true)
  notifEmailNutricionista Boolean @default(true)
  notifReplyTo           String?
  ativo      Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  @@map("tenants")
}
```

### 4.2 Modelo `Escola`
```prisma
model Escola {
  id           String   @id @default(uuid())
  tenantId     String
  nome         String
  codigoInep   String?
  endereco     String?
  bairro       String?
  cidade       String?
  cep          String?
  numeroAlunos Int      @default(0)
  turnos       Turno[]
  ativa        Boolean  @default(true)  // ← ATENÇÃO: campo feminino "ativa", não "ativo"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@map("escolas")
}
```
> **CRÍTICO:** O campo de status da escola é `ativa` (feminino). Use `where: { ativa: true }`, nunca `ativo: true`.

### 4.3 Modelo `Usuario`
```prisma
model Usuario {
  id             String   @id @default(uuid())
  tenantId       String
  supabaseUserId String   @unique  // ← ID do Supabase Auth
  nome           String
  email          String
  papel          Papel
  ativo          Boolean  @default(true)  // ← aqui é masculino "ativo"
  primeiroAcesso Boolean  @default(true)
  doisFatoresAtivo   Boolean  @default(false)
  doisFatoresSegredo String?
  codigosRecuperacao String[] @default([])
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@unique([email, tenantId])
  @@map("usuarios")
}
```

### 4.4 Modelo `ChecklistModelo`
```prisma
model ChecklistModelo {
  id         String             @id @default(uuid())
  tenantId   String
  nome       String
  descricao  String?
  categoria  CategoriaChecklist
  frequencia Frequencia         @default(SEMANAL)
  ativo      Boolean            @default(true)
  isTemplate Boolean            @default(false)  // ← templates globais (não pertencem a tenant específico)
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt
  @@map("checklist_modelos")
}
```

### 4.5 Modelo `ChecklistItem`
```prisma
model ChecklistItem {
  id              String        @id @default(uuid())
  checklistId     String
  ordem           Int
  pergunta        String
  descricao       String?
  tipoResposta    TipoResposta
  obrigatorio     Boolean       @default(true)
  isCritico       Boolean       @default(false)
  fotoObrigatoria Boolean       @default(false)
  valorMinimo     Float?        // só para TipoResposta.NUMERICO
  valorMaximo     Float?        // só para TipoResposta.NUMERICO
  unidade         String?       // só para TipoResposta.NUMERICO
  opcoes          String[]      // só para TipoResposta.MULTIPLA_ESCOLHA
  peso            Float         @default(1.0)
  secao           String?       // agrupamento visual de itens
  @@map("checklist_itens")
}
```

### 4.6 Modelo `Inspecao`
```prisma
model Inspecao {
  id            String         @id @default(uuid())
  tenantId      String
  escolaId      String
  checklistId   String
  inspetorId    String
  status        StatusInspecao @default(EM_ANDAMENTO)
  score         Float?         // 0–100, calculado ao finalizar
  scoreStatus   ScoreStatus?   // CONFORME | ATENCAO | NAO_CONFORME | REPROVADO
  iniciadaEm    DateTime       @default(now())
  finalizadaEm  DateTime?
  latLng        String?        // "lat,lng" — geolocalização
  assinaturaUrl String?        // URL do storage Supabase
  clienteId     String?        @unique  // ID gerado no cliente para deduplicação offline
  sincronizadaEm DateTime?
  @@map("inspecoes")
}
```

### 4.7 Modelo `NaoConformidade`
```prisma
model NaoConformidade {
  id             String     @id @default(uuid())
  tenantId       String
  inspecaoId     String
  itemId         String
  titulo         String
  descricao      String?
  severidade     Severidade @default(MEDIA)  // BAIXA | MEDIA | ALTA | CRITICA
  status         StatusNC   @default(ABERTA) // ABERTA | EM_ANDAMENTO | RESOLVIDA | VENCIDA
  prazoResolucao DateTime?
  resolvidaEm    DateTime?
  createdAt      DateTime   @default(now())
  updatedAt      DateTime   @updatedAt
  @@map("nao_conformidades")
}
```

### 4.8 Modelo `LogAuditoria`
```prisma
model LogAuditoria {
  id        String   @id @default(uuid())
  tenantId  String
  usuarioId String
  acao      String
  alvoId    String?
  alvoTipo  String?
  alvoNome  String?
  detalhes  Json?
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
  @@map("logs_auditoria")
}
```
> **IMPORTANTE:** `LogAuditoria` tem relações `tenant` e `usuario`. Em ambientes com client Prisma desatualizado (DLL lock no Windows), prefira queries separadas em vez de `include`.

### 4.9 Enums do Schema

| Enum | Valores |
|---|---|
| `Papel` | `SUPER_ADMIN`, `ADMIN_MUNICIPAL`, `NUTRICIONISTA`, `DIRETOR_ESCOLA`, `MERENDEIRA` |
| `Plano` | `STARTER`, `CRESCIMENTO`, `MUNICIPAL`, `ENTERPRISE` |
| `PlanoStatus` | `TRIAL`, `ATIVO`, `CANCELADO`, `INADIMPLENTE` |
| `Turno` | `MATUTINO`, `VESPERTINO`, `NOTURNO`, `INTEGRAL` |
| `Frequencia` | `DIARIO`, `SEMANAL`, `QUINZENAL`, `MENSAL`, `SOB_DEMANDA` |
| `TipoResposta` | `SIM_NAO`, `NUMERICO`, `TEXTO_LIVRE`, `MULTIPLA_ESCOLHA`, `FOTO`, `ESCALA` |
| `StatusInspecao` | `EM_ANDAMENTO`, `FINALIZADA`, `CANCELADA` |
| `ScoreStatus` | `CONFORME`, `ATENCAO`, `NAO_CONFORME`, `REPROVADO` |
| `Severidade` | `BAIXA`, `MEDIA`, `ALTA`, `CRITICA` |
| `StatusNC` | `ABERTA`, `EM_ANDAMENTO`, `RESOLVIDA`, `VENCIDA` |
| `Prioridade` | `BAIXA`, `MEDIA`, `ALTA`, `URGENTE` |
| `StatusAcao` | `ABERTA`, `EM_ANDAMENTO`, `CONCLUIDA`, `VENCIDA` |
| `CategoriaChecklist` | `TEMPERATURA`, `RECEBIMENTO_GENEROS`, `HIGIENE_PESSOAL`, `INSTALACOES`, `PREPARACAO_DISTRIBUICAO`, `CONTROLE_PRAGAS`, `HIGIENIZACAO_UTENSILIOS`, `OUTRO` |

---

## 5. Autenticação e Autorização

### 5.1 Fluxo de Auth
1. Supabase Auth gerencia login/sessão via JWT em cookies HTTP-only
2. `middleware.ts` intercepta todas as requests, valida sessão
3. Em Server Components/Actions: `getServerUser()` → busca usuário no Prisma via `supabaseUserId`
4. Metadados do usuário (`papel`, `ativo`, `primeiro_acesso`) ficam em `user.app_metadata` e `user.user_metadata` no JWT

### 5.2 Funções de Auth (`src/lib/auth.ts`)

| Função | O que faz |
|---|---|
| `getServerUser()` | Retorna `AuthUser` ou redireciona para `/login` |
| `getServerUserOrNull()` | Retorna `AuthUser` ou `null` |
| `requirePapel(papeis[])` | Exige papel específico, redireciona para `/dashboard` se não tiver |
| `verificarAcessoEscola(escolaId)` | Verifica se usuário tem acesso à escola |
| `getTenantId()` | Retorna `tenantId` do JWT ou do banco |
| `getRedirectPorPapel(papel)` | URL de redirect pós-login por papel |
| `withAuth(handler, papeis?)` | Wrapper para proteger Server Actions |

### 5.3 Tipo `AuthUser`
```typescript
type AuthUser = {
  id: string           // UUID do Prisma (Usuario.id)
  supabaseUserId: string
  tenantId: string
  nome: string
  email: string
  papel: Papel
  primeiroAcesso: boolean
  ativo: boolean
}
```

### 5.4 Proteção de Rotas (Middleware)

**Rotas públicas** (sem auth): `/login`, `/cadastro`, `/esqueci-senha`, `/nova-senha`, `/primeiro-acesso`, `/convite/*`

**Restrições por papel** (definidas em `middleware.ts`):
| Rota | Papéis permitidos |
|---|---|
| `/configuracoes/usuarios` | ADMIN_MUNICIPAL, SUPER_ADMIN |
| `/configuracoes` | ADMIN_MUNICIPAL, SUPER_ADMIN |
| `/planos` | ADMIN_MUNICIPAL, SUPER_ADMIN |
| `/relatorios` | ADMIN_MUNICIPAL, NUTRICIONISTA, SUPER_ADMIN |
| `/checklists` | ADMIN_MUNICIPAL, NUTRICIONISTA, DIRETOR_ESCOLA, SUPER_ADMIN |
| `/nao-conformidades` | ADMIN_MUNICIPAL, NUTRICIONISTA, SUPER_ADMIN |

**Comportamentos especiais:**
- Usuário desativado → redireciona para `/login?erro=conta-desativada`
- `primeiroAcesso=true` → força redirect para `/primeiro-acesso`
- `MERENDEIRA` → redirect pós-login para `/inspecoes/nova`
- `DIRETOR_ESCOLA` → redirect pós-login para `/escolas`

### 5.5 Limites de Plano (`src/lib/plano.ts`)
| Plano | Escolas | Usuários |
|---|---|---|
| STARTER | 10 | 30 |
| CRESCIMENTO | 30 | 100 |
| MUNICIPAL | 100 | 9999 |
| ENTERPRISE | 9999 | 9999 |

---

## 6. Estrutura de Rotas (App Router)

### 6.1 Grupos de Rotas

```
src/app/
├── (auth)/          → Páginas sem sidebar (login, cadastro, etc.)
│   ├── login/
│   ├── cadastro/
│   ├── esqueci-senha/
│   ├── nova-senha/
│   ├── primeiro-acesso/
│   └── convite/[token]/
├── (dashboard)/     → Área autenticada com sidebar
│   ├── dashboard/
│   ├── escolas/
│   │   ├── page.tsx          (lista)
│   │   ├── nova/page.tsx     (criação)
│   │   └── [id]/
│   │       ├── page.tsx      (detalhe com abas)
│   │       └── editar/page.tsx
│   ├── inspecoes/
│   │   ├── page.tsx
│   │   ├── nova/page.tsx
│   │   ├── mobile-lista/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       ├── responder/page.tsx    (formulário de inspeção)
│   │       └── finalizar/page.tsx
│   ├── checklists/
│   │   ├── page.tsx
│   │   ├── novo/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── editar/page.tsx    (BuilderClient — editor drag-and-drop)
│   ├── nao-conformidades/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── relatorios/page.tsx
│   ├── agendamentos/page.tsx
│   ├── configuracoes/
│   │   ├── page.tsx
│   │   └── usuarios/
│   │       ├── page.tsx
│   │       └── [id]/page.tsx
│   ├── perfil/page.tsx
│   ├── planos/page.tsx
│   ├── home-mobile/page.tsx
│   └── sync/page.tsx             (sincronização offline)
├── (super-admin)/   → Painel administrativo global
│   └── super-admin/
│       ├── page.tsx              (overview)
│       ├── municipios/page.tsx
│       ├── usuarios/page.tsx
│       ├── inspecoes/page.tsx
│       ├── ncs/page.tsx
│       ├── billing/page.tsx
│       ├── auditoria/page.tsx
│       └── configuracoes/page.tsx
└── (public)/        → Páginas sem auth (termos, privacidade)
    ├── termos/page.tsx
    └── privacidade/page.tsx
```

### 6.2 API Routes

```
src/app/api/
├── cep/[cep]/route.ts         GET — busca endereço via ViaCEP (cache 7d, rate limit 10/min)
├── ibge/[codigo]/route.ts     GET — busca dados do município via IBGE
├── perfil/route.ts            GET/PATCH — dados do perfil do usuário
├── usuarios/
│   ├── route.ts               GET — lista usuários do tenant
│   └── exportar/route.ts      GET — exporta CSV de usuários
├── ping/route.ts              GET — health check
├── sync/
│   ├── inspecao/route.ts      POST — sincroniza inspeção offline
│   ├── resposta/route.ts      POST — sincroniza resposta offline
│   ├── foto/route.ts          POST — upload de foto offline
│   └── finalizar/route.ts    POST — finaliza inspeção sincronizada
├── nao-conformidades/
│   └── exportar/route.ts      GET — exporta NC em CSV
├── relatorios/
│   ├── excel/route.ts         GET — gera Excel
│   └── pdf/route.ts           GET — gera PDF
└── cron/
    ├── verificar-ncs-vencidas/route.ts    POST — marca NCs vencidas
    └── verificar-agendamentos/route.ts    POST — dispara agendamentos
```

---

## 7. Server Actions

Todos os Server Actions ficam em `src/actions/`. Padrão: retornam `{ sucesso: true, ... }` ou `{ sucesso: false, erro: string }`.

### `auth.actions.ts`
- Login, logout, recuperação de senha, troca de senha no primeiro acesso

### `cadastro.actions.ts`
- Cadastro de novo tenant/município

### `escola.actions.ts`
- `criarEscolaAction(data)` — cria escola (verifica limite de plano)
- `atualizarEscolaAction(id, data)` — atualiza escola
- `desativarEscolaAction(id)` — desativa (soft delete)

### `escola-detalhe.actions.ts`
- `buscarEscolaDetalheAction(id)` — busca escola com estatísticas
- `buscarInspecoesEscolaAction(id)` — inspeções da escola
- `buscarNcsEscolaAction(id)` — NCs da escola

### `usuario.actions.ts`
- `listarUsuariosAction()` — usuários do tenant
- `atualizarUsuarioAction(id, data)` — edita usuário
- `desativarUsuarioAction(id)` — desativa usuário
- `reativarUsuarioAction(id)` — reativa usuário

### `convite.actions.ts`
- `convidarUsuarioAction(data)` — envia convite por e-mail
- `aceitarConviteAction(token)` — aceita convite e cria usuário

### `checklist.actions.ts`
- `listarChecklistsAction()` — lista checklists do tenant
- `criarChecklistAction(data)` — cria novo checklist
- `atualizarChecklistAction(id, data)` — atualiza cabeçalho
- `adicionarItemAction(checklistId, data)` — adiciona item (inclui campo `secao`)
- `atualizarItemAction(itemId, data)` — atualiza item (inclui campo `secao`)
- `removerItemAction(itemId)` — remove item
- `reordenarItensAction(checklistId, ids[])` — reordena via DnD
- `criarAPartirDeTemplateAction(templateId)` — cria checklist a partir de template (copia `secao`)
- `duplicarChecklistAction(id)` — duplica checklist (copia `secao`)
- `renomearSecaoAction(checklistId, secaoAtual, novaSecao)` — renomeia seção via `updateMany`

### `inspecao.actions.ts`
- `iniciarInspecaoAction(data)` — cria nova inspeção
- `salvarRespostaAction(data)` — salva resposta de um item
- `finalizarInspecaoAction(data)` — finaliza, calcula score, gera NCs automáticas
- `listarInspecoesAction(filtros?)` — lista inspeções
- `buscarInspecaoAction(id)` — detalhe da inspeção

### `naoConformidade.actions.ts`
- `listarNaoConformidadesAction(filtros?)` — lista NCs
- `buscarNCAction(id)` — detalhe de NC com ações corretivas
- `atualizarNCAction(id, data)` — edita NC
- `resolverNCManualAction(id, data)` — resolve NC manualmente
- `criarAcaoAction(ncId, data)` — cria ação corretiva
- `concluirAcaoAction(acaoId, data)` — conclui ação com evidência
- `buscarMetricasNC(filtros?)` — métricas para dashboard de NCs

### `dashboard.actions.ts`
- `buscarDadosDashboardAction()` — KPIs, gráficos, rankings

### `relatorios.actions.ts`
- `buscarDadosRelatorioAction(filtros)` — dados para relatório

### `agendamentos.actions.ts`
- CRUD de agendamentos de inspeção

### `configuracoes.actions.ts`
- `buscarConfiguracoesAction()` — configurações do tenant
- `salvarConfiguracoesAction(data)` — salva configurações (notificações, integrações, etc.)

### `notificacoes.actions.ts`
- `listarNotificacoesAction()` — notificações do usuário
- `marcarLidaAction(id)` — marca como lida
- `marcarTodasLidasAction()` — marca todas como lidas

### `auditoria.actions.ts`
- `buscarAuditoriaAction(filtros?)` — logs de auditoria do tenant

### `super-admin.actions.ts`
- `buscarTenantAction(id)` — dados de um município
- `listarTenantsAction()` — lista todos os municípios
- `alterarPlanoMunicipioAction(tenantId, plano, status)` — altera plano/status
- `buscarAuditoriaGlobalAction(filtros?)` — logs de todos os tenants
  > **ATENÇÃO:** Faz queries **separadas** para `LogAuditoria`, `Tenant` e `Usuario` e mapeia manualmente — não usa `include` (problema de DLL lock no Windows com client Prisma desatualizado).

### `lgpd.actions.ts`
- Exportação e deleção de dados do usuário (LGPD)

---

## 8. Componentes Principais

### 8.1 Layout (`src/components/layout/`)
- `Sidebar.tsx` / `SidebarContent.tsx` — navegação lateral desktop
- `MobileNav.tsx` / `MobileTabBar.tsx` — navegação mobile
- `BuscaGlobal.tsx` — busca global no header
- `ThemeToggle.tsx` — alternância dark/light

### 8.2 UI base (`src/components/ui/`)
Componentes shadcn customizados: `Button`, `Input`, `Label`, `Dialog`, `Badge`, `Avatar`, `Card`, `Select`, `Table`, `Textarea`, `Skeleton`, `Separator`, `DropdownMenu`.

> **ATENÇÃO:** O `Button` customizado **NÃO suporta** a prop `asChild`. Para combinar `Button` + `Link`, use um `<Link>` estilizado diretamente com classes Tailwind.

### 8.3 Shared (`src/components/shared/`)
- `PageHeader` — cabeçalho de página padrão
- `EmptyState` — estado vazio com ícone e mensagem
- `DataTable` — tabela com paginação
- `LoadingSkeleton` — skeleton loader
- `PapelBadge` — badge colorido por papel do usuário
- `ScoreBadge` — badge de score de inspeção
- `EscolaChips` — chips de escolas vinculadas
- `InstallPWABanner` — banner de instalação PWA
- `StatusConexao` — indicador online/offline

### 8.4 Escolas (`src/components/escolas/`)
- `EscolaForm.tsx` — formulário criar/editar escola com auto-preenchimento de CEP
- `EscolaCard.tsx` / `EscolaRow.tsx` — exibição em grid/lista
- `EscolaDetalheClient.tsx` — detalhe com 4 abas: Visão Geral, Inspeções, NCs, Equipe
- `ModalUsuariosEscola.tsx` — gerencia equipe da escola

### 8.5 Checklists (`src/components/checklists/`)
- `ChecklistCard.tsx` — card de checklist na listagem
- `ItemConfigPanel.tsx` — painel de configuração de item (tipo, peso, seção, opções)
- `SortableItemList.tsx` — lista de itens com DnD, agrupamento por seção
- `OpcoesList.tsx` — editor de opções para múltipla escolha
- `PreviewChecklist.tsx` — pré-visualização do checklist
- `SaveIndicator.tsx` — indicador de salvamento automático
- `CategoriaBadge.tsx` — badge de categoria

### 8.6 Inspeção (`src/components/inspecao/`)
- `ItemInspecao.tsx` — item de inspeção com resposta e foto
- `RespostaSimNao.tsx`, `RespostaNumerica.tsx`, `RespostaTextoLivre.tsx`, `RespostaMultiplaEscolha.tsx`, `RespostaEscala.tsx`, `RespostaFoto.tsx` — componentes de resposta por tipo
- `AssinaturaCanvas.tsx` — canvas para assinatura digital
- `ObservacaoBottomSheet.tsx` — bottom sheet mobile para observações
- `ModalInspecaoDuplicada.tsx` — alerta de inspeção duplicada (offline)
- `mobile/` — componentes específicos para mobile (Progresso, Resultado, Finalização)

### 8.7 Não Conformidades (`src/components/naoConformidades/`)
- `SeveridadeBadge.tsx`, `StatusNCBadge.tsx`, `PrioridadeBadge.tsx` — badges de status
- `ModalAcao.tsx` — modal criar ação corretiva
- `ModalConcluirAcao.tsx` — modal concluir ação com evidência
- `HistoricoNC.tsx` — histórico de eventos da NC

### 8.8 Dashboard (`src/components/dashboard/`)
- `SecaoKPIs.tsx` — cards de KPIs principais
- `GraficoConformidade.tsx` — gráfico de conformidade
- `HeatmapInspecoes.tsx` — heatmap de inspeções por dia
- `RankingEscolas.tsx` — ranking de escolas por score
- `GraficoNCSeveridade.tsx` — distribuição de NCs por severidade
- `GraficoEvolucaoNCs.tsx` — evolução de NCs ao longo do tempo
- `ItensMaisReprovados.tsx` — itens com mais reprovações
- `AtividadeEquipe.tsx` — atividade recente da equipe
- `TrialBanner.tsx` — banner de trial expirando
- `WelcomeModal.tsx` — modal de boas-vindas no primeiro acesso

### 8.9 Relatórios (`src/components/relatorios/`)
- `RelatoriosClient.tsx` — container principal com abas
- `AbaInspecoesRelatorio.tsx`, `AbaNcsRelatorio.tsx`, `AbaFNDE.tsx`, `AbaHistorico.tsx`
- `DateRangePicker.tsx` — seletor de período
- `SheetPreviaPDF.tsx` — pré-visualização PDF
- `ConfigAutoRelatorio.tsx` — configuração de relatório automático
- `pdf/RelatorioInspecoesPDF.tsx`, `pdf/RelatorioFNDEPDF.tsx` — templates PDF

### 8.10 Super-Admin (`src/components/super-admin/`)
- `BillingClient.tsx` — gestão de planos/billing com portais React para dropdowns
- `MunicipiosClient.tsx` — listagem de municípios com portais React para dropdowns

> **PADRÃO DE DROPDOWN NO SUPER-ADMIN:** Dropdowns usam `React.createPortal` renderizado em `document.body`, posicionados via `getBoundingClientRect()`, para evitar clipping por `overflow: hidden` nas tabelas.

---

## 9. Validações Zod (`src/lib/validations.ts`)

| Schema | Campos validados |
|---|---|
| `escolaSchema` | nome (min 3), codigoInep (8 dígitos), cep (formato 00000-000), numeroAlunos (0–99999), turnos (min 1) |
| `usuarioSchema` | nome, email, papel, ativo |
| `checklistSchema` | nome, descricao, categoria, frequencia |
| `checklistItemSchema` | pergunta, tipoResposta, peso, valorMin/Max (obrigatórios para NUMERICO), opcoes (min 2 para MULTIPLA_ESCOLHA) |
| `iniciarInspecaoSchema` | escolaId (UUID), checklistId (UUID), clienteId? |
| `salvarRespostaSchema` | inspecaoId, itemId, campos de resposta opcionais |
| `finalizarInspecaoSchema` | inspecaoId, assinaturaUrl?, latLng? |
| `ncUpdateSchema` | titulo?, descricao?, severidade?, prazoResolucao? |
| `criarAcaoSchema` | descricao (min 10), responsavelId?, prazo?, prioridade |
| `concluirAcaoSchema` | acaoId, observacaoConclusao (min 10), evidenciaUrl? |
| `resolverNcManualSchema` | observacao (min 10) |
| `alterarNomeSchema` | nome (só letras, min 3) |
| `alterarSenhaSchema` | senhaAtual, novaSenha (min 8, maiúscula, número), confirmar |

---

## 10. Offline e PWA

### Modo Offline
- **Dexie** (wrapper IndexedDB) armazena inspeções pendentes localmente
- Página `sync/page.tsx` exibe inspeções pendentes e sincroniza quando online
- API Routes em `/api/sync/*` aceitam dados sincronizados
- `clienteId` único por inspeção evita duplicação na sincronização

### PWA
- `next-pwa` + Workbox geram service worker automaticamente
- `InstallPWABanner` exibe botão de instalação
- `StatusConexao` exibe status online/offline em tempo real
- `home-mobile/page.tsx` é a home otimizada para mobile/PWA

---

## 11. Geração de PDF e Excel

### PDF (`@react-pdf/renderer`)
- Templates em `src/components/relatorios/pdf/`
- Gerado via API Route `GET /api/relatorios/pdf`
- Tipos: Relatório de Inspeções, Relatório FNDE

### Excel (`exceljs`)
- Gerado via API Route `GET /api/relatorios/excel`
- Exportação de NCs via `GET /api/nao-conformidades/exportar`
- Exportação de usuários via `GET /api/usuarios/exportar`

---

## 12. Notificações

### E-mail (Resend + React Email)
- Templates em `src/components/relatorios/` e acionados por `notificacoes.actions.ts`
- Configurações por tenant: `notifEmailAdmin`, `notifEmailNutricionista`, `notifReplyTo`

### Push (Web Push API)
- `PushSubscription` armazena endpoint/chaves por dispositivo/usuário
- `PreferenciaNotificacao` controla quais eventos geram push por usuário

### Tipos de Notificação
`nc_critica` | `nc_resolvida` | `inspecao_reprovada` | `agendamento_lembrete` | `nc_vencida`

---

## 13. Cron Jobs

| Rota | Frequência recomendada | O que faz |
|---|---|---|
| `POST /api/cron/verificar-ncs-vencidas` | Diária | Marca NCs `ABERTA/EM_ANDAMENTO` com `prazoResolucao < now` como `VENCIDA` |
| `POST /api/cron/verificar-agendamentos` | A cada hora | Dispara inspeções agendadas com `proximaExecucao <= now` |

---

## 14. Regras de Negócio Críticas

### 14.1 Score de Inspeção
- Calculado ao finalizar: soma `peso` dos itens conformes / soma `peso` total de itens respondidos × 100
- Mapeamento de score → `ScoreStatus`:
  - ≥ 90 → `CONFORME`
  - ≥ 70 → `ATENCAO`
  - ≥ 50 → `NAO_CONFORME`
  - < 50 → `REPROVADO`

### 14.2 Geração Automática de NCs
- Ao finalizar inspeção, itens com `conforme = false` E `isCritico = true` geram NC com `severidade = CRITICA` automaticamente
- Itens com `conforme = false` E `isCritico = false` geram NC com `severidade = MEDIA`

### 14.3 Acesso a Escolas por Papel
- `ADMIN_MUNICIPAL`, `NUTRICIONISTA`, `SUPER_ADMIN` → acesso a **todas** as escolas do tenant
- `DIRETOR_ESCOLA`, `MERENDEIRA` → acesso apenas às escolas vinculadas via `UsuarioEscola`

### 14.4 Convites
- Token UUID único, expira em X dias
- Ao aceitar: cria `Usuario` no Prisma + usuário no Supabase Auth
- Convite pode pre-vincular escolas via `escolasIds[]`

### 14.5 2FA (TOTP)
- `otplib` gera segredo, `qrcode` gera QR Code
- Segredo armazenado em `Usuario.doisFatoresSegredo`
- Códigos de recuperação em `Usuario.codigosRecuperacao[]`

---

## 15. Variáveis de Ambiente

```env
DATABASE_URL=          # URL de conexão Prisma (pooled, via pgbouncer)
DIRECT_URL=            # URL direta PostgreSQL (para migrações)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=        # Envio de e-mails
NEXT_PUBLIC_APP_URL=   # URL da aplicação
SENTRY_DSN=            # Monitoramento de erros
```

---

## 16. Padrões e Armadilhas Conhecidas

### Prisma
- ❌ **NUNCA** use `include` e `select` simultaneamente na mesma query — Prisma lança `PrismaClientValidationError`
- ✅ Use apenas `select` com `select` aninhados para buscar relações
- No Windows: o client Prisma pode ficar travado por DLL lock. Use `prisma db push --skip-generate` para aplicar schema sem regenerar. Para queries problemáticas, faça queries separadas e mapeie manualmente.

### Campos de Banco
- `Escola.ativa` (feminino) — **não** `ativo`
- `Usuario.ativo` (masculino)
- `ChecklistModelo.ativo` (masculino)
- Sempre verifique o schema antes de escrever queries

### Dropdowns em Tabelas
- Tabelas com `overflow: hidden` clipam dropdowns absolutos
- Solução: `React.createPortal` renderizado em `document.body`, posicionado via `getBoundingClientRect()`

### Button + Link
- O `Button` customizado (shadcn) **não suporta** `asChild`
- Para botão-link, use `<Link className="inline-flex items-center ...">` diretamente

### Server Actions
- Sempre retornar objeto `{ sucesso: boolean, erro?: string, ...dados }` — nunca lançar exceção não tratada
- Sempre filtrar por `tenantId` do usuário autenticado
- SUPER_ADMIN não tem `tenantId` próprio — queries globais não filtram por tenant

### Multi-tenant
- **Todo** `findMany`, `findFirst`, `findUnique` em Server Actions normais deve incluir `tenantId: user.tenantId` no `where`
- Exceção: SUPER_ADMIN actions em `super-admin.actions.ts`

### Formulários
- Sempre usar `react-hook-form` + `zodResolver` + schema de `src/lib/validations.ts`
- `id="escola-form"` nos formulários que têm submit button externo ao form

### CEP
- Auto-preenchimento via `GET /api/cep/[cep]` (proxy do ViaCEP com cache)
- Resposta: `{ logradouro, bairro, localidade, uf }`
- Campo no form: `localidade` → `cidade`

---

## 17. Estrutura de Arquivos Relevantes

```
src/
├── actions/           → Server Actions (lógica de negócio server-side)
├── app/               → App Router (páginas, layouts, API routes)
├── components/
│   ├── auth/          → Componentes de autenticação
│   ├── checklists/    → Builder de checklist
│   ├── dashboard/     → Gráficos e KPIs
│   ├── escolas/       → CRUD de escolas
│   ├── inspecao/      → Formulário de inspeção
│   ├── layout/        → Sidebar, nav, header
│   ├── naoConformidades/ → NCs e ações corretivas
│   ├── relatorios/    → PDF, Excel, relatórios
│   ├── shared/        → Componentes reutilizáveis
│   ├── super-admin/   → Painel super-admin
│   ├── ui/            → Componentes base (shadcn)
│   └── usuarios/      → Gestão de usuários
├── lib/
│   ├── auth.ts        → Helpers de autenticação
│   ├── plano.ts       → Limites de plano e verificações
│   ├── prisma.ts      → Instância singleton do Prisma client
│   ├── validations.ts → Schemas Zod
│   ├── auditoria.ts   → Helper para gravar logs de auditoria
│   ├── utils.ts       → Utilitários gerais (cn, formatters)
│   └── constants.ts   → Constantes da aplicação
├── middleware.ts      → Proteção de rotas (raiz do projeto)
prisma/
└── schema.prisma      → Schema completo do banco
```

---

*Última atualização: Abril 2026*
