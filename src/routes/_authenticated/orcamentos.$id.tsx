import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { calcular } from "@/lib/calc";
import { fmtBRL, fmtDate, padProposta } from "@/lib/format";
import { PropostaPreview, type PropostaData } from "@/components/PropostaPreview";
import { baixarPropostaPDF, gerarPropostaPDF, nomeArquivoProposta } from "@/lib/pdf";
import { toast } from "sonner";
import { Copy, Download, MessageCircle } from "lucide-react";
import { useState } from "react";


export const Route = createFileRoute("/_authenticated/orcamentos/$id")({
  component: OrcamentoDetalhe,
});

function OrcamentoDetalhe() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [sharing, setSharing] = useState(false);


  const q = useQuery({
    queryKey: ["orcamento", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*, cliente:clientes(*), itens:orcamento_itens(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const empresa = useQuery({
    queryKey: ["empresa"],
    queryFn: async () => (await supabase.from("empresa_config").select("*").maybeSingle()).data,
  });
  const template = useQuery({
    queryKey: ["template", q.data?.proposta_tipo],
    enabled: !!q.data,
    queryFn: async () =>
      (await supabase.from("proposta_templates").select("*").eq("tipo", q.data!.proposta_tipo).single()).data,
  });

  const changeStatus = useMutation({
    mutationFn: async (status: "rascunho" | "enviado" | "aprovado" | "recusado") => {
      const { error } = await supabase.from("orcamentos").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orcamento", id] });
      qc.invalidateQueries({ queryKey: ["orcamentos-dashboard"] });
      toast.success("Status atualizado");
    },
  });

  const duplicar = useMutation({
    mutationFn: async () => {
      if (!q.data) throw new Error("");
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user!.id;
      const { data: numData } = await supabase.rpc("next_orcamento_numero", { p_user_id: user_id });
      const { id: _id, created_at, updated_at, numero, pdf_url, ...rest } = q.data;
      void pdf_url;
      const { itens, cliente, ...restNoRel } = rest as typeof rest & { itens: unknown; cliente: unknown };

      const { data: novo, error } = await supabase
        .from("orcamentos")
        .insert({ ...restNoRel, numero: numData as number, status: "rascunho" })
        .select()
        .single();
      if (error) throw error;
      const itensArr = q.data.itens as { descricao: string; quantidade_m2: number; custo_insumo_m2: number; tipo_aplicacao_id: string | null; ordem: number }[];
      await supabase.from("orcamento_itens").insert(
        itensArr.map((it) => ({
          orcamento_id: novo.id,
          user_id,
          descricao: it.descricao,
          quantidade_m2: it.quantidade_m2,
          custo_insumo_m2: it.custo_insumo_m2,
          tipo_aplicacao_id: it.tipo_aplicacao_id,
          ordem: it.ordem,
        })),
      );
      return novo.id;
    },
    onSuccess: (novoId) => {
      qc.invalidateQueries({ queryKey: ["orcamentos-dashboard"] });
      toast.success("Orçamento duplicado");
      nav({ to: "/orcamentos/$id", params: { id: novoId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading || empresa.isLoading || template.isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;
  if (!q.data || !empresa.data || !template.data) return <p className="text-sm text-destructive">Não encontrado.</p>;

  const o = q.data;
  const calc = calcular({
    itens: (o.itens ?? []).map((i) => ({ quantidade_m2: Number(i.quantidade_m2), custo_insumo_m2: Number(i.custo_insumo_m2) })),
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

  const propostaData: PropostaData = {
    empresa: empresa.data,
    template: template.data,
    cliente: o.cliente!,
    numero: o.numero,
    proposta_tipo: o.proposta_tipo,
    obra_descricao: o.obra_descricao,
    itens: (o.itens ?? []).sort((a, b) => a.ordem - b.ordem).map((it) => ({
      descricao: it.descricao,
      quantidade_m2: Number(it.quantidade_m2),
      custo_insumo_m2: Number(it.custo_insumo_m2),
    })),
    mobilizacoes_extras: o.mobilizacoes_extras,
    valor_mobilizacao_adicional: Number(o.valor_mobilizacao_adicional),
    condicoes_pagamento: o.condicoes_pagamento_customizadas || empresa.data.texto_condicoes_pagamento_padrao,
    calc,
    criado_em: o.created_at,
  };

  async function enviarWhatsapp() {

    if (sharing) return;
    setSharing(true);
    try {
      const tipoNome = o.proposta_tipo === "grama_liquida" ? "Grama Líquida" : "Mix de Sementes / Hidromanta";
      const totalTxt = fmtBRL(calc.faturamento_bruto);
      const numeroTxt = padProposta(o.numero);
      const nomeCli = o.cliente?.nome ?? "";
      const tel = (o.cliente?.telefone ?? "").replace(/\D/g, "");

      const blob = await gerarPropostaPDF(propostaData);
      const fileName = nomeArquivoProposta(propostaData);
      const file = new File([blob], fileName, { type: "application/pdf" });

      // 1) Tenta Web Share API com arquivo (Android Chrome, iOS Safari 16.4+)
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files?: File[]; text?: string; title?: string }) => Promise<void>;
      };
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        try {
          await nav.share({
            files: [file],
            title: `Proposta ${numeroTxt}`,
            text: `Olá ${nomeCli}, segue a proposta comercial nº ${numeroTxt} — ${tipoNome} — Valor total: ${totalTxt}.`,
          });
          setSharing(false);
          return;
        } catch (err) {
          if ((err as DOMException)?.name === "AbortError") {
            setSharing(false);
            return;
          }
          // cai no fallback abaixo
        }
      }

      // 2) Fallback: upload no Storage → signed URL → wa.me com o link
      const { data: userData } = await supabase.auth.getUser();
      const user_id = userData.user!.id;
      const path = `${user_id}/${numeroTxt}-${Date.now()}.pdf`;
      const up = await supabase.storage
        .from("propostas-pdf")
        .upload(path, blob, { contentType: "application/pdf", upsert: true });
      if (up.error) throw up.error;
      const signed = await supabase.storage
        .from("propostas-pdf")
        .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 dias
      if (signed.error || !signed.data?.signedUrl) throw signed.error ?? new Error("Sem URL");
      const link = signed.data.signedUrl;
      await supabase.from("orcamentos").update({ pdf_url: link }).eq("id", id);

      const msg = `Olá ${nomeCli}, segue a proposta comercial nº ${numeroTxt} — ${tipoNome} — Valor total: ${totalTxt}.\n\nBaixe o PDF: ${link}`;
      const url = tel
        ? `https://wa.me/55${tel}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
    } catch (e) {
      toast.error((e as Error).message || "Falha ao compartilhar");
    } finally {
      setSharing(false);
    }
  }


  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Proposta {padProposta(o.numero)}</p>
          <h1 className="font-display text-lg font-semibold">{o.cliente?.nome}</h1>
          <p className="text-xs text-muted-foreground">
            {o.proposta_tipo === "grama_liquida" ? "Grama Líquida" : "Mix de Sementes"} · {fmtDate(o.created_at)}
          </p>
        </div>
        <Badge>{o.status}</Badge>
      </div>

      <Card className="p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono text-lg font-semibold text-primary">{fmtBRL(calc.faturamento_bruto)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Lucro real</span>
          <span className="font-mono">{fmtBRL(calc.lucro_real)}</span>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => baixarPropostaPDF(propostaData)}>
          <Download className="mr-1 h-4 w-4" /> Baixar PDF
        </Button>
        <Button variant="secondary" onClick={enviarWhatsapp} disabled={sharing}>
          <MessageCircle className="mr-1 h-4 w-4" /> {sharing ? "Preparando..." : "WhatsApp"}
        </Button>

        <Button variant="outline" onClick={() => duplicar.mutate()} disabled={duplicar.isPending}>
          <Copy className="mr-1 h-4 w-4" /> Duplicar
        </Button>
        <Select value={o.status} onValueChange={(v) => changeStatus.mutate(v as "rascunho" | "enviado" | "aprovado" | "recusado")}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="aprovado">Aprovado</SelectItem>
            <SelectItem value="recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PropostaPreview data={propostaData} />
    </div>
  );
}
