
-- Enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.proposta_tipo AS ENUM ('grama_liquida', 'mix_sementes');
CREATE TYPE public.orcamento_status AS ENUM ('rascunho', 'enviado', 'aprovado', 'recusado');

-- user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- update_updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- empresa_config (one per user)
CREATE TABLE public.empresa_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  razao_social text NOT NULL DEFAULT '4G SERVIÇOS LTDA',
  nome_fantasia text NOT NULL DEFAULT '4G AGROVERDE',
  endereco text NOT NULL DEFAULT 'Rua projetada 1, S/N – Bairro Magnaldo Fernandes – CEP: 65929-000 – São Francisco do Brejão-MA',
  cnpj text NOT NULL DEFAULT '60.963.001/0001-63',
  telefone text NOT NULL DEFAULT '(99) 99191-3482',
  email text NOT NULL DEFAULT 'comercial@4gagroverde.com.br',
  site text NOT NULL DEFAULT 'www.4gagroverde.com.br',
  dados_bancarios text NOT NULL DEFAULT 'BANCO BRADESCO, AG: 0721, CC: 107966-2',
  responsavel text NOT NULL DEFAULT 'Eduardo Sousa',
  cidade_assinatura text NOT NULL DEFAULT 'SÃO FRANCISCO DO BREJÃO-MA',
  logo_url text,
  margem_padrao numeric NOT NULL DEFAULT 0.70,
  aliquota_padrao numeric NOT NULL DEFAULT 0.12,
  texto_condicoes_pagamento_padrao text NOT NULL DEFAULT 'Pagamento de 50% na confirmação do pedido, restante após finalização do serviço.',
  texto_clausulas_cobranca text NOT NULL DEFAULT 'O cliente se compromete a efetuar os pagamentos conforme as condições estabelecidas nesta proposta. Permitindo, em caso de não pagamento, que se efetue a cobrança via Cartórios / Protestos, inclusão no SERASA, SPC, cobranças judiciais e cancelamento total da garantia dos serviços e produtos. Em caso de cancelamento, se compromete em pagar pelos serviços executados até o momento do cancelamento, mais taxa de 10% relativo a despesas de mobilização. Em caso de atrasos, se compromete em pagar multa de 2% e juros de mora de 3% ao mês até a quitação total de suas dívidas.',
  proximo_numero_proposta integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_config TO authenticated;
GRANT ALL ON public.empresa_config TO service_role;
ALTER TABLE public.empresa_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own config" ON public.empresa_config FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_empresa_config_updated BEFORE UPDATE ON public.empresa_config FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- proposta_templates (2 rows per user)
CREATE TABLE public.proposta_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo proposta_tipo NOT NULL,
  texto_abertura text NOT NULL,
  usa_campo_obra boolean NOT NULL DEFAULT false,
  usa_mobilizacao boolean NOT NULL DEFAULT false,
  valor_mobilizacao_adicional_padrao numeric NOT NULL DEFAULT 100.00,
  texto_responsabilidade_contratante text NOT NULL,
  texto_termos text NOT NULL,
  texto_garantia text NOT NULL,
  validade_dias integer NOT NULL DEFAULT 10,
  despedida text NOT NULL DEFAULT 'Atenciosamente',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tipo)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposta_templates TO authenticated;
GRANT ALL ON public.proposta_templates TO service_role;
ALTER TABLE public.proposta_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON public.proposta_templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON public.proposta_templates FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- tipos_aplicacao
CREATE TABLE public.tipos_aplicacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  custo_padrao_m2 numeric NOT NULL DEFAULT 0,
  proposta_tipo proposta_tipo NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tipos_aplicacao TO authenticated;
GRANT ALL ON public.tipos_aplicacao TO service_role;
ALTER TABLE public.tipos_aplicacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tipos" ON public.tipos_aplicacao FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- clientes
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  contato text,
  telefone text,
  endereco text,
  bairro text,
  municipio_uf text,
  cep text,
  cnpj_cpf text,
  inscricao_estadual text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clientes" ON public.clientes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- orcamentos
