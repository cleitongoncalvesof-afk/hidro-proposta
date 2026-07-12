# Plano — App 4G AGROVERDE (Orçamento + Proposta)

Web app mobile-first (React + Tailwind + Lovable Cloud/Supabase) que substitui a planilha de custos e os modelos manuais por um fluxo único: escolher tipo de proposta → preencher → calcular → gerar PDF → enviar por WhatsApp.

## Antes de começar — 2 confirmações rápidas

1. **Logo**: usarei o `SVG_SEM_FUNDO.svg` como logo padrão da empresa (dentro do PDF e no cabeçalho do app), e o `SVG_COM_FUNDO.svg` como versão alternativa. OK?
2. **Autenticação**: vou habilitar login por e-mail/senha (Lovable Cloud). Sem login social e sem confirmação por e-mail (para você já entrar direto após criar a conta). OK?

Se estiver tudo certo, aprove o plano e eu começo pela etapa 1.

## Etapas de construção

### 1. Backend (Lovable Cloud)
- Habilitar Cloud.
- Migrações com as tabelas: `empresa_config`, `proposta_templates` (2 linhas: `grama_liquida`, `mix_sementes`), `tipos_aplicacao`, `clientes`, `orcamentos`, `orcamento_itens`, `user_roles` + enum `app_role`, função `has_role`.
- RLS: cada tabela filtrada por `user_id = auth.uid()`; templates/tipos/config editáveis pelo dono.
- Seed dos 2 templates com os textos exatos dos PDFs (abertura, responsabilidades, termos, garantia, validade, despedida) e dos tipos: VERDEPLAN 1,50 / VERDEFLEX 1,94 / VERDEMAX 3,26 / PLANTIO DE GRAMA 4,22 (grama_liquida) e HIDROMANTA (mix_sementes).
- Bucket privado `empresa-logos` para logo customizada.
- Trigger para auto-criar `empresa_config` no primeiro login.

### 2. Design system
- Tokens em `src/styles.css` (oklch) com a paleta: verde floresta `#1F3D2B`, musgo `#8FA382`, ocre `#C98B2E`, marrom-solo `#6B4A2F`, creme `#F7F5EF`, texto `#20241F`.
- Fontes via `<link>` no `__root.tsx`: Space Grotesk (títulos), Inter (corpo), IBM Plex Mono (valores).
- Container mobile-first, máx. 480px, responsivo.

### 3. Auth + shell
- Rota pública `/auth` (login/cadastro).
- Layout autenticado `_authenticated/` com bottom-nav (Início / Novo / Configurações).
- Logo no header.

### 4. Dashboard (`/`)
- CTA grande "Novo orçamento".
- Cards de KPI: orçamentos no mês, taxa de aprovação, ticket médio.
- Lista dos últimos orçamentos com filtros (cliente, status, tipo).

### 5. Wizard "Novo orçamento" (`/novo`)
Etapas com barra de progresso, autosave de rascunho:
- **a. Tipo de proposta** — 2 cards grandes.
- **b. Cliente** — buscar/cadastrar; campo "Obra" só se `mix_sementes`.
- **c. Itens** — múltiplas linhas, tipos filtrados pelo tipo de proposta, m² e custo/m² editáveis.
- **d. Custos operacionais** — frete, mão de obra (diária × dias), alimentação, hospedagem, combustível equipamento, combustível veículo (km/L, R$/L, distância), outras despesas; se `mix_sementes`: mobilizações extras + valor.
- **e. Preço** — sliders de margem e alíquota, painel ao vivo com todos os cálculos da planilha.
- **f. Revisão** — preview fiel do PDF do tipo escolhido; botões Salvar / Gerar PDF / WhatsApp.

### 6. Detalhe do orçamento (`/orcamentos/$id`)
Reabrir, editar, mudar status, regenerar PDF, duplicar (mantém custos, troca cliente).

### 7. Configurações (`/configuracoes`)
- Dados da empresa + upload de logo.
- Editor dos 2 templates (todos os textos, validade, despedida).
- CRUD de tipos de aplicação (vinculados ao tipo de proposta).
- Margem e alíquota padrão.

### 8. Geração de PDF + WhatsApp
- `@react-pdf/renderer` com 2 templates fiéis aos PDFs anexados (cabeçalho com dados da empresa/página/data/hora, abertura, cliente, tabela de itens, total em destaque, condição de pagamento, mobilização só mix, responsabilidades, termos, garantia, validade, assinatura).
- Upload do PDF em bucket `propostas` → URL assinada.
- Botão WhatsApp abre `https://wa.me/?text=...` com mensagem pré-formatada + link do PDF.

## Detalhes técnicos

**Cálculo (recalcula em tempo real, exatamente como a planilha):**
```
custo_insumo_total = Σ(qtd_m2 × custo_insumo_m2)
total_m2           = Σ qtd_m2
mao_obra_total     = diaria × dias
alimentacao_total  = diaria × dias
hospedagem_total   = diaria × qtd
comb_veiculo_total = (distancia_km ÷ km_l) × r_l
mob_extra_total    = mobilizacoes_extras × valor_mob   (só mix_sementes)
custo_total        = soma de tudo acima + frete + comb_equipamento + outras
custo_m2           = custo_total ÷ total_m2
valor_m2           = custo_m2 × (1 + margem)
faturamento_bruto  = valor_m2 × total_m2
imposto            = faturamento_bruto × aliquota
lucro_real         = (faturamento_bruto − custo_total) − imposto
```

**Stack:** React 19 + TanStack Start + Tailwind v4 + Lovable Cloud (Supabase) + `@react-pdf/renderer` + `zod` + `react-hook-form`.

**Rotas:** `/auth` (pública); sob `_authenticated/`: `/` dashboard, `/novo`, `/orcamentos/$id`, `/clientes`, `/configuracoes`.

**Segurança:** RLS em todas as tabelas por `user_id`; `user_roles` separado; buckets privados com URLs assinadas.

**Textos dos templates:** extraídos verbatim dos 2 PDFs anexados no seed inicial — depois editáveis em Configurações.
