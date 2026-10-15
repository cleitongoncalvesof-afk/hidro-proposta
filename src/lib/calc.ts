export type OrcamentoInput = {
  itens: { quantidade_m2: number; custo_insumo_m2: number }[];
  frete: number;
  mao_obra_diaria: number;
  mao_obra_dias: number;
  alimentacao_diaria: number;
  alimentacao_dias: number;
  hospedagem_diaria: number;
  hospedagem_qtd: number;
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

export type OrcamentoCalc = {
  custo_insumo_total: number;
  total_m2: number;
  mao_de_obra_total: number;
  alimentacao_total: number;
  hospedagem_total: number;
  combustivel_veiculo_total: number;
  mobilizacao_extra_total: number;
  custo_total: number;
  custo_por_m2: number;
  valor_por_m2: number;
  faturamento_bruto: number;
  lucro_bruto: number;
  imposto: number;
  lucro_real: number;
};

export function calcular(o: OrcamentoInput): OrcamentoCalc {
  const n = (v: number) => (Number.isFinite(v) ? v : 0);
  const custo_insumo_total = o.itens.reduce(
    (acc, it) => acc + n(it.quantidade_m2) * n(it.custo_insumo_m2),
    0,
  );
  const total_m2 = o.itens.reduce((acc, it) => acc + n(it.quantidade_m2), 0);
  const mao_de_obra_total = n(o.mao_obra_diaria) * n(o.mao_obra_dias);
  const alimentacao_total = n(o.alimentacao_diaria) * n(o.alimentacao_dias);
  const hospedagem_total = n(o.hospedagem_diaria) * n(o.hospedagem_qtd);
  const combustivel_veiculo_total =
    n(o.combustivel_km_l) > 0
      ? (n(o.combustivel_distancia_km) / n(o.combustivel_km_l)) * n(o.combustivel_r_l)
      : 0;
  const mobilizacao_extra_total =
    n(o.mobilizacoes_extras) * n(o.valor_mobilizacao_adicional);
  const custo_total =
    custo_insumo_total +
    n(o.frete) +
    mao_de_obra_total +
    alimentacao_total +
    hospedagem_total +
    n(o.combustivel_equipamento) +
    combustivel_veiculo_total +
    n(o.outras_despesas) +
    mobilizacao_extra_total;
  const custo_por_m2 = total_m2 > 0 ? custo_total / total_m2 : 0;
  const valor_por_m2 = custo_por_m2 * (1 + n(o.margem));
  const faturamento_bruto = valor_por_m2 * total_m2;
  const lucro_bruto = faturamento_bruto - custo_total;
  const imposto = faturamento_bruto * n(o.aliquota);
  const lucro_real = lucro_bruto - imposto;
  return {
    custo_insumo_total,
    total_m2,
    mao_de_obra_total,
    alimentacao_total,
    hospedagem_total,
    combustivel_veiculo_total,
    mobilizacao_extra_total,
    custo_total,
    custo_por_m2,
    valor_por_m2,
    faturamento_bruto,
    lucro_bruto,
    imposto,
    lucro_real,
  };
}

export type ServicoExtra = {
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
};

export function parseServicosExtras(v: unknown): ServicoExtra[] {
  if (!Array.isArray(v)) return [];
  return v.map((s: Record<string, unknown>) => ({
    descricao: String(s?.descricao ?? ""),
    unidade: String(s?.unidade ?? "UN"),
    quantidade: Number(s?.quantidade ?? 0) || 0,
    valor_unitario: Number(s?.valor_unitario ?? 0) || 0,
  }));
}

export function totalServicosExtras(s: ServicoExtra[] | undefined | null): number {
  return (s ?? []).reduce((a, x) => a + (Number(x.quantidade) || 0) * (Number(x.valor_unitario) || 0), 0);
}
