# Agro Proposals

Prompt único para o Lovable — App de Orçamento e Proposta (4G AGROVERDE)

Como usar

Cole o texto do bloco "PROMPT" abaixo de uma vez só no chat do Lovable.

Anexe junto os dois PDFs que você já tem prontos:

Nova_Proposta___Grama_Liquida__4G_AGROVERDE.pdf

Nova_Proposta___Mix_de_Sementes__Hidromanta___4G_AGROVERDE.pdf

Eles servem de base/modelo real — o Lovable deve reproduzir o layout, os textos fixos e a estrutura de cada um exatamente como estão nesses arquivos (o prompt abaixo já resume as diferenças entre os dois, mas os PDFs são a fonte da verdade para qualquer detalhe de redação, ordem das seções ou formatação que não esteja 100% descrito aqui).

PROMPT (colar tudo de uma vez, com os 2 PDFs em anexo)

Crie um aplicativo web mobile-first (funciona como app no celular, mas é uma web
app) para a empresa 4G AGROVERDE, prestadora de serviços de recuperação vegetal
por hidrossemeadura (grama líquida, mix de sementes / hidromanta).

Estou anexando dois PDFs de propostas comerciais reais que já uso hoje — use-os
como modelo/base exata de layout e texto: um é do tipo "Grama Líquida" e o
outro é do tipo "Mix de Sementes / Hidromanta". São dois formatos de proposta
diferentes que o app precisa gerar, dependendo do tipo de serviço escolhido.

OBJETIVO
Substituir uma planilha Excel de cálculo de custo + modelos manuais de proposta
comercial por um único fluxo no celular: o usuário escolhe o tipo de proposta,
preenche os dados do job, o app calcula custo, preço e margem automaticamente,
e gera a proposta comercial correta (no formato certo) pronta para enviar ao
cliente (PDF e link para WhatsApp).

STACK
- Frontend: React + Tailwind, layout mobile-first (máx. 480px de largura útil,
  responsivo até desktop).
- Backend: Supabase (auth por e-mail/senha, banco de dados, storage para logo
  da empresa).
- Geração de PDF da proposta a partir dos dados salvos, com download e
  compartilhamento.

IDENTIDADE VISUAL
- Paleta: verde floresta #1F3D2B (primária), verde-musgo #8FA382 (secundária),
  ocre #C98B2E (destaque/CTA), marrom-solo #6B4A2F, fundo creme #F7F5EF, texto
  quase-preto #20241F.
- Tipografia: títulos em fonte grotesk moderna (ex: Space Grotesk), corpo em
  Inter, valores monetários em fonte monoespaçada (ex: IBM Plex Mono).
- Tom: direto, rural-profissional, sem jargão técnico de sistema.

AUTENTICAÇÃO
- Login simples por e-mail/senha (Supabase Auth). Um único usuário/empresa por
  enquanto, mas com campo user_id em todas as tabelas para permitir múltiplos
  usuários no futuro.

DOIS TIPOS DE PROPOSTA (ponto central do app)

O app precisa suportar dois modelos de proposta distintos, escolhidos logo no
início do fluxo de "Novo orçamento":

1. **GRAMA LÍQUIDA**
   - Abertura: parágrafo institucional (mencionando atuação em MA, PA, PI e
     TO e o compromisso de assessoria pós-venda) — sem campo "OBRA".
   - Item padrão: "GRAMA LÍQUIDA", unidade M².
   - Sem seção de mobilização.
   - Responsabilidade da contratante: lista longa e detalhada (irrigação,
     controle de pragas, poda, fertilização, tráfego na área, legislação).
   - Validade da proposta: 10 dias.
   - Garantia: 90 dias, com termo de garantia extenso — reproduzir as seções
     de Irrigação (com o cronograma de horários por semana), Controle de
     Pragas, Poda, Fertilização, Tráfego na Área de Aplicação, No Dia da
     Aplicação e Legislação, exatamente como no PDF de referência anexado.
   - Despedida: "Atenciosamente".

