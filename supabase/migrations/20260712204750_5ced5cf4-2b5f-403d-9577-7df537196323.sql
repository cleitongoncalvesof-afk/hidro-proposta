
-- 1) Colunas em tipos_aplicacao
ALTER TABLE public.tipos_aplicacao
  ADD COLUMN IF NOT EXISTS descricao text,
  ADD COLUMN IF NOT EXISTS litros_por_tanque numeric NOT NULL DEFAULT 6.5,
  ADD COLUMN IF NOT EXISTS preco_por_litro numeric NOT NULL DEFAULT 7.0,
  ADD COLUMN IF NOT EXISTS rendimento_medio_m2 numeric NOT NULL DEFAULT 250;

-- 2) Colunas em orcamentos
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS combustivel_equipamento_modo text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS pdf_url text;

-- 3) Atualiza valores dos tipos já existentes (por usuário)
UPDATE public.tipos_aplicacao SET litros_por_tanque = 6.5, preco_por_litro = 7.0, rendimento_medio_m2 = 250
  WHERE proposta_tipo = 'grama_liquida';
UPDATE public.tipos_aplicacao SET litros_por_tanque = 6.5, preco_por_litro = 6.5, rendimento_medio_m2 = 625
  WHERE nome = 'HIDROMANTA';

-- 4) Seed dos novos tipos de talude para todos os usuários existentes (mix_sementes)
INSERT INTO public.tipos_aplicacao (user_id, nome, custo_padrao_m2, proposta_tipo, litros_por_tanque, preco_por_litro, rendimento_medio_m2)
SELECT ec.user_id, 'TALUDE ATÉ 45°', 0, 'mix_sementes', 6.5, 7.0, 500
FROM public.empresa_config ec
WHERE NOT EXISTS (
  SELECT 1 FROM public.tipos_aplicacao t WHERE t.user_id = ec.user_id AND t.nome = 'TALUDE ATÉ 45°'
);

INSERT INTO public.tipos_aplicacao (user_id, nome, custo_padrao_m2, proposta_tipo, litros_por_tanque, preco_por_litro, rendimento_medio_m2)
SELECT ec.user_id, 'TALUDE ACIMA DE 45°', 0, 'mix_sementes', 6.5, 7.0, 312.5
FROM public.empresa_config ec
WHERE NOT EXISTS (
  SELECT 1 FROM public.tipos_aplicacao t WHERE t.user_id = ec.user_id AND t.nome = 'TALUDE ACIMA DE 45°'
);

-- 5) Atualiza handle_new_user para incluir novos padrões e talude para futuros usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.empresa_config (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  INSERT INTO public.proposta_templates (user_id, tipo, texto_abertura, usa_campo_obra, usa_mobilizacao, texto_responsabilidade_contratante, texto_termos, texto_garantia, validade_dias, despedida)
  VALUES (
    NEW.id, 'grama_liquida',
    'Nós da 4G AGROVERDE sempre permaneceremos com assessoria no que diz respeito aos nossos produtos e serviços.',
    false, false, '', '', '', 10, 'Atenciosamente'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.proposta_templates (user_id, tipo, texto_abertura, usa_campo_obra, usa_mobilizacao, texto_responsabilidade_contratante, texto_termos, texto_garantia, validade_dias, despedida)
  VALUES (
    NEW.id, 'mix_sementes',
    'Prezado(a) Sr(a), atendendo o seu pedido, estamos enviando nossa proposta.',
    true, true, '', '', '', 30, 'Cordialmente'
  ) ON CONFLICT DO NOTHING;

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

-- 6) Políticas RLS para o bucket propostas-pdf (será criado via tool)
CREATE POLICY "Users can upload own propostas" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'propostas-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own propostas" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'propostas-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own propostas" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'propostas-pdf' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read propostas" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'propostas-pdf');
