import { createFileRoute } from "@tanstack/react-router";
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
import { Trash2, Plus } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { NumericInput } from "./novo";

type Empresa = Database["public"]["Tables"]["empresa_config"]["Row"];
type Template = Database["public"]["Tables"]["proposta_templates"]["Row"];
type TipoApp = Database["public"]["Tables"]["tipos_aplicacao"]["Row"];

export const Route = createFileRoute("/_authenticated/configuracoes")({
  component: Configuracoes,
});

function Configuracoes() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-lg font-semibold">Configurações</h1>
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
  const [novo, setNovo] = useState<Partial<TipoApp>>({
    nome: "", descricao: "", custo_padrao_m2: 0, proposta_tipo: "grama_liquida",
    litros_por_tanque: 6.5, preco_por_litro: 7.0, rendimento_medio_m2: 250,
  });
  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("tipos_aplicacao").insert({
        user_id: u.user!.id,
        nome: novo.nome!,
        descricao: novo.descricao ?? null,
        custo_padrao_m2: novo.custo_padrao_m2 ?? 0,
        proposta_tipo: novo.proposta_tipo!,
        litros_por_tanque: novo.litros_por_tanque ?? 6.5,
        preco_por_litro: novo.preco_por_litro ?? 7.0,
        rendimento_medio_m2: novo.rendimento_medio_m2 ?? 250,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNovo({ nome: "", descricao: "", custo_padrao_m2: 0, proposta_tipo: "grama_liquida", litros_por_tanque: 6.5, preco_por_litro: 7.0, rendimento_medio_m2: 250 });
      qc.invalidateQueries({ queryKey: ["tipos_aplicacao_all"] });
      toast.success("Adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs text-muted-foreground">
        Edite os preços por m² e parâmetros de combustível de cada tipo. Toque em <b>Salvar</b> para gravar.
      </p>
      {(data ?? []).map((t) => (
        <TipoCard key={t.id} tipo={t} />
      ))}
      <Card className="space-y-2 p-3">
        <p className="font-display text-sm font-semibold text-primary">Novo tipo</p>
        <F label="Nome">
          <Input placeholder="Ex.: VERDEPLAN" value={novo.nome ?? ""} onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))} />
        </F>
        <F label="Descrição (opcional)">
          <Input placeholder="Detalhes" value={novo.descricao ?? ""} onChange={(e) => setNovo((n) => ({ ...n, descricao: e.target.value }))} />
        </F>
        <div className="grid grid-cols-2 gap-2">
          <F label="Custo insumo (R$/m²)">
            <NumericInput value={Number(novo.custo_padrao_m2 ?? 0)} onChange={(v) => setNovo((n) => ({ ...n, custo_padrao_m2: v }))} />
          </F>
          <F label="Categoria">
            <Select value={novo.proposta_tipo} onValueChange={(v) => setNovo((n) => ({ ...n, proposta_tipo: v as "grama_liquida" | "mix_sementes" }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grama_liquida">Grama Líquida</SelectItem>
                <SelectItem value="mix_sementes">Mix de Sementes</SelectItem>
              </SelectContent>
            </Select>
          </F>
        </div>
        <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Combustível do equipamento</p>
        <div className="grid grid-cols-3 gap-2">
          <F label="L/tanque">
            <NumericInput value={Number(novo.litros_por_tanque ?? 6.5)} onChange={(v) => setNovo((n) => ({ ...n, litros_por_tanque: v }))} />
          </F>
          <F label="R$/L">
            <NumericInput value={Number(novo.preco_por_litro ?? 7)} onChange={(v) => setNovo((n) => ({ ...n, preco_por_litro: v }))} />
          </F>
          <F label="Rend. m²">
            <NumericInput value={Number(novo.rendimento_medio_m2 ?? 250)} onChange={(v) => setNovo((n) => ({ ...n, rendimento_medio_m2: v }))} />
          </F>
        </div>
        <Button onClick={() => create.mutate()} disabled={!novo.nome || create.isPending} className="w-full">
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      </Card>
    </div>
  );
}

function TipoCard({ tipo }: { tipo: TipoApp }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<TipoApp>(tipo);
  useEffect(() => { setForm(tipo); }, [tipo]);
  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tipos_aplicacao").update({
        nome: form.nome,
        descricao: form.descricao,
        custo_padrao_m2: form.custo_padrao_m2,
        litros_por_tanque: form.litros_por_tanque,
        preco_por_litro: form.preco_por_litro,
        rendimento_medio_m2: form.rendimento_medio_m2,
      }).eq("id", tipo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_aplicacao_all"] });
      qc.invalidateQueries({ queryKey: ["tipos_aplicacao"] });
      toast.success("Salvo");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("tipos_aplicacao").delete().eq("id", tipo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tipos_aplicacao_all"] });
      toast.success("Removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const custoCombM2 = (Number(form.litros_por_tanque) * Number(form.preco_por_litro)) / (Number(form.rendimento_medio_m2) || 1);
  return (
    <Card className="p-3">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <div>
          <p className="font-medium">{tipo.nome}</p>
          <p className="text-xs text-muted-foreground">
            {tipo.proposta_tipo === "grama_liquida" ? "Grama Líquida" : "Mix"} · R$ {Number(tipo.custo_padrao_m2).toFixed(2)}/m²
          </p>
        </div>
        <span className="text-xs font-semibold text-primary">{open ? "Fechar" : "Editar"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2 border-t pt-3">
          <F label="Nome">
            <Input value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} />
          </F>
          <F label="Descrição">
            <Input value={form.descricao ?? ""} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
          </F>
          <F label="Custo insumo (R$/m²)">
            <NumericInput value={Number(form.custo_padrao_m2)} onChange={(v) => setForm((f) => ({ ...f, custo_padrao_m2: v }))} />
          </F>
          <p className="pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Combustível do equipamento</p>
          <div className="grid grid-cols-3 gap-2">
            <F label="L/tanque">
              <NumericInput value={Number(form.litros_por_tanque)} onChange={(v) => setForm((f) => ({ ...f, litros_por_tanque: v }))} />
            </F>
            <F label="R$/L">
              <NumericInput value={Number(form.preco_por_litro)} onChange={(v) => setForm((f) => ({ ...f, preco_por_litro: v }))} />
            </F>
            <F label="Rend. m²">
              <NumericInput value={Number(form.rendimento_medio_m2)} onChange={(v) => setForm((f) => ({ ...f, rendimento_medio_m2: v }))} />
            </F>
          </div>
          <p className="rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
            Custo combustível estimado: <b className="font-mono text-primary">R$ {custoCombM2.toFixed(3)}/m²</b>
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="outline" className="text-destructive" onClick={() => { if (confirm(`Remover "${tipo.nome}"?`)) del.mutate(); }} disabled={del.isPending}>
              <Trash2 className="mr-1 h-4 w-4" /> Remover
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
          </div>
        </div>
      )}
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
