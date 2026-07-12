## Plano — 6 ajustes no app 4G AGROVERDE

### 1. Combustível do equipamento por m² (auto)
- **Migração**: adicionar em `tipos_aplicacao` os campos `litros_por_tanque numeric`, `preco_por_litro numeric`, `rendimento_medio_m2 numeric`. Seed dos valores nos tipos existentes (VERDEPLAN/VERDEFLEX/VERDEMAX/PLANTIO DE GRAMA = 6,5 / 7,00 / 250; HIDROMANTA área plana = 6,5 / 6,50 / 625). Criar também tipos "Talude até 45°" e "Talude acima de 45°" se o usuário quiser (confirmar depois — por ora, valores editáveis via tela do item 6).
- **Migração `orcamentos`**: adicionar `combustivel_equipamento_modo text default 'manual'` (`'manual' | 'auto_m2'`).
- **Wizard "Custos Operacionais"** (`novo.tsx`): toggle "Calcular por m² × tipo" vs "Valor manual". No modo auto, mostrar tabela detalhada por item do orçamento: `custo/m² do tipo × m² do item = subtotal`, com total ao final. O campo manual fica desabilitado.
- **`calc.ts`**: quando modo=auto, `combustivel_equipamento` = Σ (por item) `(litros_por_tanque × preco_por_litro / rendimento_medio_m2) × quantidade_m2`. Passar os tipos de aplicação como referência para o cálculo.

### 2. PWA instalável
Escopo: **manifest-only** (instalação + ícone), sem service worker offline (o app depende de Supabase online — cache offline traz mais bugs que valor, e a skill PWA orienta usar SW só quando o usuário pede offline explicitamente).
- `public/manifest.webmanifest` com nome "4G AGROVERDE Propostas", `theme_color:#1F3D2B`, `background_color:#F7F5EF`, `display:"standalone"`, `start_url:"/"`, ícones 192 e 512.
- Gerar ícones PNG (logo em quadrado verde #1F3D2B) em `public/icon-192.png` e `public/icon-512.png` + `apple-touch-icon.png` 180×180.
- Tags no `__root.tsx` head: `manifest`, `theme-color`, `apple-touch-icon`, `apple-mobile-web-app-capable`.

### 3. Logo com fundo escuro
Wrapper com `bg-[#1F3D2B]` (verde-floresta) e padding em toda ocorrência do `<img src={logo}>`:
- `AppShell.tsx` (topbar)
- `auth.tsx` (tela de login) — também corrige o hydration mismatch atual dessa rota
- `dashboard.tsx` se houver
- `PropostaPreview.tsx` (cabeçalho do preview)

### 4. Logo no PDF
Em `lib/pdf.tsx`, adicionar `<Image>` do `@react-pdf/renderer` no header, dentro de uma `View` com `backgroundColor:"#1F3D2B"` e padding, à esquerda dos dados da empresa. Usar PNG (react-pdf não renderiza SVG de forma confiável) — reaproveitar o `icon-192.png` gerado no item 2, importado como asset.

### 5. WhatsApp com PDF
- **Storage**: criar bucket público `propostas-pdf` via tool. RLS em `storage.objects` permitindo insert/select apenas ao owner (`auth.uid()`) do path `{user_id}/...`; select público para leitura via URL.
- **Fluxo no botão**: 
  1. Gerar Blob do PDF (já existe `gerarPropostaPDF`).
  2. Upload para `propostas-pdf/{user_id}/proposta-{numero}-{timestamp}.pdf`, salvar `pdf_url` em `orcamentos`.
  3. Se `navigator.canShare({files:[file]})` → `navigator.share({title, text, files:[file]})`.
  4. Fallback: `window.open("https://wa.me/?text=" + encodeURIComponent(mensagem + "\n\n" + pdfUrl))`.
- **Migração `orcamentos`**: adicionar `pdf_url text`.

### 6. CRUD Tipos de aplicação em Configurações
- Nova aba/seção em `configuracoes.tsx` "Tipos de aplicação / insumos".
- Lista mobile-first: cada tipo em card com nome, descrição, custo/m², e (se item 1 aprovado) os 3 campos de combustível. Edição inline com inputs + botão "Salvar"; botões "Adicionar" e "Remover" (com confirm).
- CRUD direto contra `tipos_aplicacao` via cliente Supabase autenticado (RLS já existente por `user_id`).

### Ordem de execução
1. Migração única (campos de combustível em `tipos_aplicacao`, `combustivel_equipamento_modo` + `pdf_url` em `orcamentos`).
2. Criar bucket Storage + policies.
3. Gerar ícones PNG (logo em fundo verde).
4. Frontend: PWA manifest → wrapper de logo → CRUD tipos → toggle combustível + cálculo → PDF com logo → WhatsApp com upload+share.
5. Testar via Playwright: instalação PWA (manifest válido), preview do PDF, fluxo de WhatsApp em viewport mobile.

### Fora de escopo (confirmar se quiser)
- Cadastro automático dos tipos "Talude até 45°" e "Talude acima de 45°": posso semear na migração, ou deixar o usuário adicionar pela nova tela do item 6. **Assumo: semear na migração** para já refletir a tabela do enunciado.
- Service worker offline real: não incluído (ver item 2).
