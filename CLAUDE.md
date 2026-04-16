# CLAUDE.md — MerendaCheck

> **INSTRUÇÃO OBRIGATÓRIA PARA TODA IA / AGENTE:**
> Leia o arquivo `SPEC.md` na raiz do projeto **antes de qualquer implementação, modificação ou sugestão**.
> O SPEC.md é a fonte de verdade do sistema — schema, arquitetura, padrões e armadilhas conhecidas estão documentados lá.

---

## Regras inegociáveis

1. **Leia o SPEC.md primeiro.** Sempre. Sem exceção.
2. **Nunca use `include` + `select` juntos em uma query Prisma** — causa `PrismaClientValidationError`.
3. **`Escola.ativa` é feminino** — use `where: { ativa: true }`, nunca `ativo: true`.
4. **`Usuario.ativo` é masculino** — use `where: { ativo: true }`.
5. **Sempre filtre por `tenantId`** em toda query de Server Action (exceto `super-admin.actions.ts`).
6. **O componente `Button` não suporta `asChild`** — use `<Link>` estilizado diretamente.
7. **Dropdowns em tabelas** usam `React.createPortal` para evitar clipping por `overflow: hidden`.
8. **Formulários** usam `react-hook-form` + `zodResolver` + schemas de `src/lib/validations.ts`.
9. **Server Actions** retornam `{ sucesso: boolean, erro?: string }` — nunca lançam exceções não tratadas.
10. **Schema do banco** fica em `prisma/schema.prisma` — consulte antes de escrever qualquer query.

## Arquivos-chave para consultar antes de implementar

| O que fazer | Arquivo(s) a ler |
|---|---|
| Qualquer feature nova | `SPEC.md` |
| Query Prisma | `prisma/schema.prisma` |
| Auth / permissões | `src/lib/auth.ts`, `middleware.ts` |
| Validação de formulário | `src/lib/validations.ts` |
| Lógica de planos | `src/lib/plano.ts` |
| Server Action nova | `src/actions/` (arquivo do domínio) |
| Componente UI | `src/components/ui/` e `src/components/shared/` |
