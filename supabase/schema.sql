-- MerendaCheck — Schema completo
-- Cole este SQL inteiro no Supabase SQL Editor e clique em Run

-- ─────────────────────────────────────────────────────────────────
-- 1. ENUMs
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "Papel" AS ENUM ('SUPER_ADMIN', 'ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'DIRETOR_ESCOLA', 'MERENDEIRA');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Plano" AS ENUM ('STARTER', 'CRESCIMENTO', 'MUNICIPAL', 'ENTERPRISE');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlanoStatus" AS ENUM ('TRIAL', 'ATIVO', 'CANCELADO', 'INADIMPLENTE');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Turno" AS ENUM ('MATUTINO', 'VESPERTINO', 'NOTURNO', 'INTEGRAL');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Frequencia" AS ENUM ('DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL', 'SOB_DEMANDA');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TipoResposta" AS ENUM ('SIM_NAO', 'NUMERICO', 'TEXTO_LIVRE', 'MULTIPLA_ESCOLHA', 'FOTO', 'ESCALA');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusInspecao" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ScoreStatus" AS ENUM ('CONFORME', 'ATENCAO', 'NAO_CONFORME', 'REPROVADO');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Severidade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusNC" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'RESOLVIDA', 'VENCIDA');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'URGENTE');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatusAcao" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'CONCLUIDA', 'VENCIDA');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CategoriaChecklist" AS ENUM ('TEMPERATURA', 'RECEBIMENTO_GENEROS', 'HIGIENE_PESSOAL', 'INSTALACOES', 'PREPARACAO_DISTRIBUICAO', 'CONTROLE_PRAGAS', 'HIGIENIZACAO_UTENSILIOS', 'OUTRO');
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 2. TABELAS (em ordem de dependência)
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "tenants" (
  "id"                   TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "nome"                 TEXT NOT NULL,
  "codigoIbge"           TEXT NOT NULL,
  "estado"               TEXT NOT NULL,
  "logoUrl"              TEXT,
  "nomeSecretaria"       TEXT,
  "telefone"             TEXT,
  "website"              TEXT,
  "plano"                "Plano" NOT NULL DEFAULT 'STARTER',
  "planoStatus"          "PlanoStatus" NOT NULL DEFAULT 'TRIAL',
  "stripeCustomerId"     TEXT,
  "stripeSubscriptionId" TEXT,
  "trialExpiresAt"       TIMESTAMP(3),
  "ativo"                BOOLEAN NOT NULL DEFAULT true,
  "createdAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_codigoIbge_key" ON "tenants"("codigoIbge");

CREATE TABLE IF NOT EXISTS "escolas" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"     TEXT NOT NULL,
  "nome"         TEXT NOT NULL,
  "codigoInep"   TEXT,
  "endereco"     TEXT,
  "bairro"       TEXT,
  "cidade"       TEXT,
  "cep"          TEXT,
  "numeroAlunos" INTEGER NOT NULL DEFAULT 0,
  "turnos"       "Turno"[] DEFAULT ARRAY[]::"Turno"[],
  "ativa"        BOOLEAN NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "escolas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "escolas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "usuarios" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"       TEXT NOT NULL,
  "supabaseUserId" TEXT NOT NULL,
  "nome"           TEXT NOT NULL,
  "email"          TEXT NOT NULL,
  "papel"          "Papel" NOT NULL,
  "ativo"          BOOLEAN NOT NULL DEFAULT true,
  "primeiroAcesso" BOOLEAN NOT NULL DEFAULT true,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "usuarios_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_supabaseUserId_key" ON "usuarios"("supabaseUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_email_tenantId_key" ON "usuarios"("email", "tenantId");

CREATE TABLE IF NOT EXISTS "usuario_escolas" (
  "id"        TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "usuarioId" TEXT NOT NULL,
  "escolaId"  TEXT NOT NULL,
  CONSTRAINT "usuario_escolas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "usuario_escolas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "usuario_escolas_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "usuario_escolas_usuarioId_escolaId_key" ON "usuario_escolas"("usuarioId", "escolaId");

CREATE TABLE IF NOT EXISTS "convites" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"       TEXT NOT NULL,
  "email"          TEXT NOT NULL,
  "papel"          "Papel" NOT NULL,
  "token"          TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "expiresAt"      TIMESTAMP(3) NOT NULL,
  "aceito"         BOOLEAN NOT NULL DEFAULT false,
  "escolasIds"     TEXT[] DEFAULT ARRAY[]::TEXT[],
  "mensagem"       TEXT,
  "convidadoPorId" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "convites_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "convites_convidadoPorId_fkey" FOREIGN KEY ("convidadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "convites_token_key" ON "convites"("token");

CREATE TABLE IF NOT EXISTS "checklist_modelos" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"   TEXT NOT NULL,
  "nome"       TEXT NOT NULL,
  "descricao"  TEXT,
  "categoria"  "CategoriaChecklist" NOT NULL,
  "frequencia" "Frequencia" NOT NULL DEFAULT 'SEMANAL',
  "ativo"      BOOLEAN NOT NULL DEFAULT true,
  "isTemplate" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "checklist_modelos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "checklist_modelos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "checklist_itens" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "checklistId"     TEXT NOT NULL,
  "ordem"           INTEGER NOT NULL,
  "pergunta"        TEXT NOT NULL,
  "descricao"       TEXT,
  "tipoResposta"    "TipoResposta" NOT NULL,
  "obrigatorio"     BOOLEAN NOT NULL DEFAULT true,
  "isCritico"       BOOLEAN NOT NULL DEFAULT false,
  "fotoObrigatoria" BOOLEAN NOT NULL DEFAULT false,
  "valorMinimo"     DOUBLE PRECISION,
  "valorMaximo"     DOUBLE PRECISION,
  "unidade"         TEXT,
  "opcoes"          TEXT[] DEFAULT ARRAY[]::TEXT[],
  "peso"            DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  CONSTRAINT "checklist_itens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "checklist_itens_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklist_modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "inspecoes" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"        TEXT NOT NULL,
  "escolaId"        TEXT NOT NULL,
  "checklistId"     TEXT NOT NULL,
  "inspetorId"      TEXT NOT NULL,
  "status"          "StatusInspecao" NOT NULL DEFAULT 'EM_ANDAMENTO',
  "score"           DOUBLE PRECISION,
  "scoreStatus"     "ScoreStatus",
  "iniciadaEm"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finalizadaEm"    TIMESTAMP(3),
  "latLng"          TEXT,
  "assinaturaUrl"   TEXT,
  "clienteId"       TEXT,
  "sincronizadaEm"  TIMESTAMP(3),
  CONSTRAINT "inspecoes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "inspecoes_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "inspecoes_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklist_modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "inspecoes_inspetorId_fkey" FOREIGN KEY ("inspetorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "inspecoes_clienteId_key" ON "inspecoes"("clienteId");

CREATE TABLE IF NOT EXISTS "respostas_itens" (
  "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "inspecaoId"       TEXT NOT NULL,
  "itemId"           TEXT NOT NULL,
  "respostaSimNao"   BOOLEAN,
  "respostaNumerica" DOUBLE PRECISION,
  "respostaTexto"    TEXT,
  "conforme"         BOOLEAN,
  "fotoUrl"          TEXT,
  "observacao"       TEXT,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "respostas_itens_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "respostas_itens_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "respostas_itens_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "checklist_itens"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "respostas_itens_inspecaoId_itemId_key" ON "respostas_itens"("inspecaoId", "itemId");

CREATE TABLE IF NOT EXISTS "nao_conformidades" (
  "id"             TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"       TEXT NOT NULL,
  "inspecaoId"     TEXT NOT NULL,
  "itemId"         TEXT NOT NULL,
  "titulo"         TEXT NOT NULL,
  "descricao"      TEXT,
  "severidade"     "Severidade" NOT NULL DEFAULT 'MEDIA',
  "status"         "StatusNC" NOT NULL DEFAULT 'ABERTA',
  "prazoResolucao" TIMESTAMP(3),
  "resolvidaEm"    TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "nao_conformidades_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "nao_conformidades_inspecaoId_fkey" FOREIGN KEY ("inspecaoId") REFERENCES "inspecoes"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "acoes_corretivas" (
  "id"                  TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "naoConformidadeId"   TEXT NOT NULL,
  "responsavelId"       TEXT,
  "descricao"           TEXT NOT NULL,
  "prazo"               TIMESTAMP(3),
  "prioridade"          "Prioridade" NOT NULL DEFAULT 'MEDIA',
  "status"              "StatusAcao" NOT NULL DEFAULT 'ABERTA',
  "evidenciaUrl"        TEXT,
  "observacaoConclusao" TEXT,
  "concluidaEm"         TIMESTAMP(3),
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "acoes_corretivas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "acoes_corretivas_naoConformidadeId_fkey" FOREIGN KEY ("naoConformidadeId") REFERENCES "nao_conformidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "acoes_corretivas_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "agendamentos" (
  "id"              TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "tenantId"        TEXT NOT NULL,
  "escolaId"        TEXT NOT NULL,
  "checklistId"     TEXT NOT NULL,
  "frequencia"      "Frequencia" NOT NULL,
  "diaSemana"       INTEGER,
  "diaMes"          INTEGER,
  "horario"         TEXT,
  "ativo"           BOOLEAN NOT NULL DEFAULT true,
  "proximaExecucao" TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "agendamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "agendamentos_escolaId_fkey" FOREIGN KEY ("escolaId") REFERENCES "escolas"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "agendamentos_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "checklist_modelos"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- ─────────────────────────────────────────────────────────────────
-- 3. Trigger para updatedAt automático
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER "tenants_updatedAt" BEFORE UPDATE ON "tenants" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER "escolas_updatedAt" BEFORE UPDATE ON "escolas" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER "usuarios_updatedAt" BEFORE UPDATE ON "usuarios" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER "checklist_modelos_updatedAt" BEFORE UPDATE ON "checklist_modelos" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER "nao_conformidades_updatedAt" BEFORE UPDATE ON "nao_conformidades" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER "acoes_corretivas_updatedAt" BEFORE UPDATE ON "acoes_corretivas" FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
