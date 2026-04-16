-- Função para o Auth Hook do Supabase
-- Configurar em: Supabase Dashboard > Auth > Hooks > Custom Access Token Hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  v_usuario public.usuarios%ROWTYPE;
BEGIN
  -- Buscar dados do usuário na nossa tabela
  SELECT * INTO v_usuario
  FROM public.usuarios
  WHERE supabase_user_id = (event->>'user_id')::uuid;

  -- Pegar claims existentes
  claims := event->'claims';

  -- Injetar dados do nosso sistema
  IF v_usuario.id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}',    to_jsonb(v_usuario.tenant_id::text));
    claims := jsonb_set(claims, '{papel}',         to_jsonb(v_usuario.papel::text));
    claims := jsonb_set(claims, '{nome}',          to_jsonb(v_usuario.nome));
    claims := jsonb_set(claims, '{usuario_id}',   to_jsonb(v_usuario.id::text));
    claims := jsonb_set(claims, '{ativo}',         to_jsonb(v_usuario.ativo));
    claims := jsonb_set(claims, '{primeiro_acesso}', to_jsonb(v_usuario.primeiro_acesso));
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Dar permissão ao service_role
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
