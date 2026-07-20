## Ajuste 1 — Corrigir React error #310 na tela de orçamento

**Causa confirmada** (arquivo `src/routes/_authenticated/orcamentos.$id.tsx`): o hook `useState(sharing)` está declarado na linha 143, **depois** dos `return` condicionais das linhas 100-101 (`if (q.isLoading …) return …` e `if (!q.data …) return …`). Em cada re-render a quantidade de hooks executados muda → erro #310.

**Correção**: mover `const [sharing, setSharing] = useState(false)` para o topo do componente, junto dos demais hooks, antes de qualquer `return`. A função `enviarWhatsapp` continua definida abaixo (não é hook). Nenhuma outra mudança de comportamento.

Teste: criar orçamento novo, salvar, sair, reabrir pela lista, para os dois tipos (Grama Líquida e Mix de Sementes).

---

## Ajuste 2 — Cadastro fechado (só admin cria contas)

### Banco (migration única)

1. Tabela `public.usuarios_perfil`:
   - `user_id uuid PK REFERENCES auth.users ON DELETE CASCADE`
   - `nome text`, `email text`, `role text CHECK IN ('admin','usuario') DEFAULT 'usuario'`
   - `status text CHECK IN ('ativo','bloqueado') DEFAULT 'ativo'`
   - `criado_em timestamptz DEFAULT now()`
   - GRANTs padrão (`authenticated` SELECT/INSERT/UPDATE/DELETE; `service_role` ALL). Sem `anon`.
   - RLS ON.
2. Funções `SECURITY DEFINER`:
   - `public.is_admin(uid uuid) → bool` (lê `usuarios_perfil.role`).
   - `public.is_ativo(uid uuid) → bool` (lê status).
3. Policies em `usuarios_perfil`:
   - SELECT: `auth.uid() = user_id OR is_admin(auth.uid())`.
   - INSERT/UPDATE/DELETE: apenas `is_admin(auth.uid())`.
4. **Bloquear usuários inativos em todas as tabelas de dados** (`clientes`, `orcamentos`, `orcamento_itens`, `empresa_config`, `proposta_templates`, `tipos_aplicacao`): substituir cada policy existente por uma nova que combina `auth.uid() = user_id AND public.is_ativo(auth.uid())`. Mantém o mesmo escopo por dono, apenas negando quando `status='bloqueado'`.
5. Atualizar `handle_new_user()` para também inserir em `usuarios_perfil` (role=`usuario`, status=`ativo`, email/nome do metadata).
6. Backfill: inserir/atualizar linha para `eduardogonc6186@gmail.com` como `role='admin'`, `status='ativo'` (via `auth.users` lookup por email; se o usuário ainda não existe, ele será marcado admin na primeira criação via passo seguinte). Também backfill de todos os usuários existentes em `auth.users` que não tenham linha em `usuarios_perfil`.

### Server function para criar/gerenciar usuários (admin)

Novo arquivo `src/lib/admin-users.functions.ts` com `createServerFn` + `requireSupabaseAuth`. Cada handler:
1. Verifica via `context.supabase` que o caller tem `role='admin'` em `usuarios_perfil` (RLS aplica; se não for admin, a leitura retorna vazio → 403).
2. Só então carrega `supabaseAdmin` via `await import('@/integrations/supabase/client.server')`.

Funções:
- `listarUsuarios()` → retorna lista de `usuarios_perfil`.
- `criarUsuario({ nome, email, senha, role })` → `admin.createUser({ email, password, email_confirm: true, user_metadata: { nome } })` e upsert em `usuarios_perfil`.
- `atualizarStatusUsuario({ user_id, status })`.
- `redefinirSenhaUsuario({ user_id, nova_senha })` → `admin.updateUserById`.

### Frontend

- `src/routes/auth.tsx`: remover completamente o modo `signup` (state `mode`, botão de alternância, branch de `signUp`). Formulário fica só com email/senha + botão "Entrar".
- Novo hook `useCurrentPerfil()` (em `src/hooks/use-perfil.ts`): `useQuery` que busca `usuarios_perfil` do usuário atual. Usado em vários lugares.
- `src/routes/_authenticated/route.tsx`: após confirmar sessão, buscar perfil; se `status='bloqueado'`, renderizar tela "Acesso bloqueado" (com botão sair) em vez do `<Outlet />`. Se perfil não existe (edge case), tratar como bloqueado.
- `src/routes/_authenticated/configuracoes.tsx`: adicionar cartão "Usuários" visível apenas se `role='admin'`, linkando para nova rota `/usuarios`.
- Nova rota `src/routes/_authenticated/usuarios.tsx` (só admin — se não-admin, redireciona pra `/dashboard`):
  - Botão "Novo usuário" abre dialog com nome/email/senha/role → chama `criarUsuario`.
  - Lista de usuários com badge de status + ações: bloquear/desbloquear, redefinir senha (dialog com nova senha).

### Config Supabase Auth

Chamar `supabase--configure_auth` com `disable_signup: true`, `external_anonymous_users_enabled: false`, `auto_confirm_email: true` (para que a criação via admin API seja imediata; o admin API já usa `email_confirm:true`, mas fecha auto-signup público na porta da frente também), `password_hibp_enabled: true`.

---

### Arquivos alterados/criados

- `src/routes/_authenticated/orcamentos.$id.tsx` (mover useState)
- migration nova (tabela + policies + funções + backfill + trigger update)
- `src/lib/admin-users.functions.ts` (novo)
- `src/routes/auth.tsx` (remover signup)
- `src/hooks/use-perfil.ts` (novo)
- `src/routes/_authenticated/route.tsx` (gate bloqueado)
- `src/routes/_authenticated/configuracoes.tsx` (link Usuários se admin)
- `src/routes/_authenticated/usuarios.tsx` (novo)
- `supabase--configure_auth` (disable_signup)

Nenhuma outra tela, cálculo ou fluxo é alterado.