2. **MIX DE SEMENTES / HIDROMANTA**
   - Abertura: "Prezado(a) Sr(a) | E-mail:" + campo **OBRA** (texto livre
     descrevendo o serviço, ex: "Serviço de recuperação Vegetal por
     hidrossemeadura HIDROMANTA para taludes em [local]").
   - Item padrão: "4G AGROVERDE - HIDROMANTA" (mas o nome do produto deve ser
     editável, pois pode ser outro mix de sementes), unidade M².
   - Seção "DESCRITIVO DO ORÇAMENTO" com sub-seção **MOBILIZAÇÃO**: a proposta
     considera 1 mobilização incluída; se houver mobilização adicional, cobrar
     um valor extra configurável (campo editável, valor de referência R$
     100,00 por mobilização adicional — deixar como default editável, não
     fixo no código).
   - Responsabilidade da contratante: lista mais curta (acesso ao
     equipamento, sinalização, aviso de que a área é estimada e pode variar,
     irrigação por conta do contratante caso não chova, ponto de coleta de
     água, respeito às especificações técnicas).
   - Termos: texto mais enxuto, deixando claro que a 4G AGROVERDE não se
     responsabiliza por deslizamentos, quedas de barreira ou movimentos de
     solo, e que não executa irrigação.
   - Validade da proposta: 30 dias.
   - Garantia: 1 (um) ano para a hidrossemeadura, com reaplicação e adubação
     quando necessárias em média 90 dias após a aplicação; garantia perdida
     automaticamente se houver acesso de animais à área plantada.
   - Despedida: "Cordialmente".

Textos institucionais fixos comuns aos dois tipos (condições de pagamento,
dados bancários, cláusulas de cobrança/protesto/SERASA/SPC, multa de atraso)
devem ficar armazenados como texto editável em configurações, não codificados
como texto estático — mas o conteúdo inicial deve ser exatamente o dos PDFs
anexados.

MODELO DE DADOS (Supabase)

tabela `empresa_config` (uma linha, editável na tela de Configurações):
- razao_social, nome_fantasia, endereco, cnpj, telefone, email, site,
  dados_bancarios, responsavel, logo_url
- margem_padrao (decimal, ex: 0.70 = 70% de mark-up)
- aliquota_padrao (decimal, ex: 0.12 = 12%)
- texto_condicoes_pagamento_padrao (comum aos dois tipos)
- texto_clausulas_cobranca (comum aos dois tipos — protesto, SERASA, multa)

tabela `proposta_templates` (uma linha por tipo de proposta, editável em
Configurações):
- tipo ('grama_liquida' | 'mix_sementes')
- texto_abertura (parágrafo institucional OU "Prezado(a) Sr(a)...")
- usa_campo_obra (boolean — true só para mix_sementes)
- usa_mobilizacao (boolean — true só para mix_sementes)
- valor_mobilizacao_adicional_padrao (decimal, default 100.00, só relevante
  se usa_mobilizacao)
- texto_responsabilidade_contratante
- texto_termos
- texto_garantia
- validade_dias (10 para grama_liquida, 30 para mix_sementes)
- despedida ("Atenciosamente" ou "Cordialmente")

tabela `tipos_aplicacao` (tabela de referência, com CRUD em Configurações;
vinculada a um `proposta_tipo` para saber em qual fluxo aparece):
- nome, descricao, custo_padrao_m2, proposta_tipo ('grama_liquida' |
  'mix_sementes')
- popular já com: VERDEPLAN (1.50, grama_liquida), VERDEFLEX (1.94,
  grama_liquida), VERDEMAX (3.26, grama_liquida), PLANTIO DE GRAMA (4.22,
  grama_liquida), HIDROMANTA (valor manual, mix_sementes)

tabela `clientes`:
- nome, contato/telefone, endereco, bairro, municipio_uf, cep, cnpj_cpf,
  inscricao_estadual

tabela `orcamentos`:
- cliente_id (FK), numero (sequencial), proposta_tipo ('grama_liquida' |
  'mix_sementes')
- obra_descricao (texto, só usado se proposta_tipo = mix_sementes)
- mobilizacoes_extras (inteiro, default 0), valor_mobilizacao_adicional
  (decimal, herda do template mas editável no orçamento)
- status (rascunho / enviado / aprovado / recusado)
- frete, mao_obra_diaria, mao_obra_dias, alimentacao_diaria, alimentacao_dias,
  hospedagem_diaria, hospedagem_qtd, combustivel_equipamento,
  combustivel_km_l, combustivel_r_l, combustivel_distancia_km,
  outras_despesas
- margem (decimal), aliquota (decimal)
- condicoes_pagamento_customizadas (texto, opcional)
- criado_em

tabela `orcamento_itens` (uma ou mais áreas/produtos por orçamento):
- orcamento_id (FK), tipo_aplicacao_id (FK, opcional se valor manual)
- descricao, quantidade_m2, custo_insumo_m2

LÓGICA DE CÁLCULO (igual para os dois tipos de proposta — vem da planilha de
custos atual)

1. custo_insumo_total = soma, por item, de (quantidade_m2 × custo_insumo_m2)
2. total_m2 = soma de quantidade_m2 de todos os itens
3. mao_de_obra_total = mao_obra_diaria × mao_obra_dias
4. alimentacao_total = alimentacao_diaria × alimentacao_dias
5. hospedagem_total = hospedagem_diaria × hospedagem_qtd
6. combustivel_veiculo_total = (combustivel_distancia_km ÷ combustivel_km_l) × combustivel_r_l
7. mobilizacao_extra_total = mobilizacoes_extras × valor_mobilizacao_adicional
   (só quando proposta_tipo = mix_sementes)
8. custo_total = custo_insumo_total + frete + mao_de_obra_total + alimentacao_total
   + hospedagem_total + combustivel_equipamento + combustivel_veiculo_total
   + outras_despesas + mobilizacao_extra_total
9. custo_por_m2 = custo_total ÷ total_m2
10. valor_por_m2 = custo_por_m2 × (1 + margem)   // margem = mark-up, ex: 0.70 = +70%
11. faturamento_bruto = valor_por_m2 × total_m2
12. lucro_bruto = faturamento_bruto − custo_total
13. imposto = faturamento_bruto × aliquota
14. lucro_real = lucro_bruto − imposto

Todos os valores recalculam em tempo real conforme o usuário digita.

TELAS

1. Login

2. Início / Dashboard
   - Botão grande "Novo orçamento"
   - Lista dos últimos orçamentos (cliente, tipo de proposta, m², valor
     total, status, data)
   - Buscar/filtrar por cliente, status ou tipo de proposta
   - Painel simples com: total de orçamentos enviados no mês, taxa de
     aprovação (aprovados ÷ enviados) e ticket médio

3. Novo orçamento — fluxo em etapas (wizard), com barra de progresso:
   a) **Tipo de proposta** — primeira pergunta do fluxo: "Grama Líquida" ou
      "Mix de Sementes / Hidromanta" (cards grandes com ícone, não dropdown).
      Essa escolha determina o restante do fluxo.
   b) Dados do cliente (buscar cliente existente ou cadastrar novo) — e, se
      for mix_sementes, campo adicional "Descrição da obra"
   c) Áreas/produtos de aplicação — permitir várias linhas (tipo de aplicação
      filtrado pelo proposta_tipo escolhido, m², custo/m² pré-preenchido mas
      editável)
   d) Custos operacionais — frete, mão de obra, alimentação, hospedagem,
      combustível do equipamento, combustível do veículo (km/L, R$/L,
      distância), outras despesas, e — só se mix_sementes — número de
      mobilizações extras e valor por mobilização adicional
   e) Preço — sliders/inputs para mark-up e alíquota de imposto, com painel
      de resultado ao vivo: custo total, custo/m², preço/m², faturamento
      bruto, imposto, lucro real
   f) Revisão da proposta — preview fiel ao layout do PDF correspondente ao
      tipo escolhido (grama_liquida ou mix_sementes), com botões: "Salvar",
      "Gerar PDF", "Enviar por WhatsApp"
   - Autosave de rascunho a cada etapa

