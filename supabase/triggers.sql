-- Função para gerar NCs ao finalizar inspeção
CREATE OR REPLACE FUNCTION fn_gerar_nc_automatica()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'FINALIZADA' AND OLD.status = 'EM_ANDAMENTO' THEN
    INSERT INTO nao_conformidades (id, "tenantId", "inspecaoId", "itemId", titulo, severidade, status, "createdAt", "updatedAt")
    SELECT 
      gen_random_uuid(),
      NEW."tenantId",
      NEW.id,
      r."itemId",
      'NC: ' || LEFT(i.pergunta, 100),
      CASE WHEN i."isCritico" THEN 'CRITICA'::"Severidade" ELSE 'MEDIA'::"Severidade" END,
      'ABERTA'::"StatusNC",
      NOW(),
      NOW()
    FROM respostas_itens r
    JOIN checklist_itens i ON i.id = r."itemId"
    WHERE r."inspecaoId" = NEW.id AND r.conforme = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_inspecao_finalizada ON inspecoes;
CREATE TRIGGER trg_inspecao_finalizada
AFTER UPDATE ON inspecoes
FOR EACH ROW EXECUTE FUNCTION fn_gerar_nc_automatica();

-- Função para atualizar status de NC para VENCIDA
CREATE OR REPLACE FUNCTION fn_atualizar_nc_vencida()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."prazoResolucao" < NOW() AND NEW.status IN ('ABERTA', 'EM_ANDAMENTO') THEN
    NEW.status = 'VENCIDA'::"StatusNC";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_nc_vencida ON nao_conformidades;
CREATE TRIGGER trg_nc_vencida
BEFORE UPDATE ON nao_conformidades
FOR EACH ROW EXECUTE FUNCTION fn_atualizar_nc_vencida();
