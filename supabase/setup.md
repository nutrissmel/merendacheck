# Setup Supabase — MerendaCheck

Este guia orienta a configuração do backend no Supabase para o MerendaCheck.

## 1. Criar Projeto no Supabase
- Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
- Defina o nome como `MerendaCheck` e escolha uma região próxima (ex: `South America (São Paulo)`).

## 2. Configurar Variáveis de Ambiente
No seu arquivo `.env` (ou no painel de Secrets do AI Studio), configure:
- `DATABASE_URL`: String de conexão com pooling (porta 6543).
- `DIRECT_URL`: String de conexão direta (porta 5432).
- `NEXT_PUBLIC_SUPABASE_URL`: URL do projeto.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Chave anônima pública.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço secreta.

## 3. Rodar Migrations
No terminal do projeto:
```bash
npx prisma migrate dev --name init
```

## 4. Aplicar RLS (Row Level Security)
- No painel do Supabase, vá em **SQL Editor**.
- Crie um novo query.
- Copie o conteúdo de `supabase/rls.sql` e execute.

## 5. Aplicar Triggers
- No **SQL Editor**, crie um novo query.
- Copie o conteúdo de `supabase/triggers.sql` e execute.

## 6. Criar Buckets de Storage
- No **SQL Editor**, crie um novo query.
- Copie o conteúdo de `supabase/storage.sql` e execute.
- Isso criará os buckets `inspecoes-fotos`, `assinaturas`, `logos` e `evidencias-acoes` com suas respectivas políticas.

## 7. Configurar Autenticação
- Vá em **Authentication** > **Providers**.
- Certifique-se de que **Email** está habilitado.
- (Opcional) Desabilite a confirmação de e-mail para testes rápidos de desenvolvimento.

## 8. Rodar Seed
Para popular o banco com dados iniciais:
```bash
npx prisma db seed
```

## 9. Testar Isolamento
- Crie dois usuários em tenants diferentes (ou use o seed para o primeiro).
- Verifique se um usuário não consegue ver as escolas ou inspeções do outro.
