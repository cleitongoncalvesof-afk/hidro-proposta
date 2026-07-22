
## 1) Renomear o app para "HIDRO - PROPOSTA"

Substituir todas as ocorrências de "4G AGROVERDE" na interface pelo novo nome, mantendo o design atual (cores, tipografia, layout).

Arquivos afetados:
- `src/components/AppShell.tsx` — nome no cabeçalho
- `src/routes/auth.tsx` — título da tela de login
- `src/routes/__root.tsx` — `<title>`, meta description, og:title/description, twitter
- Textos internos das propostas em PDF (`PropostaPreview.tsx`, `src/lib/pdf.tsx`) continuam usando o nome da empresa cadastrada em `empresa_config` (não mudam) — só o *chrome* do sistema recebe o novo nome.

## 2) Logomarca personalizada por usuário

Cada usuário passa a ter uma logo própria, usada no cabeçalho do sistema, na tela de login (não, aí é logo padrão do app) e principalmente na **proposta em PDF**.

Backend:
- Migração adicionando coluna `logo_url text` em `public.empresa_config`.
- Novo bucket público `empresa-logos` via `supabase--storage_create_bucket` + policies em `storage.objects` permitindo `authenticated` fazer INSERT/UPDATE/DELETE apenas em objetos cujo primeiro segmento do path é o próprio `auth.uid()`.

Frontend:
- Em **Configurações → Empresa**: novo campo "Logomarca" com preview atual, input de upload (aceita PNG/JPG/SVG, máx ~1MB) e botão "Remover". Upload envia para `empresa-logos/{user_id}/logo.{ext}`, grava a URL pública em `empresa_config.logo_url`.
- `AppShell.tsx`: se `empresa_config.logo_url` do usuário logado existir, mostra ela no header (fallback: logo padrão atual).
- `PropostaPreview.tsx` e `src/lib/pdf.tsx`: passar `empresa.logo_url` e renderizar no cabeçalho da proposta em vez do `logo.svg` fixo, com fallback para a logo padrão quando ausente.
- Novo hook simples de leitura de `empresa_config` (ou reutilizar a query existente) para a AppShell.

O restante da edição da proposta (textos, templates, tipos, valores) continua funcionando exatamente como hoje.

## 3) Página de vendas pública em `/`

Hoje `/` está sob `_authenticated` e redireciona para `/auth`. Vamos mover a home para uma rota pública e deixar o dashboard como destino pós-login.

Mudanças de roteamento:
- Remover `src/routes/_authenticated/index.tsx` (o redirect atual `/ → /dashboard`).
- Criar `src/routes/index.tsx` **público** com a landing.
- Após login em `auth.tsx`, redirecionar para `/dashboard` (já é o comportamento; garantir que sim).
- Botão "Entrar" no header da landing → `/auth`.

Conteúdo da landing (mobile-first, mesma identidade visual — verde/creme, Space Grotesk/Inter):

1. **Header**: logo "HIDRO - PROPOSTA" à esquerda, botão "Entrar" à direita → `/auth`.
2. **Hero**: título "Orçamento pronto em minutos, direto do celular". Subtítulo explicando: cadastra cliente, cálculo automático via tabela de custo de insumos, PDF pronto pra WhatsApp. CTA principal "Falar no WhatsApp".
3. **Como funciona** — 4 passos com ícones (lucide): Cadastre o cliente · Lance os itens · O preço calcula sozinho · Envie o PDF pelo WhatsApp.
4. **Para quem é** — texto focado em quem faz **hidrossemeadura** e hoje usa a **planilha de custo da VERDETEC**; o sistema já vem com essa estrutura pronta.
5. **Prova social** — bloco em destaque com placeholder editável ("de X minutos para 3 minutos por orçamento") e espaço reservado para depoimento futuro (comentário no código indicando onde editar).
6. **Plano/Preço** — card único: valor mensal como **constante no topo do arquivo** (`const PRECO_MENSAL = "R$ 98,90/mês"`) fácil de editar. Lista de inclusos: clientes ilimitados, cálculo automático, geração de PDF, envio por WhatsApp, suporte. CTA "Quero contratar" → WhatsApp.
7. **Rodapé** — nome da empresa, contato (WhatsApp), aviso "Acesso liberado manualmente após a contratação. Não há cadastro automático.".

CTAs de conversão (Hero + Plano + Rodapé) todos apontam para:
```
https://wa.me/5599992051019?text=Ol%C3%A1%2C%20quero%20contratar%20o%20HIDRO%20-%20PROPOSTA
```
(número interpretado como `+55 99 99205-1019`; deixo o número numa constante no topo do arquivo — se estiver errado, é 1 edição só. Confirmo com você depois.)

Nenhum CTA leva para formulário de cadastro. A tela `/auth` permanece só com login (já está assim).

SEO (`head()` do `src/routes/index.tsx`):
- title: "HIDRO - PROPOSTA — Orçamentos de hidrossemeadura em minutos"
- description específica focada em conversão + og/twitter equivalentes.

## Fora de escopo

- Nenhuma mudança em lógica de cálculo, fluxo de login, gate de bloqueio, painel Admin Master, edição de proposta ou envio por WhatsApp existentes.
- Sem alteração em `auth.tsx` além do nome no título.

## Detalhes técnicos

- Migração única: `ALTER TABLE public.empresa_config ADD COLUMN logo_url text;` (sem GRANT novo — tabela já concedida).
- Bucket `empresa-logos` público (leitura anônima liberada; escrita restrita ao dono via policy por prefixo de path).
- Upload usa `supabase.storage.from('empresa-logos').upload(\`${uid}/logo-${Date.now()}.${ext}\`, file, { upsert: true })`.
- Landing é uma página estática pura, sem chamadas ao Supabase — carrega rápido e não depende de sessão.
