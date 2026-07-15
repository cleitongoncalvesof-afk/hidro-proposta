import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Sprout, Leaf, ChevronLeft, ChevronRight, Trash2, Plus, Download, MessageCircle, Save } from "lucide-react";
import { calcular } from "@/lib/calc";
import { fmtBRL, fmtPct, padProposta } from "@/lib/format";
import { PropostaPreview, type PropostaData } from "@/components/PropostaPreview";
import { baixarPropostaPDF } from "@/lib/pdf";
import type { Database } from "@/integrations/supabase/types";

type Tipo = "grama_liquida" | "mix_sementes";
type Item = { descricao: string; quantidade_m2: number; custo_insumo_m2: number; tipo_aplicacao_id?: string | null };
type Cliente = Database["public"]["Tables"]["clientes"]["Row"];

type FormState = {
  proposta_tipo: Tipo | null;
  cliente_id: string | null;
  cliente_novo: Partial<Cliente> | null;
  obra_descricao: string;
  itens: Item[];
  frete: number;
  mao_obra_diaria: number;
  mao_obra_dias: number;
  alimentacao_diaria: number;
  alimentacao_dias: number;
  hospedagem_diaria: number;
  hospedagem_qtd: number;
  combustivel_modo: "manual" | "auto_m2";
  combustivel_equipamento: number;
  combustivel_km_l: number;
  combustivel_r_l: number;
  combustivel_distancia_km: number;
  outras_despesas: number;
  mobilizacoes_extras: number;
  valor_mobilizacao_adicional: number;
  margem: number;
  aliquota: number;
};

const emptyState: FormState = {
  proposta_tipo: null,
  cliente_id: null,
  cliente_novo: null,
  obra_descricao: "",
  itens: [],
  frete: 0,
  mao_obra_diaria: 0,
  mao_obra_dias: 0,
  alimentacao_diaria: 0,
  alimentacao_dias: 0,
  hospedagem_diaria: 0,
  hospedagem_qtd: 0,
  combustivel_modo: "manual",
  combustivel_equipamento: 0,
  combustivel_km_l: 0,
  combustivel_r_l: 0,
  combustivel_distancia_km: 0,
  outras_despesas: 0,
  mobilizacoes_extras: 0,
  valor_mobilizacao_adicional: 100,
  margem: 0.7,
  aliquota: 0.12,
};


const DRAFT_KEY = "4g_novo_orcamento_draft";

export const Route = createFileRoute("/_authenticated/novo")({
  component: NovoOrcamento,
});

