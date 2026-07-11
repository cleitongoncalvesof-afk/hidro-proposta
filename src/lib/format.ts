const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});
const num = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const fmtBRL = (v: number) => brl.format(Number.isFinite(v) ? v : 0);
export const fmtNum = (v: number) => num.format(Number.isFinite(v) ? v : 0);
export const fmtPct = (v: number) => pct.format(Number.isFinite(v) ? v : 0);
export const fmtDate = (d: string | Date) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("pt-BR");
};
export const fmtDateTime = (d: string | Date) => {
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
};
export const padProposta = (n: number) => String(n).padStart(4, "0");
