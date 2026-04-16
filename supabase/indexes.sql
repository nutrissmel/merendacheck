-- Queries mais frequentes que precisam de índice:
-- 1. Buscar todas as escolas de um tenant
CREATE INDEX IF NOT EXISTS idx_escolas_tenant ON escolas("tenantId");

-- 2. Buscar todas as inspeções de uma escola
CREATE INDEX IF NOT EXISTS idx_inspecoes_escola ON inspecoes("escolaId");

-- 3. Buscar inspeções por status e tenant
CREATE INDEX IF NOT EXISTS idx_inspecoes_tenant_status ON inspecoes("tenantId", "status");

-- 4. Buscar não conformidades abertas por tenant
CREATE INDEX IF NOT EXISTS idx_nao_conformidades_tenant_status ON nao_conformidades("tenantId", "status");

-- 5. Buscar usuários de um tenant por papel
CREATE INDEX IF NOT EXISTS idx_usuarios_tenant_papel ON usuarios("tenantId", "papel");

-- 6. Buscar checklist_itens por checklist (ordenados)
CREATE INDEX IF NOT EXISTS idx_checklist_itens_checklist_ordem ON checklist_itens("checklistId", "ordem");

-- 7. Buscar convite por token
CREATE INDEX IF NOT EXISTS idx_convites_token ON convites("token");

-- 8. Buscar inspeção por clienteId (sync offline)
CREATE INDEX IF NOT EXISTS idx_inspecoes_cliente_id ON inspecoes("clienteId");

-- 9. Buscar usuario_escolas por usuario
CREATE INDEX IF NOT EXISTS idx_usuario_escolas_usuario ON usuario_escolas("usuarioId");