4. Detalhe de um orçamento salvo
   - Reabrir, editar, mudar status, gerar PDF novamente
   - Botão "Duplicar" que cria uma nova proposta com os mesmos dados de
     custo e o mesmo tipo de proposta, permitindo trocar apenas o cliente

5. Configurações
   - Dados da empresa
   - Os dois templates de proposta (grama_liquida e mix_sementes), cada um
     com seus textos editáveis (abertura, responsabilidades, termos,
     garantia, validade, despedida)
   - Tabela de tipos de aplicação (CRUD), vinculada ao tipo de proposta
   - Margem e alíquota padrão

GERAÇÃO DE PDF
A partir da tela de revisão, gerar um PDF fiel ao layout do tipo de proposta
escolhido (replicar a estrutura dos dois PDFs anexados): cabeçalho com dados
da empresa (razão social, endereço, CNPJ, telefone, e-mail, site, número da
página, data, hora), texto de abertura específico do tipo, dados do cliente,
tabela de itens (item, descrição, unidade M2, quantidade, valor unitário,
total), valor total geral em destaque, condição de pagamento, seção de
descritivo/mobilização (só mix_sementes), responsabilidades da contratante,
termos, termo de garantia, validade da proposta, e bloco de assinatura com
nome do responsável e do cliente. Deve poder ser baixado ou compartilhado
direto do celular.