CREATE TABLE public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  numero integer NOT NULL,
  proposta_tipo proposta_tipo NOT NULL,
  obra_descricao text,
  mobilizacoes_extras integer NOT NULL DEFAULT 0,
  valor_mobilizacao_adicional numeric NOT NULL DEFAULT 100.00,
  status orcamento_status NOT NULL DEFAULT 'rascunho',
  frete numeric NOT NULL DEFAULT 0,
  mao_obra_diaria numeric NOT NULL DEFAULT 0,
  mao_obra_dias numeric NOT NULL DEFAULT 0,
  alimentacao_diaria numeric NOT NULL DEFAULT 0,
  alimentacao_dias numeric NOT NULL DEFAULT 0,
  hospedagem_diaria numeric NOT NULL DEFAULT 0,
  hospedagem_qtd numeric NOT NULL DEFAULT 0,
  combustivel_equipamento numeric NOT NULL DEFAULT 0,
  combustivel_km_l numeric NOT NULL DEFAULT 0,
  combustivel_r_l numeric NOT NULL DEFAULT 0,
  combustivel_distancia_km numeric NOT NULL DEFAULT 0,
  outras_despesas numeric NOT NULL DEFAULT 0,
  margem numeric NOT NULL DEFAULT 0.70,
  aliquota numeric NOT NULL DEFAULT 0.12,
  condicoes_pagamento_customizadas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own orc" ON public.orcamentos FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_orc_updated BEFORE UPDATE ON public.orcamentos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- orcamento_itens
CREATE TABLE public.orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo_aplicacao_id uuid REFERENCES public.tipos_aplicacao(id) ON DELETE SET NULL,
  descricao text NOT NULL,
  quantidade_m2 numeric NOT NULL DEFAULT 0,
  custo_insumo_m2 numeric NOT NULL DEFAULT 0,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_itens TO authenticated;
