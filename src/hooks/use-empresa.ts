import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEmpresaConfig() {
  return useQuery({
    queryKey: ["empresa"],
    queryFn: async () => {
      const { data } = await supabase.from("empresa_config").select("*").maybeSingle();
      return data;
    },
  });
}

/** Gera signed URL para um path de arquivo no bucket empresa-logos. */
export function useLogoSignedUrl(path?: string | null) {
  return useQuery({
    queryKey: ["empresa-logo-signed", path ?? ""],
    enabled: !!path,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from("empresa-logos")
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 dias
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
}

export async function getLogoSignedUrl(path?: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from("empresa-logos")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error) return null;
  return data?.signedUrl ?? null;
}