COMPARTILHAR VIA WHATSAPP
Botão "Enviar por WhatsApp" na tela de revisão que abre o WhatsApp Web/App com
mensagem pré-formatada (nome do cliente, tipo de serviço, valor total) e link
para o PDF gerado.

REQUISITOS DE UX
- 100% utilizável com o polegar, em pé, no campo — botões grandes, poucos
  campos por tela, teclado numérico automático em campos de valor.
- Erros e estados vazios devem orientar a próxima ação, não só avisar que
  algo está em branco.

Construa tudo isso agora, começando pela estrutura de dados no Supabase
(incluindo os dois templates de proposta), depois o dashboard e o fluxo de
novo orçamento completo (etapas a-f) para os dois tipos, e por fim
Configurações e a tela de Detalhe do orçamento.


Se o Lovable travar ou cortar por complexidade

Ele pode gerar em mais de uma resposta internamente, mas você só usa um prompt/crédito. Se ele avisar que vai fazer por partes, apenas confirme ("continue") — normalmente isso não consome um novo prompt do seu limite diário, só continua a mesma execução.

Se depois de rodar você notar algo faltando ou errado, corrija com um prompt curto e específico (ex: "no tipo mix de sementes, o campo OBRA não está aparecendo no PDF final") em vez de reenviar a especificação inteira — isso também economiza créditos.

De onde vieram esses números e textos (para sua referência)

Fórmulas extraídas da sua planilha atual (Planilha_Custos_-_Aplicacao_VTEC-500.xlsx):

Custo/m² = Custo total ÷ Qtd m² → no seu exemplo, R$ 14.130,77 ÷ 1.600 m² = R$ 8,83/m²

Preço/m² = Custo/m² × (1 + margem) → 8,83 × 1,70 = R$ 15,01/m²

Faturamento bruto = Preço/m² × Qtd m² → R$ 24.022,31

Imposto = Faturamento bruto × alíquota → R$ 24.022,31 × 12% = R$ 2.882,68

Lucro real = (Faturamento bruto − Custo total) − Imposto → R$ 7.008,86

Estrutura e textos dos dois tipos de proposta vieram dos PDFs reais:

Nova_Proposta___Grama_Liquida__4G_AGROVERDE.pdf (Proposta 050, cliente Raymacson Leal — 200 m², R$ 14,00/m², validade 10 dias, garantia 90 dias)

Nova_Proposta___Mix_de_Sementes__Hidromanta___4G_AGROVERDE.pdf (Proposta 0001, cliente João Silva — 5.000 m² de HIDROMANTA, R$ 10,00/m², validade 30 dias, garantia 1 ano, com seção de mobilização)

OBS: EM ANEXO ESTÁ OS DOCUMENTOS DE REFERENCIA

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hidro-proposta.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6eb60a41-20ee-4f29-b8e2-329946bb06e3).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
