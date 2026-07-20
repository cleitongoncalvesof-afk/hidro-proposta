import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  user_id: string;
  nome: string | null;
  email: string | null;
  role: "admin" | "usuario";
  status: "ativo" | "bloqueado";
  criado_em: string;
};

export function useCurrentPerfil() {
  return useQuery({
    queryKey: ["current-perfil"],
    queryFn: async (): Promise<Perfil | null> => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("usuarios_perfil")
        .select("*")
        .eq("user_id", u.user.id)
        .maybeSingle();
      return (data as Perfil | null) ?? null;
    },
  });
}
