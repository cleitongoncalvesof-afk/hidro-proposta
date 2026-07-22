import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentPerfil } from "@/hooks/use-perfil";
import { Users } from "lucide-react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, Plus, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { NumericInput } from "./novo";
import { useLogoSignedUrl } from "@/hooks/use-empresa";

type Empresa = Database["public"]["Tables"]["empresa_config"]["Row"];
type Template = Database["public"]["Tables"]["proposta_templates"]["Row"];
type TipoApp = Database["public"]["Tables"]["tipos_aplicacao"]["Row"];

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});

function Configuracoes() {
  const perfil = useCurrentPerfil();
  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-semibold">Configurações</h1>
      {perfil.data?.role === "admin" && (
        <Link
          to="/usuarios"
          className="flex items-center justify-between rounded-md border bg-card p-3 text-sm"
        >
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Gerenciar usuários
          </span>
          <span className="text-muted-foreground">›</span>
        </Link>
      )}
      <Tabs defaultValue="empresa">
        <TabsList className="grid w-full grid-cols-3">

          <TabsTrigger value="empresa">Empresa</TabsTrigger>
          <TabsTrigger value="templates">Propostas</TabsTrigger>
          <TabsTrigger value="tipos">Tipos</TabsTrigger>
        </TabsList>
        <TabsContent value="empresa"><EmpresaForm /></TabsContent>
        <TabsContent value="templates"><TemplatesForm /></TabsContent>
        <TabsContent value="tipos"><TiposForm /></TabsContent>
      </Tabs>
    </div>
  );
}

function EmpresaForm() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["empresa"],
    queryFn: async () => (await supabase.from("empresa_config").select("*").maybeSingle()).data,
  });
  const [form, setForm] = useState<Partial<Empresa>>({});
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);
  const save = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("empresa_config").update(form).eq("user_id", u.user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["empresa"] });
      toast.success("Salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  if (!data) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  const set = <K extends keyof Empresa>(k: K, v: Empresa[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="mt-3 space-y-3">
      <LogoUpload currentPath={form.logo_url ?? null} onChanged={() => qc.invalidateQueries({ queryKey: ["empresa"] })} />
      <Card className="space-y-3 p-3">
        <F label="Razão social"><Input value={form.razao_social ?? ""} onChange={(e) => set("razao_social", e.target.value)} /></F>
        <F label="Nome fantasia"><Input value={form.nome_fantasia ?? ""} onChange={(e) => set("nome_fantasia", e.target.value)} /></F>
        <F label="Endereço"><Input value={form.endereco ?? ""} onChange={(e) => set("endereco", e.target.value)} /></F>
        <F label="CNPJ"><Input value={form.cnpj ?? ""} onChange={(e) => set("cnpj", e.target.value)} /></F>
        <F label="Telefone"><Input value={form.telefone ?? ""} onChange={(e) => set("telefone", e.target.value)} /></F>
        <F label="E-mail"><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></F>
        <F label="Site"><Input value={form.site ?? ""} onChange={(e) => set("site", e.target.value)} /></F>
        <F label="Dados bancários"><Input value={form.dados_bancarios ?? ""} onChange={(e) => set("dados_bancarios", e.target.value)} /></F>
        <F label="Responsável"><Input value={form.responsavel ?? ""} onChange={(e) => set("responsavel", e.target.value)} /></F>
        <F label="Cidade na assinatura"><Input value={form.cidade_assinatura ?? ""} onChange={(e) => set("cidade_assinatura", e.target.value)} /></F>
      </Card>
      <Card className="space-y-3 p-3">
        <p className="font-display text-sm font-semibold text-primary">Padrões financeiros</p>
        <div className="grid grid-cols-2 gap-2">
          <F label="Margem padrão (0-2)"><NumericInput value={Number(form.margem_padrao ?? 0.7)} onChange={(v) => set("margem_padrao", v)} /></F>
          <F label="Alíquota padrão (0-1)"><NumericInput value={Number(form.aliquota_padrao ?? 0.12)} onChange={(v) => set("aliquota_padrao", v)} /></F>
        </div>
        <F label="Condições de pagamento padrão"><Textarea rows={3} value={form.texto_condicoes_pagamento_padrao ?? ""} onChange={(e) => set("texto_condicoes_pagamento_padrao", e.target.value)} /></F>
        <F label="Cláusulas de cobrança"><Textarea rows={6} value={form.texto_clausulas_cobranca ?? ""} onChange={(e) => set("texto_clausulas_cobranca", e.target.value)} /></F>
      </Card>
      <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
    </div>
  );
}

