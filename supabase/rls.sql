-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_escolas ENABLE ROW LEVEL SECURITY;
ALTER TABLE convites ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspecoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE nao_conformidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE acoes_corretivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

-- 2. Funções Helper
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'tenantId')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION get_papel()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'papel';
$$ LANGUAGE sql STABLE;

-- 3. Políticas de Segurança

-- TENANTS: Apenas leitura do próprio
CREATE POLICY "Tenants: leitura própria" ON tenants FOR SELECT USING (id = get_tenant_id());
CREATE POLICY "Tenants: update admin" ON tenants FOR UPDATE USING (id = get_tenant_id() AND get_papel() IN ('ADMIN_MUNICIPAL', 'SUPER_ADMIN'));

-- ESCOLAS: Filtro por tenant
CREATE POLICY "Escolas: tenant isolation" ON escolas FOR ALL USING (tenantId = get_tenant_id());

-- USUARIOS: Filtro por tenant
CREATE POLICY "Usuarios: tenant isolation" ON usuarios FOR ALL USING (tenantId = get_tenant_id());

-- USUARIO_ESCOLAS: Filtro por tenant
CREATE POLICY "Usuario_Escolas: tenant isolation" ON usuario_escolas FOR ALL USING (
  escolaId IN (SELECT id FROM escolas WHERE tenantId = get_tenant_id())
);

-- CONVITES: Filtro por tenant
CREATE POLICY "Convites: tenant isolation" ON convites FOR ALL USING (tenantId = get_tenant_id());

-- CHECKLIST_MODELOS: Filtro por tenant
CREATE POLICY "Checklist_Modelos: tenant isolation" ON checklist_modelos FOR ALL USING (tenantId = get_tenant_id());

-- CHECKLIST_ITENS: Filtro por tenant
CREATE POLICY "Checklist_Itens: tenant isolation" ON checklist_itens FOR ALL USING (
  checklistId IN (SELECT id FROM checklist_modelos WHERE tenantId = get_tenant_id())
);

-- INSPECOES: Regras complexas por papel
CREATE POLICY "Inspecoes: acesso por papel" ON inspecoes FOR SELECT USING (
  tenantId = get_tenant_id() AND (
    get_papel() IN ('ADMIN_MUNICIPAL', 'NUTRICIONISTA', 'SUPER_ADMIN') OR
    (get_papel() = 'DIRETOR_ESCOLA' AND escolaId IN (SELECT escolaId FROM usuario_escolas WHERE usuarioId = (SELECT id FROM usuarios WHERE supabaseUserId = auth.uid()::text))) OR
    (get_papel() = 'MERENDEIRA' AND inspetorId = (SELECT id FROM usuarios WHERE supabaseUserId = auth.uid()::text))
  )
);

CREATE POLICY "Inspecoes: inserção" ON inspecoes FOR INSERT WITH CHECK (
  tenantId = get_tenant_id() AND get_papel() IN ('MERENDEIRA', 'NUTRICIONISTA', 'ADMIN_MUNICIPAL')
);

CREATE POLICY "Inspecoes: update" ON inspecoes FOR UPDATE USING (
  tenantId = get_tenant_id() AND (inspetorId = (SELECT id FROM usuarios WHERE supabaseUserId = auth.uid()::text) OR get_papel() = 'ADMIN_MUNICIPAL')
);

-- RESPOSTAS_ITENS: Seguem a inspeção
CREATE POLICY "Respostas: tenant isolation" ON respostas_itens FOR ALL USING (
  inspecaoId IN (SELECT id FROM inspecoes WHERE tenantId = get_tenant_id())
);

-- NAO_CONFORMIDADES: Filtro por tenant
CREATE POLICY "NCs: tenant isolation" ON nao_conformidades FOR ALL USING (tenantId = get_tenant_id());

-- ACOES_CORRETIVAS: Filtro por tenant
CREATE POLICY "Ações: tenant isolation" ON acoes_corretivas FOR ALL USING (
  naoConformidadeId IN (SELECT id FROM nao_conformidades WHERE tenantId = get_tenant_id())
);

-- AGENDAMENTOS: Filtro por tenant
CREATE POLICY "Agendamentos: tenant isolation" ON agendamentos FOR ALL USING (tenantId = get_tenant_id());
