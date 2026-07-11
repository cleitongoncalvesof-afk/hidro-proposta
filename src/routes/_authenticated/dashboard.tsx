import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, LogOut, Search } from "lucide-react";
import { useState, useMemo } from "react";
import { fmtBRL, fmtDate, padProposta } from "@/lib/format";
import { calcular } from "@/lib/calc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

const statusColor: Record<string, string> = {
  rascunho: "bg-muted text-muted-foreground",
  enviado: "bg-secondary text-secondary-foreground",
  aprovado: "bg-primary text-primary-foreground",
  recusado: "bg-destructive text-destructive-foreground",
};
const tipoLabel: Record<string, string> = {
  grama_liquida: "Grama Líquida",
  mix_sementes: "Mix de Sementes",
};

function Dashboard() {
  const nav = useNavigate();
  const [q, setQ] = useState("");

  const orcamentos = useQuery({
    queryKey: ["orcamentos-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*, cliente:clientes(nome), itens:orcamento_itens(quantidade_m2, custo_insumo_m2)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const items = orcamentos.data ?? [];

  const kpis = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthly = items.filter((o) => o.created_at >= monthStart);
    const enviadosMes = monthly.filter((o) =>
      ["enviado", "aprovado", "recusado"].includes(o.status),
    );
    const aprovados = enviadosMes.filter((o) => o.status === "aprovado");
    const withValor = items
      .filter((o) => ["enviado", "aprovado"].includes(o.status))
      .map((o) => {
        const c = calcular({
          itens: (o.itens ?? []).map((i: { quantidade_m2: number; custo_insumo_m2: number }) => ({
            quantidade_m2: Number(i.quantidade_m2),
            custo_insumo_m2: Number(i.custo_insumo_m2),
          })),
          frete: Number(o.frete),
          mao_obra_diaria: Number(o.mao_obra_diaria),
          mao_obra_dias: Number(o.mao_obra_dias),
          alimentacao_diaria: Number(o.alimentacao_diaria),
          alimentacao_dias: Number(o.alimentacao_dias),
          hospedagem_diaria: Number(o.hospedagem_diaria),
          hospedagem_qtd: Number(o.hospedagem_qtd),
          combustivel_equipamento: Number(o.combustivel_equipamento),
          combustivel_km_l: Number(o.combustivel_km_l),
          combustivel_r_l: Number(o.combustivel_r_l),
          combustivel_distancia_km: Number(o.combustivel_distancia_km),
          outras_despesas: Number(o.outras_despesas),
          mobilizacoes_extras: Number(o.mobilizacoes_extras),
          valor_mobilizacao_adicional: Number(o.valor_mobilizacao_adicional),
          margem: Number(o.margem),
          aliquota: Number(o.aliquota),
        });
        return c.faturamento_bruto;
      });
    const ticketMedio =
      withValor.length > 0 ? withValor.reduce((a, b) => a + b, 0) / withValor.length : 0;
    const taxaAprov =
      enviadosMes.length > 0 ? (aprovados.length / enviadosMes.length) * 100 : 0;
    return {
      enviadosMes: enviadosMes.length,
      taxaAprov,
      ticketMedio,
    };
  }, [items]);

  const filtered = items.filter((o) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      o.cliente?.nome?.toLowerCase().includes(s) ||
      tipoLabel[o.proposta_tipo]?.toLowerCase().includes(s) ||
      o.status.includes(s) ||
      String(o.numero).includes(s)
    );
  });

  async function logout() {
    await supabase.auth.signOut();
    nav({ to: "/auth" });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">Início</h1>
          <p className="text-xs text-muted-foreground">Painel de orçamentos</p>
        </div>
        <button
          onClick={logout}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      <Button
        onClick={() => nav({ to: "/novo" })}
        className="h-16 w-full text-base font-semibold shadow-md"
        size="lg"
      >
        <Plus className="mr-2 h-5 w-5" />
        Novo orçamento
      </Button>

      <div className="grid grid-cols-3 gap-2">
        <Kpi title="Enviados/mês" value={String(kpis.enviadosMes)} />
        <Kpi title="Aprovação" value={`${kpis.taxaAprov.toFixed(0)}%`} />
        <Kpi title="Ticket médio" value={fmtBRL(kpis.ticketMedio)} small />
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente, tipo, status..."
          className="h-11 pl-9"
        />
      </div>

      <div className="space-y-2">
        {orcamentos.isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!orcamentos.isLoading && filtered.length === 0 && (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum orçamento ainda. Toque em <span className="font-semibold">Novo orçamento</span> para começar.
            </p>
          </Card>
        )}
        {filtered.map((o) => (
          <Link
            key={o.id}
            to="/orcamentos/$id"
            params={{ id: o.id }}
            className="block"
          >
            <Card className="p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {o.cliente?.nome ?? "Sem cliente"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    #{padProposta(o.numero)} · {tipoLabel[o.proposta_tipo]} · {fmtDate(o.created_at)}
                  </p>
                </div>
                <Badge className={statusColor[o.status]}>{o.status}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Kpi({ title, value, small }: { title: string; value: string; small?: boolean }) {
  return (
    <Card className="p-2.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{title}</p>
      <p className={`font-mono font-semibold text-primary ${small ? "text-sm" : "text-lg"}`}>
        {value}
      </p>
    </Card>
  );
}