function TemplatesForm() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["templates"],
    queryFn: async () => (await supabase.from("proposta_templates").select("*")).data,
  });
  const [tipo, setTipo] = useState<"grama_liquida" | "mix_sementes">("grama_liquida");
  const current = data?.find((t) => t.tipo === tipo);
  const [form, setForm] = useState<Partial<Template>>({});
  useEffect(() => {
    if (current) setForm(current);
  }, [current?.id]);
  const save = useMutation({
    mutationFn: async () => {
      if (!current) return;
      const { error } = await supabase.from("proposta_templates").update(form).eq("id", current.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["templates"] });
      toast.success("Salvo");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = <K extends keyof Template>(k: K, v: Template[K]) => setForm((f) => ({ ...f, [k]: v }));
  if (!data) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  return (
    <div className="mt-3 space-y-3">
      <Select value={tipo} onValueChange={(v) => setTipo(v as "grama_liquida" | "mix_sementes")}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="grama_liquida">Grama Líquida</SelectItem>
          <SelectItem value="mix_sementes">Mix de Sementes</SelectItem>
        </SelectContent>
      </Select>
      <Card className="space-y-3 p-3">
        <F label="Texto de abertura"><Textarea rows={5} value={form.texto_abertura ?? ""} onChange={(e) => set("texto_abertura", e.target.value)} /></F>
        <F label="Responsabilidade da contratante"><Textarea rows={8} value={form.texto_responsabilidade_contratante ?? ""} onChange={(e) => set("texto_responsabilidade_contratante", e.target.value)} /></F>
        <F label="Termos"><Textarea rows={6} value={form.texto_termos ?? ""} onChange={(e) => set("texto_termos", e.target.value)} /></F>
        <F label="Termo de garantia"><Textarea rows={5} value={form.texto_garantia ?? ""} onChange={(e) => set("texto_garantia", e.target.value)} /></F>
        <div className="grid grid-cols-2 gap-2">
          <F label="Validade (dias)"><Input type="number" value={form.validade_dias ?? 10} onChange={(e) => set("validade_dias", Number(e.target.value))} /></F>
          <F label="Despedida"><Input value={form.despedida ?? ""} onChange={(e) => set("despedida", e.target.value)} /></F>
        </div>
        {tipo === "mix_sementes" && (
          <F label="Valor mobilização adicional padrão (R$)">
            <NumericInput value={Number(form.valor_mobilizacao_adicional_padrao ?? 100)} onChange={(v) => set("valor_mobilizacao_adicional_padrao", v)} />
          </F>
        )}
      </Card>
      <Button className="w-full" onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
    </div>
  );
}

function TiposForm() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["tipos_aplicacao_all"],
    queryFn: async () => (await supabase.from("tipos_aplicacao").select("*").order("proposta_tipo").order("nome")).data,
  });
  const [novo, setNovo] = useState<Partial<TipoApp>>({ nome: "", custo_padrao_m2: 0, proposta_tipo: "grama_liquida" });
  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("tipos_aplicacao").insert({
        user_id: u.user!.id,
        nome: novo.nome!,
        custo_padrao_m2: novo.custo_padrao_m2 ?? 0,
        proposta_tipo: novo.proposta_tipo!,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNovo({ nome: "", custo_padrao_m2: 0, proposta_tipo: "grama_liquida" });
      qc.invalidateQueries({ queryKey: ["tipos_aplicacao_all"] });
      toast.success("Adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tipos_aplicacao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tipos_aplicacao_all"] }),
  });
  const save = useMutation({
    mutationFn: async (patch: { id: string; litros_por_tanque: number; preco_por_litro: number; rendimento_medio_m2: number; custo_padrao_m2: number }) => {
      const { id, ...rest } = patch;
      const { error } = await supabase.from("tipos_aplicacao").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_aplicacao_all"] });
      toast.success("Atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted-foreground">
        Combustível/m² por tipo = (litros/tanque × R$/L) ÷ rendimento m². Usado quando "Calcular por m²" está ligado na etapa Custos.
      </p>
      {(data ?? []).map((t) => (
        <TipoRow key={t.id} t={t} onSave={(p) => save.mutate({ id: t.id, ...p })} onDelete={() => del.mutate(t.id)} saving={save.isPending} />
      ))}
      <Card className="space-y-2 p-3">
        <p className="font-display text-sm font-semibold text-primary">Novo tipo</p>
        <Input placeholder="Nome" value={novo.nome ?? ""} onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2">
          <NumericInput value={Number(novo.custo_padrao_m2 ?? 0)} onChange={(v) => setNovo((n) => ({ ...n, custo_padrao_m2: v }))} />
          <Select value={novo.proposta_tipo} onValueChange={(v) => setNovo((n) => ({ ...n, proposta_tipo: v as "grama_liquida" | "mix_sementes" }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="grama_liquida">Grama Líquida</SelectItem>
              <SelectItem value="mix_sementes">Mix de Sementes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => create.mutate()} disabled={!novo.nome || create.isPending} className="w-full">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </Card>
    </div>
  );
}

function TipoRow({
  t,
  onSave,
  onDelete,
  saving,
}: {
  t: TipoApp;
  onSave: (p: { litros_por_tanque: number; preco_por_litro: number; rendimento_medio_m2: number; custo_padrao_m2: number }) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [litros, setLitros] = useState(Number(t.litros_por_tanque ?? 6.5));
  const [preco, setPreco] = useState(Number(t.preco_por_litro ?? 7));
  const [rend, setRend] = useState(Number(t.rendimento_medio_m2 ?? 250));
  const [custo, setCusto] = useState(Number(t.custo_padrao_m2 ?? 0));
  const custoM2 = rend > 0 ? (litros * preco) / rend : 0;
  return (
    <Card className="space-y-2 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{t.nome}</p>
          <p className="text-[10px] text-muted-foreground">
            {t.proposta_tipo === "grama_liquida" ? "Grama Líquida" : "Mix"}
          </p>
        </div>
        <button onClick={onDelete} className="text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <F label="Litros/tanque"><NumericInput value={litros} onChange={setLitros} /></F>
        <F label="R$/L"><NumericInput value={preco} onChange={setPreco} /></F>
        <F label="Rend. m²"><NumericInput value={rend} onChange={setRend} /></F>
      </div>
      <F label="Custo insumo padrão (R$/m²)"><NumericInput value={custo} onChange={setCusto} /></F>
      <div className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1 text-xs">
        <span className="text-muted-foreground">Combustível equipamento por m²</span>
        <span className="font-mono">R$ {custoM2.toFixed(4)}</span>
      </div>
      <Button
        size="sm"
        onClick={() => onSave({ litros_por_tanque: litros, preco_por_litro: preco, rendimento_medio_m2: rend, custo_padrao_m2: custo })}
        disabled={saving}
        className="w-full"
      >
        Salvar
      </Button>
    </Card>
  );
}

function LogoUpload({ currentPath, onChanged }: { currentPath: string | null; onChanged: () => void }) {
  const signed = useLogoSignedUrl(currentPath);
  const [uploading, setUploading] = useState(false);
  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo maior que 2MB");
      return;
    }
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user!.id;
      const ext = file.name.split(".").pop() || "png";
      const path = `${uid}/logo-${Date.now()}.${ext}`;
      const up = await supabase.storage.from("empresa-logos").upload(path, file, { upsert: true, contentType: file.type });
      if (up.error) throw up.error;
      if (currentPath && currentPath !== path) {
        await supabase.storage.from("empresa-logos").remove([currentPath]);
      }
      const { error } = await supabase.from("empresa_config").update({ logo_url: path }).eq("user_id", uid);
      if (error) throw error;
      toast.success("Logomarca atualizada");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }
  async function handleRemove() {
    if (!currentPath) return;
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      await supabase.storage.from("empresa-logos").remove([currentPath]);
      const { error } = await supabase.from("empresa_config").update({ logo_url: null }).eq("user_id", u.user!.id);
      if (error) throw error;
      toast.success("Logomarca removida");
      onChanged();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }
  return (
    <Card className="space-y-3 p-3">
      <p className="text-sm font-semibold">Logomarca</p>
      <div className="flex items-center gap-3">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded border bg-muted">
          {signed.data ? (
            <img src={signed.data} alt="Logo" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">Sem logo</span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" />
            <span>{uploading ? "Enviando..." : "Selecionar imagem"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
          </label>
          {currentPath && (
            <Button size="sm" variant="ghost" onClick={handleRemove} disabled={uploading}>
              Remover
            </Button>
          )}
          <p className="text-[11px] text-muted-foreground">PNG/JPG até 2MB. Aparece no cabeçalho da proposta.</p>
        </div>
      </div>
    </Card>
  );
}


function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
