-- Performance indexes for MerendaCheck
-- Run this in Supabase Dashboard > SQL Editor

-- Escola
CREATE INDEX IF NOT EXISTS "escolas_tenantId_idx" ON "escolas"("tenantId");
CREATE INDEX IF NOT EXISTS "escolas_tenantId_ativa_idx" ON "escolas"("tenantId", "ativa");

-- Usuario
CREATE INDEX IF NOT EXISTS "usuarios_tenantId_idx" ON "usuarios"("tenantId");
CREATE INDEX IF NOT EXISTS "usuarios_tenantId_ativo_idx" ON "usuarios"("tenantId", "ativo");

-- Inspecao
CREATE INDEX IF NOT EXISTS "inspecoes_tenantId_idx" ON "inspecoes"("tenantId");
CREATE INDEX IF NOT EXISTS "inspecoes_escolaId_idx" ON "inspecoes"("escolaId");
CREATE INDEX IF NOT EXISTS "inspecoes_inspetorId_idx" ON "inspecoes"("inspetorId");
CREATE INDEX IF NOT EXISTS "inspecoes_checklistId_idx" ON "inspecoes"("checklistId");
CREATE INDEX IF NOT EXISTS "inspecoes_tenantId_status_idx" ON "inspecoes"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "inspecoes_tenantId_finalizadaEm_idx" ON "inspecoes"("tenantId", "finalizadaEm");
CREATE INDEX IF NOT EXISTS "inspecoes_escolaId_status_idx" ON "inspecoes"("escolaId", "status");

-- RespostaItem
CREATE INDEX IF NOT EXISTS "respostas_itens_inspecaoId_idx" ON "respostas_itens"("inspecaoId");

-- NaoConformidade
CREATE INDEX IF NOT EXISTS "nao_conformidades_tenantId_idx" ON "nao_conformidades"("tenantId");
CREATE INDEX IF NOT EXISTS "nao_conformidades_inspecaoId_idx" ON "nao_conformidades"("inspecaoId");
CREATE INDEX IF NOT EXISTS "nao_conformidades_tenantId_status_idx" ON "nao_conformidades"("tenantId", "status");
CREATE INDEX IF NOT EXISTS "nao_conformidades_tenantId_prazoResolucao_idx" ON "nao_conformidades"("tenantId", "prazoResolucao");

-- ChecklistModelo
CREATE INDEX IF NOT EXISTS "checklist_modelos_tenantId_idx" ON "checklist_modelos"("tenantId");
CREATE INDEX IF NOT EXISTS "checklist_modelos_tenantId_ativo_idx" ON "checklist_modelos"("tenantId", "ativo");

-- Agendamento
CREATE INDEX IF NOT EXISTS "agendamentos_tenantId_idx" ON "agendamentos"("tenantId");
CREATE INDEX IF NOT EXISTS "agendamentos_tenantId_proximaExecucao_idx" ON "agendamentos"("tenantId", "proximaExecucao");
CREATE INDEX IF NOT EXISTS "agendamentos_tenantId_ativo_idx" ON "agendamentos"("tenantId", "ativo");
