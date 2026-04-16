# Deploy Checklist — MerendaCheck

## Pré-Deploy (toda vez)

### 1. Código
- [ ] `npm run test:unit` — todos os testes passando
- [ ] `npx tsc --noEmit --skipLibCheck` — zero erros TypeScript
- [ ] `npm run lint` — zero warnings críticos
- [ ] PR aprovado e merged na branch `main`

### 2. Banco de Dados
- [ ] `npx prisma migrate deploy` rodou sem erros
- [ ] Backup do banco feito antes de qualquer migração destrutiva
- [ ] Seeds necessários aplicados em produção

### 3. Variáveis de Ambiente (Vercel)
Confirmar que todas estão definidas em **Settings → Environment Variables**:

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | ✅ | Connection string PostgreSQL (Supabase) |
| `DIRECT_URL` | ✅ | URL direta para migrations Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL pública do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Chave anon pública Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Chave service role (nunca expor) |
| `ENCRYPTION_KEY` | ✅ | 32 bytes para AES-256 (2FA secrets) |
| `NEXT_PUBLIC_SENTRY_DSN` | ✅ | DSN do projeto Sentry |
| `SENTRY_ORG` | ✅ | Slug da org no Sentry |
| `SENTRY_PROJECT` | ✅ | Slug do projeto no Sentry |
| `SENTRY_AUTH_TOKEN` | ✅ | Token para upload de source maps |
| `RESEND_API_KEY` | ✅ | API key do Resend (e-mails) |
| `RESEND_FROM_EMAIL` | ✅ | E-mail remetente verificado |
| `NEXT_PUBLIC_APP_URL` | ✅ | URL de produção (ex: `https://app.merendacheck.com.br`) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ⚠️ | API Google Gemini (IA de análise) |

### 4. Supabase
- [ ] Storage bucket `logos` existe e é público
- [ ] Storage bucket `exportacoes-lgpd` existe e é **privado**
- [ ] RLS policies ativas em todas as tabelas sensíveis
- [ ] E-mail templates personalizados (convite, redefinição de senha)

### 5. Sentry
- [ ] Projeto criado em `sentry.io`
- [ ] DSN copiado para variáveis de ambiente
- [ ] Auth token gerado em Settings → Auth Tokens

---

## Deploy

### Vercel (recomendado)
```bash
# Via CLI
npx vercel --prod

# Ou push na branch main ativa o GitHub Actions automaticamente
git push origin main
```

### Manual (fallback)
```bash
npm run build
npm run start
```

---

## Pós-Deploy

### Smoke Tests (executar logo após deploy)
- [ ] Login funciona (email + senha)
- [ ] Dashboard carrega dados do tenant
- [ ] Criar nova inspeção e responder itens
- [ ] Finalizar inspeção — score calculado corretamente
- [ ] Upload de logo na página de configurações
- [ ] Gerar PDF de relatório

### Monitoramento
- [ ] Sentry recebendo eventos (verificar Issues dashboard)
- [ ] Vercel Analytics com métricas de Core Web Vitals
- [ ] Checar logs do servidor nas últimas horas

### Rollback (se necessário)
```bash
# Vercel — revert para deploy anterior
vercel rollback

# Banco — restaurar backup se migration foi destrutiva
pg_restore -d $DATABASE_URL backup_YYYYMMDD.dump
```

---

## Primeiro Deploy (novo cliente)

1. Criar tenant no banco via seed ou painel admin
2. Criar usuário ADMIN_MUNICIPAL
3. Enviar convite por e-mail
4. Configurar escolas via importação ou cadastro manual
5. Criar primeiro checklist
6. Agendar inspeção piloto

---

## Contatos de Emergência

| Serviço | Status page | Suporte |
|---|---|---|
| Vercel | vercel-status.com | vercel.com/support |
| Supabase | status.supabase.com | supabase.com/support |
| Sentry | status.sentry.io | sentry.io/contact |
| Resend | resend.com/status | resend.com/support |