function NovoOrcamento() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<FormState>(() => {
    if (typeof window !== "undefined") {
      const s = localStorage.getItem(DRAFT_KEY);
      if (s) {
        try {
          return { ...emptyState, ...JSON.parse(s) };
        } catch { /* ignore */ }
      }
    }
    return emptyState;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    }
  }, [state]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const tipos = useQuery({
    queryKey: ["tipos_aplicacao", state.proposta_tipo],
    enabled: !!state.proposta_tipo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_aplicacao")
        .select("*")
        .eq("proposta_tipo", state.proposta_tipo!)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("proposta_templates").select("*");
      if (error) throw error;
      return data;
    },
  });

  const empresa = useQuery({
    queryKey: ["empresa"],
    queryFn: async () => {
      const { data, error } = await supabase.from("empresa_config").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const clientes = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*").order("nome");
      if (error) throw error;
      return data;
    },
  });

  const template = templates.data?.find((t) => t.tipo === state.proposta_tipo);

  // Combustível do equipamento: quando modo=auto_m2, calcula a partir dos tipos
  const combustivelAutoDetalhe = useMemo(() => {
    if (state.combustivel_modo !== "auto_m2" || !tipos.data) return null;
    const linhas = state.itens
      .map((it) => {
        const t = tipos.data!.find((x) => x.id === it.tipo_aplicacao_id);
        if (!t || !t.rendimento_medio_m2 || Number(t.rendimento_medio_m2) <= 0) return null;
        const custoM2 =
          (Number(t.litros_por_tanque) * Number(t.preco_por_litro)) / Number(t.rendimento_medio_m2);
        return {
          tipo: t.nome,
          m2: it.quantidade_m2,
          custoM2,
          subtotal: custoM2 * it.quantidade_m2,
        };
      })
      .filter((x): x is { tipo: string; m2: number; custoM2: number; subtotal: number } => !!x);
    const total = linhas.reduce((a, l) => a + l.subtotal, 0);
    return { linhas, total };
  }, [state.combustivel_modo, state.itens, tipos.data]);

  const effectiveState = useMemo(
    () =>
      state.combustivel_modo === "auto_m2" && combustivelAutoDetalhe
        ? { ...state, combustivel_equipamento: combustivelAutoDetalhe.total }
        : state,
    [state, combustivelAutoDetalhe],
  );

  const calc = useMemo(() => calcular(effectiveState), [effectiveState]);


  // Set defaults from template when tipo picked
  useEffect(() => {
    if (template && state.valor_mobilizacao_adicional === 100 && template.valor_mobilizacao_adicional_padrao) {
      setState((s) => ({ ...s, valor_mobilizacao_adicional: Number(template.valor_mobilizacao_adicional_padrao) }));
    }
  }, [template, state.valor_mobilizacao_adicional]);

  useEffect(() => {
    if (empresa.data && state.margem === 0.7 && state.aliquota === 0.12) {
      setState((s) => ({
        ...s,
        margem: Number(empresa.data!.margem_padrao),
        aliquota: Number(empresa.data!.aliquota_padrao),
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa.data]);

  const totalSteps = 6;
  const stepLabels = ["Tipo", "Cliente", "Áreas", "Custos", "Preço", "Revisão"];

  function canAdvance(): boolean {
    if (step === 0) return !!state.proposta_tipo;
    if (step === 1) return !!state.cliente_id || !!state.cliente_novo?.nome;
    if (step === 2) return state.itens.length > 0 && state.itens.every((i) => i.quantidade_m2 > 0);
    return true;
  }

  const saveMutation = useMutation({
    mutationFn: async (novo_status: "rascunho" | "enviado") => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sem sessão");
      const user_id = userData.user.id;

      let cliente_id = state.cliente_id;
      if (!cliente_id && state.cliente_novo?.nome) {
        const { data: c, error } = await supabase
          .from("clientes")
          .insert({ ...state.cliente_novo, nome: state.cliente_novo.nome!, user_id })
          .select()
          .single();
        if (error) throw error;
        cliente_id = c.id;
      }
      if (!cliente_id) throw new Error("Cliente obrigatório");

      const { data: numData, error: numErr } = await supabase.rpc("next_orcamento_numero", { p_user_id: user_id });
      if (numErr) throw numErr;

      const { data: orc, error: orcErr } = await supabase
        .from("orcamentos")
        .insert({
          user_id,
          cliente_id,
          numero: numData as number,
          proposta_tipo: state.proposta_tipo!,
          obra_descricao: state.obra_descricao || null,
          mobilizacoes_extras: state.mobilizacoes_extras,
          valor_mobilizacao_adicional: state.valor_mobilizacao_adicional,
          status: novo_status,
          frete: state.frete,
          mao_obra_diaria: state.mao_obra_diaria,
          mao_obra_dias: state.mao_obra_dias,
          alimentacao_diaria: state.alimentacao_diaria,
          alimentacao_dias: state.alimentacao_dias,
          hospedagem_diaria: state.hospedagem_diaria,
          hospedagem_qtd: state.hospedagem_qtd,
          combustivel_modo: state.combustivel_modo,
          combustivel_equipamento: effectiveState.combustivel_equipamento,
          combustivel_km_l: state.combustivel_km_l,
          combustivel_r_l: state.combustivel_r_l,
          combustivel_distancia_km: state.combustivel_distancia_km,
          outras_despesas: state.outras_despesas,
          margem: state.margem,
          aliquota: state.aliquota,

        })
        .select()
        .single();
      if (orcErr) throw orcErr;

      const { error: itErr } = await supabase.from("orcamento_itens").insert(
        state.itens.map((it, i) => ({
          orcamento_id: orc.id,
          user_id,
          tipo_aplicacao_id: it.tipo_aplicacao_id || null,
          descricao: it.descricao,
          quantidade_m2: it.quantidade_m2,
          custo_insumo_m2: it.custo_insumo_m2,
          ordem: i,
        })),
      );
      if (itErr) throw itErr;
      return orc.id;
    },
    onSuccess: (id) => {
      localStorage.removeItem(DRAFT_KEY);
      qc.invalidateQueries({ queryKey: ["orcamentos-dashboard"] });
      toast.success("Orçamento salvo");
      nav({ to: "/orcamentos/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const propostaData: PropostaData | null =
    empresa.data && template && (state.cliente_id || state.cliente_novo?.nome)
      ? {
          empresa: empresa.data,
          template,
          cliente:
            (state.cliente_id
              ? clientes.data?.find((c) => c.id === state.cliente_id)
              : (state.cliente_novo as Cliente)) ?? { nome: "" },
          numero: 0,
          proposta_tipo: state.proposta_tipo!,
          obra_descricao: state.obra_descricao,
          itens: state.itens,
          mobilizacoes_extras: state.mobilizacoes_extras,
          valor_mobilizacao_adicional: state.valor_mobilizacao_adicional,
          condicoes_pagamento: empresa.data.texto_condicoes_pagamento_padrao,
          calc,
          criado_em: new Date(),
        }
      : null;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-semibold text-primary">{stepLabels[step]}</span>
          <span className="text-muted-foreground">Etapa {step + 1} de {totalSteps}</span>
        </div>
        <Progress value={((step + 1) / totalSteps) * 100} className="h-1.5" />
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Qual o tipo de proposta?</h2>
          <TipoCard
            selected={state.proposta_tipo === "grama_liquida"}
            onClick={() => update("proposta_tipo", "grama_liquida")}
            icon={<Leaf className="h-8 w-8" />}
            title="Grama Líquida"
            desc="Recuperação com grama líquida (VERDEPLAN, VERDEFLEX, VERDEMAX, Plantio)."
          />
          <TipoCard
            selected={state.proposta_tipo === "mix_sementes"}
            onClick={() => update("proposta_tipo", "mix_sementes")}
            icon={<Sprout className="h-8 w-8" />}
            title="Mix de Sementes / Hidromanta"
            desc="Recuperação vegetal por hidrossemeadura (HIDROMANTA e mix de sementes)."
          />
        </div>
      )}

      {step === 1 && (
        <ClienteStep
          state={state}
          setState={setState}
          clientes={clientes.data ?? []}
        />
      )}

      {step === 2 && (
        <ItensStep
          state={state}
          setState={setState}
          tipos={tipos.data ?? []}
        />
      )}

      {step === 3 && <CustosStep state={state} setState={setState} isMix={state.proposta_tipo === "mix_sementes"} />}

      {step === 4 && <PrecoStep state={state} setState={setState} calc={calc} />}

      {step === 5 && propostaData && (
        <div className="space-y-3">
          <div className="rounded-md bg-primary/5 p-3 text-xs">
            <p className="font-semibold text-primary">Prévia da proposta</p>
            <p className="text-muted-foreground">
              O número final será gerado ao salvar. Total: <b>{fmtBRL(calc.faturamento_bruto)}</b> · Lucro real: <b>{fmtBRL(calc.lucro_real)}</b>
            </p>
          </div>
          <PropostaPreview data={propostaData} />
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => saveMutation.mutate("rascunho")}
              disabled={saveMutation.isPending}
            >
              <Save className="mr-1 h-4 w-4" /> Salvar rascunho
            </Button>
            <Button
              onClick={() => saveMutation.mutate("enviado")}
              disabled={saveMutation.isPending}
            >
              Salvar e enviar
            </Button>
            <Button
              variant="secondary"
              onClick={() => baixarPropostaPDF({ ...propostaData, numero: 0 })}
              className="col-span-2"
            >
              <Download className="mr-1 h-4 w-4" /> Baixar prévia em PDF
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (step === 0) nav({ to: "/dashboard" });
            else setStep(step - 1);
          }}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Voltar
        </Button>
        {step < totalSteps - 1 && (
          <Button type="button" onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
            Continuar <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function TipoCard({
  selected,
  onClick,
  icon,
  title,
  desc,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-3 ${selected ? "bg-primary text-primary-foreground" : "bg-muted text-primary"}`}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="font-display text-base font-semibold">{title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
    </button>
  );
}

function ClienteStep({
  state,
  setState,
  clientes,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  clientes: Cliente[];
}) {
  const [mode, setMode] = useState<"existente" | "novo">(
    state.cliente_novo ? "novo" : "existente",
  );
  const isMix = state.proposta_tipo === "mix_sementes";
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={mode === "existente" ? "default" : "outline"}
          onClick={() => {
            setMode("existente");
            setState((s) => ({ ...s, cliente_novo: null }));
          }}
        >
          Existente
        </Button>
        <Button
          variant={mode === "novo" ? "default" : "outline"}
          onClick={() => {
            setMode("novo");
            setState((s) => ({ ...s, cliente_id: null, cliente_novo: s.cliente_novo ?? { nome: "" } }));
          }}
        >
          Novo cliente
        </Button>
      </div>

      {mode === "existente" && (
        <div className="space-y-2">
          {clientes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado. Toque em "Novo cliente".</p>
          ) : (
            clientes.map((c) => (
              <button
                key={c.id}
                onClick={() => setState((s) => ({ ...s, cliente_id: c.id, cliente_novo: null }))}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  state.cliente_id === c.id ? "border-primary bg-primary/5" : "hover:bg-muted"
                }`}
              >
                <p className="font-medium">{c.nome}</p>
                <p className="text-xs text-muted-foreground">{c.municipio_uf || c.telefone || "—"}</p>
              </button>
            ))
          )}
        </div>
      )}

      {mode === "novo" && (
        <div className="space-y-3">
          <Field label="Nome *">
            <Input
              value={state.cliente_novo?.nome ?? ""}
              onChange={(e) => setState((s) => ({ ...s, cliente_novo: { ...s.cliente_novo, nome: e.target.value } }))}
              className="h-11"
            />
          </Field>
          <Field label="Telefone">
            <Input
              inputMode="tel"
              value={state.cliente_novo?.telefone ?? ""}
              onChange={(e) => setState((s) => ({ ...s, cliente_novo: { ...s.cliente_novo, telefone: e.target.value } }))}
              className="h-11"
            />
          </Field>
          <Field label="Endereço">
            <Input
              value={state.cliente_novo?.endereco ?? ""}
              onChange={(e) => setState((s) => ({ ...s, cliente_novo: { ...s.cliente_novo, endereco: e.target.value } }))}
              className="h-11"
            />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Município/UF">
              <Input
                value={state.cliente_novo?.municipio_uf ?? ""}
                onChange={(e) => setState((s) => ({ ...s, cliente_novo: { ...s.cliente_novo, municipio_uf: e.target.value } }))}
                className="h-11"
              />
            </Field>
            <Field label="CEP">
              <Input
                inputMode="numeric"
                value={state.cliente_novo?.cep ?? ""}
                onChange={(e) => setState((s) => ({ ...s, cliente_novo: { ...s.cliente_novo, cep: e.target.value } }))}
                className="h-11"
              />
            </Field>
          </div>
          <Field label="CNPJ/CPF">
            <Input
              inputMode="numeric"
              value={state.cliente_novo?.cnpj_cpf ?? ""}
              onChange={(e) => setState((s) => ({ ...s, cliente_novo: { ...s.cliente_novo, cnpj_cpf: e.target.value } }))}
              className="h-11"
            />
          </Field>
        </div>
      )}

      {isMix && (
        <Field label="Descrição da obra">
          <Textarea
            value={state.obra_descricao}
            onChange={(e) => setState((s) => ({ ...s, obra_descricao: e.target.value }))}
            placeholder="Ex.: Serviço de recuperação vegetal por hidrossemeadura HIDROMANTA para taludes em..."
            rows={3}
          />
        </Field>
      )}
    </div>
  );
}

