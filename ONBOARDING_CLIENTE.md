# Onboarding de Cliente — MerendaCheck

Guia completo para configurar e treinar um novo município no sistema.

---

## 1. Configuração Inicial (responsabilidade da equipe MerendaCheck)

### 1.1 Criação do Tenant
- Acessar o painel de super admin
- Criar tenant com: nome do município, estado, código IBGE
- Definir plano de acesso

### 1.2 Criação do Administrador Municipal
- Enviar convite por e-mail para o nutricionista responsável
- Papel: `ADMIN_MUNICIPAL`
- O cliente receberá e-mail com link para definir senha

### 1.3 Configurações Pré-configuradas
- Ativar notificações padrão (NC crítica + inspeção reprovada)
- Configurar e-mail institucional no perfil do tenant

---

## 2. Configuração pelo Cliente (ADMIN_MUNICIPAL)

### 2.1 Dados do Município
**Configurações → Município**
- Preencher: nome, secretaria, telefone, e-mail, website, CNPJ
- Fazer upload do logotipo (PNG/SVG recomendado, máx. 2MB)

### 2.2 Cadastro de Escolas
**Escolas → Nova Escola**

Para cada escola informar:
- Nome completo
- Endereço
- Número de alunos
- Modalidade (Ensino Fundamental, EJA, etc.)

> **Dica:** Cadastre primeiro as escolas de maior risco nutricional para priorizar as primeiras inspeções.

### 2.3 Criação de Checklists
**Checklists → Novo Checklist**

Estrutura de um checklist:
- Nome (ex: "Controle de Temperatura — Câmaras Frias")
- Categoria
- Itens com:
  - Pergunta objetiva
  - Tipo de resposta (Sim/Não, Numérico, Texto)
  - Peso (1–5) — itens críticos de segurança alimentar devem ter peso 5
  - Marcar como **Crítico** caso a reprovação invalide a inspeção inteira

### 2.4 Criação de Usuários (Inspetores)
**Usuários → Convidar Usuário**
- Papel sugerido para inspetores de campo: `INSPETOR`
- Cada inspetor acessa pelo celular via PWA (sem precisar instalar app)

---

## 3. Primeiro Ciclo de Inspeções

### 3.1 Agendar Inspeções
**Inspeções → Novo Agendamento**
- Selecionar escola, checklist e data
- O inspetor receberá notificação automática

### 3.2 Realizar Inspeção (pelo Inspetor — mobile)
1. Acessar `app.merendacheck.com.br` no celular
2. Login com e-mail e senha
3. Tap em **Inspeções → Iniciar**
4. Responder cada item (SIM/NÃO ou valor numérico)
5. Fotografar evidências quando necessário
6. Finalizar e assinar digitalmente

> **Offline:** O app funciona sem internet. As respostas são sincronizadas quando a conexão é restaurada.

### 3.3 Acompanhar Resultados
**Dashboard → Visão Geral**
- Score de conformidade por escola
- Não Conformidades abertas
- Histórico de inspeções

---

## 4. Gestão de Não Conformidades (NCs)

### 4.1 Visualizar NCs
**Não Conformidades → Lista**

Status possíveis:
| Status | Significado |
|---|---|
| Aberta | NC detectada, sem ação |
| Em Tratamento | Ação corretiva registrada |
| Resolvida | Evidência de resolução anexada |
| Vencida | Prazo passou sem resolução |

### 4.2 Registrar Ação Corretiva
1. Clicar na NC
2. "Registrar Ação"
3. Descrever a ação tomada + responsável + prazo
4. Fazer upload de evidência fotográfica

### 4.3 Escalonamento
NCs críticas não resolvidas no prazo geram:
- Notificação por e-mail para o ADMIN_MUNICIPAL
- Alerta no dashboard

---

## 5. Relatórios

### 5.1 Relatório de Inspeção (PDF)
**Inspeções → [Inspeção] → Gerar PDF**
- Inclui: escola, data, inspetor, todos os itens, score, NCs, assinatura

### 5.2 Relatório Gerencial
**Relatórios → Gerencial**
- Comparativo entre escolas
- Evolução de conformidade ao longo do tempo
- Exportação para Excel

### 5.3 Relatório Mensal Automático
Ativar em **Configurações → Notificações → Relatório mensal**
- Enviado automaticamente todo dia 1º do mês

---

## 6. Segurança e Boas Práticas

### 6.1 Autenticação de Dois Fatores (2FA)
**Configurações → Segurança → Ativar 2FA**
- Recomendado para todos os usuários ADMIN
- Usar Google Authenticator ou Authy

### 6.2 Gestão de Senhas
- Exigir troca de senha no primeiro acesso
- Senhas devem ter mínimo 8 caracteres

### 6.3 Auditoria
**Configurações → Audit Log**
- Registro de todas as ações no sistema
- Disponível para ADMIN_MUNICIPAL

---

## 7. Suporte

| Canal | Quando usar |
|---|---|
| E-mail: suporte@merendacheck.com.br | Dúvidas gerais, solicitações |
| WhatsApp Business | Urgências durante horário comercial |
| Base de conhecimento (docs.merendacheck.com.br) | Tutoriais e FAQs |

**Horário de atendimento:** Segunda a sexta, 8h–18h (horário de Brasília)

---

## 8. Checklist de Treinamento

Marcar após treinamento presencial ou online com o cliente:

- [ ] Cliente fez login e configurou dados do município
- [ ] Logotipo cadastrado
- [ ] Mínimo 5 escolas cadastradas
- [ ] 1 checklist criado com mínimo 10 itens
- [ ] Pelo menos 1 inspetor convidado
- [ ] 1 inspeção realizada de ponta a ponta (teste)
- [ ] PDF de relatório gerado
- [ ] 2FA ativado para ADMIN
- [ ] Notificações configuradas
- [ ] Cliente sabe onde encontrar o suporte

**Treinamento concluído em:** ___/___/______
**Responsável MerendaCheck:** ________________________
**Responsável do Município:** ________________________
