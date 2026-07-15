# Plano — 2 ajustes pontuais

Escopo estrito: apenas os 2 itens abaixo. Nada mais é tocado.

## 1) Combustível do equipamento calculado por m²

**Backend (migration)**
- A tabela `tipos_aplicacao` já possui `litros_por_tanque`, `preco_por_litro`, `rendimento_medio_m2` (com valores iniciais idênticos aos pedidos). Nenhuma alteração de schema necessária.
- Adicionar colunas em `orcamentos`:
  - `combustivel_modo` text default `'manual'` check in (`'manual'`,`'auto_m2'`)

**Tela Configurações**
- Nova seção "Referência de combustível por tipo de aplicação": lista editável de `tipos_aplicacao` (nome, litros_por_tanque, preço/L, rendimento m²), com salvar por linha. Não altera o restante da tela.

**Wizard / Custos Operacionais (novo.tsx e orcamentos.$id.tsx)**
- Adicionar Toggle "Calcular por m²" × "Valor manual" acima do campo atual.
- Modo `manual`: comportamento atual intacto (input livre em `combustivel_equipamento`).
- Modo `auto_m2`:
  - Para cada item do orçamento, buscar o `tipo_aplicacao_id` do item → obter `(litros × preço) / rendimento = custo/m²`.
  - `total = Σ (custo/m² do tipo × m² do item)`.
  - Mostrar detalhamento por tipo (linha com: tipo, m², custo/m², subtotal) e total.
  - Persistir o total calculado em `combustivel_equipamento` no save, para não mudar `calcular()` em `src/lib/calc.ts` nem a fórmula do custo total.
- `combustivel_modo` persistido em `orcamentos`.

## 2) Envio do PDF pelo WhatsApp

**Storage**
- Bucket `propostas-pdf` já existe (privado). Criar policies mínimas para leitura via signed URL e escrita pelo dono (migration).

**Fluxo de envio (orcamentos.$id.tsx)**
- Ao clicar em WhatsApp:
  1. Gerar Blob do PDF via `gerarPropostaPDF` (já existe).
  2. Upload para `propostas-pdf/{user_id}/{numero}-{timestamp}.pdf` via `supabase.storage`.
  3. Criar signed URL (validade 30 dias).
  4. Tentar `navigator.canShare({ files: [File] })` + `navigator.share({ files, text })` → anexa o PDF direto (Android Chrome, iOS Safari recentes).
  5. Fallback: abrir `https://wa.me/55<tel>?text=<mensagem + link signed URL>`.
- Persistir última `pdf_url` em `orcamentos.pdf_url` (nova coluna text nullable) para reuso.
- Loading state no botão durante upload.

**Verificação**
- Testar via Playwright headless: fluxo desktop cai no fallback wa.me com link — validar que a URL contém o signed link e abre o PDF.
- Mobile real (Android/iOS) o usuário testa após deploy — documentar no toast que anexo direto depende do navegador.

## Arquivos afetados
- `supabase/migrations/*` (novas colunas + policies storage)
- `src/routes/_authenticated/configuracoes.tsx` (seção referência combustível)
- `src/routes/_authenticated/novo.tsx` (toggle + cálculo auto)
- `src/routes/_authenticated/orcamentos.$id.tsx` (toggle + envio WhatsApp com PDF)
- `src/lib/pdf.tsx` (exportar helper de upload, opcional)

Nada mais é modificado.
