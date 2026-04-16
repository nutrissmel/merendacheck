-- Criar Buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inspecoes-fotos', 'inspecoes-fotos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('assinaturas', 'assinaturas', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('evidencias-acoes', 'evidencias-acoes', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage
CREATE POLICY "Fotos: acesso por tenant" ON storage.objects FOR ALL USING (
  bucket_id = 'inspecoes-fotos' AND (storage.foldername(name))[1] = get_tenant_id()::text
);

CREATE POLICY "Assinaturas: acesso por tenant" ON storage.objects FOR ALL USING (
  bucket_id = 'assinaturas' AND (storage.foldername(name))[1] = get_tenant_id()::text
);

CREATE POLICY "Logos: leitura pública" ON storage.objects FOR SELECT USING (
  bucket_id = 'logos'
);

CREATE POLICY "Logos: escrita por tenant" ON storage.objects FOR ALL USING (
  bucket_id = 'logos' AND (storage.foldername(name))[1] = get_tenant_id()::text
);

CREATE POLICY "Evidencias: acesso por tenant" ON storage.objects FOR ALL USING (
  bucket_id = 'evidencias-acoes' AND (storage.foldername(name))[1] = get_tenant_id()::text
);