type TipoAplicacao = Database["public"]["Tables"]["tipos_aplicacao"]["Row"];

function ItensStep({
  state,
  setState,
  tipos,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  tipos: TipoAplicacao[];
}) {
  const addItem = () =>
    setState((s) => ({
      ...s,
      itens: [
        ...s.itens,
        {
          descricao: tipos[0]?.nome ?? "",
          quantidade_m2: 0,
          custo_insumo_m2: Number(tipos[0]?.custo_padrao_m2 ?? 0),
          tipo_aplicacao_id: tipos[0]?.id ?? null,
        },
      ],
    }));

  useEffect(() => {
    if (state.itens.length === 0 && tipos.length > 0) addItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipos.length]);

  const setItem = (i: number, patch: Partial<Item>) =>
    setState((s) => ({
      ...s,
      itens: s.itens.map((it, idx) => (idx === i ? { ...it, ...patch } : it)),
    }));

  const removeItem = (i: number) =>
    setState((s) => ({ ...s, itens: s.itens.filter((_, idx) => idx !== i) }));

  return (
    <div className="space-y-3">
      {state.itens.map((it, i) => (
        <Card key={i} className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground">Área {i + 1}</p>
            {state.itens.length > 1 && (
              <button onClick={() => removeItem(i)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <Field label="Tipo de aplicação">
              <Select
                value={it.tipo_aplicacao_id ?? "manual"}
                onValueChange={(v) => {
                  if (v === "manual") {
                    setItem(i, { tipo_aplicacao_id: null });
                    return;
                  }
                  const tipo = tipos.find((t) => t.id === v);
                  if (tipo) {
                    setItem(i, {
                      tipo_aplicacao_id: tipo.id,
                      descricao: tipo.nome,
                      custo_insumo_m2: Number(tipo.custo_padrao_m2),
                    });
                  }
                }}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipos.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome}
                    </SelectItem>
                  ))}
                  <SelectItem value="manual">Outro (manual)</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {it.tipo_aplicacao_id === null && (
              <Field label="Descrição">
                <Input
                  value={it.descricao}
                  onChange={(e) => setItem(i, { descricao: e.target.value })}
                  className="h-11"
                />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Quantidade (m²)">
                <NumericInput
                  value={it.quantidade_m2}
                  onChange={(v) => setItem(i, { quantidade_m2: v })}
                />
              </Field>
              <Field label="Custo insumo (R$/m²)">
                <NumericInput
                  value={it.custo_insumo_m2}
                  onChange={(v) => setItem(i, { custo_insumo_m2: v })}
                />
              </Field>
            </div>
          </div>
        </Card>
      ))}
      <Button variant="outline" onClick={addItem} className="w-full">
        <Plus className="mr-1 h-4 w-4" /> Adicionar área
      </Button>
    </div>
  );
}

function CustosStep({
  state,
  setState,
  isMix,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  isMix: boolean;
}) {
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setState((s) => ({ ...s, [k]: v }));
  return (
    <div className="space-y-3">
      <Section title="Frete">
        <Field label="Frete (R$)">
          <NumericInput value={state.frete} onChange={(v) => set("frete", v)} />
        </Field>
      </Section>

      <Section title="Mão de obra">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Diária (R$)">
            <NumericInput value={state.mao_obra_diaria} onChange={(v) => set("mao_obra_diaria", v)} />
          </Field>
          <Field label="Dias">
            <NumericInput value={state.mao_obra_dias} onChange={(v) => set("mao_obra_dias", v)} />
          </Field>
        </div>
      </Section>

      <Section title="Alimentação">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Diária (R$)">
            <NumericInput value={state.alimentacao_diaria} onChange={(v) => set("alimentacao_diaria", v)} />
          </Field>
          <Field label="Dias">
            <NumericInput value={state.alimentacao_dias} onChange={(v) => set("alimentacao_dias", v)} />
          </Field>
        </div>
      </Section>

      <Section title="Hospedagem">
        <div className="grid grid-cols-2 gap-2">
          <Field label="Diária (R$)">
            <NumericInput value={state.hospedagem_diaria} onChange={(v) => set("hospedagem_diaria", v)} />
          </Field>
          <Field label="Qtd">
            <NumericInput value={state.hospedagem_qtd} onChange={(v) => set("hospedagem_qtd", v)} />
          </Field>
        </div>
      </Section>

      <Section title="Combustível do equipamento">
        <Field label="Valor (R$)">
          <NumericInput value={state.combustivel_equipamento} onChange={(v) => set("combustivel_equipamento", v)} />
        </Field>
      </Section>

      <Section title="Combustível do veículo">
        <div className="grid grid-cols-3 gap-2">
          <Field label="Km/L">
            <NumericInput value={state.combustivel_km_l} onChange={(v) => set("combustivel_km_l", v)} />
          </Field>
          <Field label="R$/L">
            <NumericInput value={state.combustivel_r_l} onChange={(v) => set("combustivel_r_l", v)} />
          </Field>
          <Field label="Distância (km)">
            <NumericInput value={state.combustivel_distancia_km} onChange={(v) => set("combustivel_distancia_km", v)} />
          </Field>
        </div>
      </Section>

      <Section title="Outras despesas">
        <Field label="Valor (R$)">
          <NumericInput value={state.outras_despesas} onChange={(v) => set("outras_despesas", v)} />
        </Field>
      </Section>

      {isMix && (
        <Section title="Mobilizações adicionais">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantidade extra">
              <NumericInput value={state.mobilizacoes_extras} onChange={(v) => set("mobilizacoes_extras", v)} />
            </Field>
            <Field label="R$ por mobilização">
              <NumericInput value={state.valor_mobilizacao_adicional} onChange={(v) => set("valor_mobilizacao_adicional", v)} />
            </Field>
          </div>
        </Section>
      )}
    </div>
  );
}

function PrecoStep({
  state,
  setState,
  calc,
}: {
  state: FormState;
  setState: React.Dispatch<React.SetStateAction<FormState>>;
  calc: ReturnType<typeof calcular>;
}) {
  return (
    <div className="space-y-4">
      <Card className="p-3">
        <Label className="text-xs">Margem (mark-up): <b>{fmtPct(state.margem)}</b></Label>
        <Slider
          min={0}
          max={2}
          step={0.05}
          value={[state.margem]}
          onValueChange={(v) => setState((s) => ({ ...s, margem: v[0] }))}
          className="mt-3"
        />
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span><span>100%</span><span>200%</span>
        </div>
      </Card>

      <Card className="p-3">
        <Label className="text-xs">Alíquota de imposto: <b>{fmtPct(state.aliquota)}</b></Label>
        <Slider
          min={0}
          max={0.3}
          step={0.005}
          value={[state.aliquota]}
          onValueChange={(v) => setState((s) => ({ ...s, aliquota: v[0] }))}
          className="mt-3"
        />
        <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
          <span>0%</span><span>15%</span><span>30%</span>
        </div>
      </Card>

      <Card className="p-3">
        <p className="mb-2 font-display text-sm font-semibold text-primary">Resultado</p>
        <div className="space-y-1.5 text-sm">
          <Row label="Total m²" value={calc.total_m2.toLocaleString("pt-BR")} />
          <Row label="Custo total" value={fmtBRL(calc.custo_total)} />
          <Row label="Custo por m²" value={fmtBRL(calc.custo_por_m2)} />
          <Row label="Preço por m²" value={fmtBRL(calc.valor_por_m2)} strong />
          <Row label="Faturamento bruto" value={fmtBRL(calc.faturamento_bruto)} strong />
          <Row label="Imposto" value={fmtBRL(calc.imposto)} />
          <Row label="Lucro real" value={fmtBRL(calc.lucro_real)} strong highlight />
        </div>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-3">
      <p className="mb-2 font-display text-xs font-semibold uppercase tracking-wide text-primary">{title}</p>
      {children}
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Row({ label, value, strong, highlight }: { label: string; value: string; strong?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-md px-1 py-0.5 ${highlight ? "bg-primary/10" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${strong ? "font-semibold text-primary" : ""}`}>{value}</span>
    </div>
  );
}

export function NumericInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [text, setText] = useState(String(value ?? 0));
  useEffect(() => {
    setText(String(value ?? 0));
  }, [value]);
  return (
    <Input
      inputMode="decimal"
      className="h-11 font-mono"
      value={text}
      onChange={(e) => {
        const raw = e.target.value.replace(",", ".");
        setText(e.target.value);
        const n = Number(raw);
        if (!Number.isNaN(n)) onChange(n);
      }}
      onFocus={(e) => e.target.select()}
    />
  );
}

export { Route as _R };