GRANT ALL ON public.orcamento_itens TO service_role;
ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own itens" ON public.orcamento_itens FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Bootstrap function: create empresa_config, templates, tipos_aplicacao and default user role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  INSERT INTO public.empresa_config (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;

  INSERT INTO public.proposta_templates (user_id, tipo, texto_abertura, usa_campo_obra, usa_mobilizacao, texto_responsabilidade_contratante, texto_termos, texto_garantia, validade_dias, despedida)
  VALUES (
    NEW.id, 'grama_liquida',
    'Nós da 4G AGROVERDE sempre permaneceremos com assessoria no que diz respeito aos nossos produtos e serviços. Nós já executamos com sucesso diversos projetos de grama líquida dentro dos estados MARANHÃO, PARÁ, PIAUÍ, E TOCANTINS. Caso você não esteja satisfeito com o nosso trabalho (e sinta que você fez a sua parte como combinado) por favor nos ligue imediatamente! O nosso compromisso é trabalhar junto com você para estabelecer um gramado saudável, bonito e verde!',
    false, false,
    E'1. IRRIGAÇÃO\nA coisa mais importante para o sucesso do seu gramado é manter a aplicação úmida por meio da irrigação. Quanto mais se mantiver úmida principalmente nas duas primeiras semanas, mais rápido será o resultado obtido. O mais recomendado é que sejam feitas irrigações com pouca água, porém constantes ao longo do dia, de forma que o mulch se mantenha úmido por mais tempo. Lembrando que a quantidade de água irá variar conforme a temperatura da região, quanto mais quente e seco, maior a quantidade de água necessária para manter a umidade, podendo variar de 5 a 10 litros de água por metro quadrado por dia.\n\nIrrigação 2 primeiras semanas: 4 vezes por dia, nos seguintes horários: 7h 11h 15h 17:30\nIrrigação 3 semana: 3 vezes por dia. Nos seguintes horários: 07h, 12h, 17h\nIrrigação 4 semanas: 2 vezes por dia. Nos seguintes horários: 8h, 17h\nIrrigação 5 semanas: 1 vez por dia. Nos seguintes horários: 8h\nIrrigação Após a 6 semana: 1 vez de 2 em 2 dias.\nIrrigação Após 60 dias: 2 vezes por semana.\n\n- Havendo precipitação suficiente suspenda a irrigação e evite a irrigação agressiva pois ela pode lavar o produto do chão.\n- Não irrigue em excesso pois isso pode afogar as suas sementes.\n- Caso seja identificado que a irrigação não tenha sido feito da maneira adequada, a garantia é perdida.\n\n2. CONTROLE DE PRAGAS\nNão utilize herbicidas químicos (mesmo que sejam seletivos) até que a grama esteja bem enraizada (Após 4 podas geralmente). Todas as sementes utilizadas são testadas e certificadas pela VERDETEC sendo mais de 99% livre de ervas daninhas. De qualquer modo, as ervas daninhas podem já estar presentes em seu solo, ou podem ser trazidas pelo vento ou pássaros. Caso você note a presença de ervas daninhas germinando junto com a sua grama, é necessário que as corte manualmente, até que a grama se estabeleça como espécie dominante (aproximadamente 8 semanas). CASO SEJA UTILIZADO HERBICIDA QUE DANIFIQUE A SUA GRAMA, A GARANTIA É PERDIDA.\n\n3. PODA\nÉ de extrema importância que seja feita a primeira poda quando a sua grama atingir de 7 à 9cm, priorize fazer o corte no horário mais frio do dia. Manter seu gramado podado principalmente no início do estabelecimento, garantirá que o mesmo fique saudável e receba a luminosidade necessária para crescer lateralmente, além de controlar o crescimento de ervas daninhas. A altura de poda pode ser de 3 à 5cm.\n\n4. FERTILIZAÇÃO\nJá incluso na sua aplicação, estão fertilizantes essenciais para um desenvolvimento saudável da grama, eles agirão nas 3 primeiras semanas pós plantio. Para manter um crescimento saudável do seu gramado, após esse tempo será necessário a fertilização novamente. A frequência de fertilização pós estabelecimento do seu gramado estará diretamente ligada à qualidade do solo. Quando for aplicar o fertilizante, não aplique com o gramado molhado. Espere secar para que o nutriente fique na parte superior do solo; após a aplicação, faça uma irrigação leve para que o fertilizante não queime as folhas.\n\n5. TRÁFEGO NA ÁREA DE APLICAÇÃO\nÉ importante que não haja tráfego na área até que você tenha a primeira poda; uma boa ideia pode ser a utilização de faixas que isolem a área. O excesso de tráfego na sua área recém aplicada irá interferir com a germinação das sementes, ou então enterrá-las. A hora mais crítica será quando as sementes estão começando a germinar. A GARANTIA É AUTOMATICAMENTE PERDIDA CASO O CLIENTE PERMITA O ACESSO DE ANIMAIS NA ÁREA PLANTADA.\n\n6. NO DIA DA APLICAÇÃO\n- Fornecer acesso para o equipamento da 4G AGROVERDE às áreas para aplicação.\n- Fornecer sinalização e interdição de pista caso necessário.\n- Ponto para coleta de água por conta da Contratante.\n\n7. LEGISLAÇÃO\nO cliente providenciará as licenças para a execução da obra, tal como outorga da água, respeitando as legislações municipais, estaduais e federais, sendo único responsável pelo eventual descumprimento de quaisquer legislações.',
    'Não oferecemos garantia contra deslizamentos, desastres naturais ou chuvas extremamente fortes que lavem toda a aplicação.',
    'A 4G AGROVERDE oferece garantia de 90 dias para a Grama Líquida, se comprometendo em refazê-la caso não ocorra germinação ou fechamento, e quando forem respeitadas as obrigações do cliente e das especificações técnicas. Os processos de reaplicação, quando necessários, serão efetuados com a média de 90 dias após a aplicação.',
    10, 'Atenciosamente'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.proposta_templates (user_id, tipo, texto_abertura, usa_campo_obra, usa_mobilizacao, texto_responsabilidade_contratante, texto_termos, texto_garantia, validade_dias, despedida)
  VALUES (
    NEW.id, 'mix_sementes',
    'Prezado(a) Sr(a),\n\nAtendendo o seu pedido, estamos enviando nossa proposta para:',
    true, true,
    E'- Fornecer acesso para o equipamento da 4G AGROVERDE às áreas para aplicação.\n- Fornecer sinalização e interdição de pista caso necessário.\n- A área apresentada na proposta é estimada, podendo variar após a execução do serviço.\n- Irrigação por conta da Contratante caso não chova nos dias seguintes à aplicação.\n- Ponto para coleta de água por conta da Contratante.\n- Especificações técnicas dos produtos devem ser respeitadas.',
    E'A 4G AGROVERDE oferece serviços e produtos para recuperação ambiental, contudo, não se responsabiliza por eventuais problemas ou danos ocorridos devido a deslizamentos, quedas de barreiras ou movimentos de solos.\n\nA 4G AGROVERDE não executa irrigação. O CLIENTE, caso não chova nos meses seguintes ao plantio, deve fornecer água ao revestimento vegetal. Caso não seja feita a irrigação corretamente a 4G AGROVERDE não oferece GARANTIA.\n\nO CLIENTE providenciará as licenças para a execução da obra, tal como outorga da água, respeitando as legislações municipais, estaduais e federais, sendo único responsável pelo eventual descumprimento de quaisquer legislações.\n\nO CLIENTE deverá permitir livre acesso ao local da obra, bem como o canteiro adequado e documentos necessários para a prestação do serviço contratado.',
    E'A 4G AGROVERDE oferece garantia de 1 (um) ano para Hidrossemeadura 4G AGROVERDE, se comprometendo em refazê-la caso não ocorra germinação ou fechamento, e quando forem respeitadas as obrigações do cliente e das especificações técnicas. Os processos de reaplicação e adubação, quando necessários, serão efetuados com a média de 90 dias após a aplicação.\n\nA GARANTIA É AUTOMATICAMENTE PERDIDA CASO O CLIENTE PERMITA O ACESSO DE ANIMAIS NA ÁREA PLANTADA.',
    30, 'Cordialmente'
  ) ON CONFLICT DO NOTHING;

  INSERT INTO public.tipos_aplicacao (user_id, nome, custo_padrao_m2, proposta_tipo) VALUES
    (NEW.id, 'VERDEPLAN', 1.50, 'grama_liquida'),
    (NEW.id, 'VERDEFLEX', 1.94, 'grama_liquida'),
    (NEW.id, 'VERDEMAX', 3.26, 'grama_liquida'),
    (NEW.id, 'PLANTIO DE GRAMA', 4.22, 'grama_liquida'),
    (NEW.id, 'HIDROMANTA', 0, 'mix_sementes')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sequential number function per-user
CREATE OR REPLACE FUNCTION public.next_orcamento_numero(p_user_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  UPDATE public.empresa_config SET proximo_numero_proposta = proximo_numero_proposta + 1
  WHERE user_id = p_user_id
  RETURNING proximo_numero_proposta - 1 INTO n;
  IF n IS NULL THEN
    INSERT INTO public.empresa_config(user_id, proximo_numero_proposta) VALUES (p_user_id, 2)
    ON CONFLICT (user_id) DO UPDATE SET proximo_numero_proposta = empresa_config.proximo_numero_proposta + 1
    RETURNING proximo_numero_proposta - 1 INTO n;
  END IF;
  RETURN n;
END; $$;
