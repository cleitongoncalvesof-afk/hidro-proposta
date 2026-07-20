import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: { role?: string; status?: string } | null }>;
      };
    };
  };
}, userId: string) {
  const { data } = await supabase
    .from("usuarios_perfil")
    .select("role,status")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data || data.role !== "admin" || data.status !== "ativo") {
    throw new Error("Forbidden: apenas administradores");
  }
}

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { data, error } = await context.supabase
      .from("usuarios_perfil")
      .select("user_id,nome,email,role,status,criado_em")
      .order("criado_em", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        nome: z.string().min(1),
        email: z.string().email(),
        senha: z.string().min(6),
        role: z.enum(["admin", "usuario"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const created = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "Falha ao criar usuário");
    }
    const uid = created.data.user.id;
    const { error } = await supabaseAdmin
      .from("usuarios_perfil")
      .upsert(
        {
          user_id: uid,
          nome: data.nome,
          email: data.email,
          role: data.role,
          status: "ativo",
        },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { user_id: uid };
  });

export const atualizarStatusUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), status: z.enum(["ativo", "bloqueado"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("usuarios_perfil")
      .update({ status: data.status })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const atualizarRoleUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), role: z.enum(["admin", "usuario"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("usuarios_perfil")
      .update({ role: data.role })
      .eq("user_id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const redefinirSenhaUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ user_id: z.string().uuid(), nova_senha: z.string().min(6) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.nova_senha,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
