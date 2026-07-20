
-- 1) usuarios_perfil
CREATE TABLE public.usuarios_perfil (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  email text,
  role text NOT NULL DEFAULT 'usuario' CHECK (role IN ('admin','usuario')),
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','bloqueado')),
  criado_em timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.usuarios_perfil TO authenticated;
GRANT ALL ON public.usuarios_perfil TO service_role;

ALTER TABLE public.usuarios_perfil ENABLE ROW LEVEL SECURITY;

-- 2) Helper functions (SECURITY DEFINER, avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = uid AND role = 'admin' AND status = 'ativo');
$$;

CREATE OR REPLACE FUNCTION public.is_ativo(uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.usuarios_perfil WHERE user_id = uid AND status = 'ativo');
$$;

-- 3) Policies on usuarios_perfil
CREATE POLICY "perfil select self or admin" ON public.usuarios_perfil
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "perfil insert admin" ON public.usuarios_perfil
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "perfil update admin" ON public.usuarios_perfil
  FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "perfil delete admin" ON public.usuarios_perfil
  FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4) Replace existing data-table policies to also require active status
DROP POLICY "own clientes" ON public.clientes;
CREATE POLICY "own clientes" ON public.clientes FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_ativo(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_ativo(auth.uid()));

DROP POLICY "own config" ON public.empresa_config;
CREATE POLICY "own config" ON public.empresa_config FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_ativo(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_ativo(auth.uid()));

DROP POLICY "own itens" ON public.orcamento_itens;
CREATE POLICY "own itens" ON public.orcamento_itens FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_ativo(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_ativo(auth.uid()));

DROP POLICY "own orc" ON public.orcamentos;
CREATE POLICY "own orc" ON public.orcamentos FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_ativo(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_ativo(auth.uid()));

DROP POLICY "own templates" ON public.proposta_templates;
CREATE POLICY "own templates" ON public.proposta_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_ativo(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_ativo(auth.uid()));

DROP POLICY "own tipos" ON public.tipos_aplicacao;
CREATE POLICY "own tipos" ON public.tipos_aplicacao FOR ALL TO authenticated
  USING (auth.uid() = user_id AND public.is_ativo(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_ativo(auth.uid()));

-- 5) Update handle_new_user to also create perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
BEGIN
  INSERT INTO public.usuarios_perfil (user_id, nome, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    'usuario',
    'ativo'
  ) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.empresa_config (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  INSERT INTO public.proposta_templates (user_id, tipo, texto_abertura, usa_campo_obra, usa_mobilizacao, texto_responsabilidade_contratante, texto_termos, texto_garantia, validade_dias, despedida)
  VALUES (NEW.id, 'grama_liquida',
    'Nós da 4G AGROVERDE sempre permaneceremos com assessoria no que diz respeito aos nossos produtos e serviços.',
    false, false, '', '', '', 10, 'Atenciosamente') ON CONFLICT DO NOTHING;

  INSERT INTO public.proposta_templates (user_id, tipo, texto_abertura, usa_campo_obra, usa_mobilizacao, texto_responsabilidade_contratante, texto_termos, texto_garantia, validade_dias, despedida)
  VALUES (NEW.id, 'mix_sementes',
    'Prezado(a) Sr(a), atendendo o seu pedido, estamos enviando nossa proposta.',
    true, true, '', '', '', 30, 'Cordialmente') ON CONFLICT DO NOTHING;

  INSERT INTO public.tipos_aplicacao (user_id, nome, custo_padrao_m2, proposta_tipo, litros_por_tanque, preco_por_litro, rendimento_medio_m2) VALUES
    (NEW.id, 'VERDEPLAN', 1.50, 'grama_liquida', 6.5, 7.0, 250),
    (NEW.id, 'VERDEFLEX', 1.94, 'grama_liquida', 6.5, 7.0, 250),
    (NEW.id, 'VERDEMAX', 3.26, 'grama_liquida', 6.5, 7.0, 250),
    (NEW.id, 'PLANTIO DE GRAMA', 4.22, 'grama_liquida', 6.5, 7.0, 250),
    (NEW.id, 'HIDROMANTA', 0, 'mix_sementes', 6.5, 6.5, 625),
    (NEW.id, 'TALUDE ATÉ 45°', 0, 'mix_sementes', 6.5, 7.0, 500),
    (NEW.id, 'TALUDE ACIMA DE 45°', 0, 'mix_sementes', 6.5, 7.0, 312.5)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $function$;

-- 6) Ensure trigger exists on auth.users (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7) Backfill existing users
INSERT INTO public.usuarios_perfil (user_id, nome, email, role, status)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'nome', u.email), u.email, 'usuario', 'ativo'
FROM auth.users u
ON CONFLICT (user_id) DO NOTHING;

-- 8) Mark admin
UPDATE public.usuarios_perfil
SET role = 'admin', status = 'ativo'
WHERE email = 'eduardogonc6186@gmail.com';
