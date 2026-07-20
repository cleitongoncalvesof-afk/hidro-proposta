import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { useCurrentPerfil } from "@/hooks/use-perfil";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const perfil = useCurrentPerfil();
  const nav = useNavigate();

  if (perfil.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const bloqueado = !perfil.data || perfil.data.status === "bloqueado";
  if (bloqueado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-xl font-semibold text-destructive">Acesso bloqueado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Seu acesso a este sistema foi bloqueado. Fale com o administrador.
          </p>
          <Button
            className="mt-6 w-full"
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              nav({ to: "/auth" });
            }}
          >
            Sair
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
