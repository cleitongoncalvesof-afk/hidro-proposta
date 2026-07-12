import type { OrcamentoCalc } from "@/lib/calc";
import { fmtBRL, fmtDate, fmtNum, padProposta } from "@/lib/format";
import logoUrl from "@/assets/logo.svg";

export type EmpresaConfig = {
  razao_social: string;
  nome_fantasia: string;
  endereco: string;
  cnpj: string;
  telefone: string;
  email: string;
  site: string;
  dados_bancarios: string;
  responsavel: string;
  cidade_assinatura: string;
  texto_condicoes_pagamento_padrao: string;
  texto_clausulas_cobranca: string;
};

export type PropostaTemplate = {
  tipo: "grama_liquida" | "mix_sementes";
  texto_abertura: string;
  usa_campo_obra: boolean;
  usa_mobilizacao: boolean;
  valor_mobilizacao_adicional_padrao: number;
  texto_responsabilidade_contratante: string;
  texto_termos: string;
  texto_garantia: string;
  validade_dias: number;
  despedida: string;
};

export type Cliente = {
  nome: string;
  contato?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  municipio_uf?: string | null;
  cep?: string | null;
  cnpj_cpf?: string | null;
  inscricao_estadual?: string | null;
};

export type PropostaData = {
  empresa: EmpresaConfig;
  template: PropostaTemplate;
  cliente: Cliente;
  numero: number;
  proposta_tipo: "grama_liquida" | "mix_sementes";
  obra_descricao?: string | null;
  itens: { descricao: string; quantidade_m2: number; custo_insumo_m2: number }[];
  mobilizacoes_extras: number;
  valor_mobilizacao_adicional: number;
  condicoes_pagamento: string;
  calc: OrcamentoCalc;
  criado_em: string | Date;
};

export function PropostaPreview({ data }: { data: PropostaData }) {
  const { empresa, template, cliente, calc, itens } = data;
  const dt = new Date(data.criado_em);
  const isMix = data.proposta_tipo === "mix_sementes";

  return (
    <div className="rounded-lg border bg-white p-4 text-[10px] leading-snug text-black shadow-sm">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3 border-b pb-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-[#1F3D2B] p-1">
          <img src={logoUrl} alt="" className="h-full w-full object-contain" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">4G SERVIÇOS LTDA — RAZÃO SOCIAL: {empresa.razao_social}</p>
          <p>{empresa.endereco}</p>
          <p>CNPJ: {empresa.cnpj} — Fone: {empresa.telefone}</p>
          <p>E-mail: {empresa.email}</p>
          <p>WebSite: {empresa.site}</p>
        </div>
        <div className="shrink-0 text-right text-[9px]">
          <p>Página: 1</p>
          <p>Data: {fmtDate(dt)}</p>
          <p>Hora: {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
          <p>Resp: {empresa.responsavel}</p>
        </div>
      </div>

      <h2 className="mt-3 text-center font-display text-sm font-bold uppercase">
        PROPOSTA COMERCIAL: {padProposta(data.numero)}
      </h2>

      <p className="mt-3 whitespace-pre-line">{template.texto_abertura}</p>

      {isMix && data.obra_descricao && (
        <p className="mt-2 font-semibold">OBRA: {data.obra_descricao}</p>
      )}

      <h3 className="mt-4 border-y bg-primary/10 px-2 py-1 font-display text-[11px] font-bold uppercase">
        Dados do cliente e endereço de cobrança
      </h3>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <p><b>Cliente:</b> {cliente.nome}</p>
        <p><b>Telefone:</b> {cliente.telefone || "—"}</p>
        <p><b>Contato:</b> {cliente.contato || "—"}</p>
        <p><b>Bairro:</b> {cliente.bairro || "—"}</p>
        <p><b>Endereço:</b> {cliente.endereco || "—"}</p>
        <p><b>Município/UF:</b> {cliente.municipio_uf || "—"}</p>
        <p><b>CEP:</b> {cliente.cep || "—"}</p>
        <p><b>CNPJ/CPF:</b> {cliente.cnpj_cpf || "—"}</p>
        <p><b>Insc. Estadual:</b> {cliente.inscricao_estadual || "—"}</p>
      </div>

      <h3 className="mt-4 border-y bg-primary/10 px-2 py-1 font-display text-[11px] font-bold uppercase">
        Detalhes do orçamento
      </h3>
      <table className="mt-2 w-full border-collapse text-[9px]">
        <thead>
          <tr className="bg-muted/70 text-left">
            <th className="border px-1 py-1">Item</th>
            <th className="border px-1 py-1">Descrição</th>
            <th className="border px-1 py-1">Un</th>
            <th className="border px-1 py-1 text-right">Qtdade</th>
            <th className="border px-1 py-1 text-right">Valor</th>
            <th className="border px-1 py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((it, i) => (
            <tr key={i}>
              <td className="border px-1 py-1">{String(i + 1).padStart(2, "0")}</td>
              <td className="border px-1 py-1">{it.descricao}</td>
              <td className="border px-1 py-1">M²</td>
              <td className="border px-1 py-1 text-right font-mono">{fmtNum(it.quantidade_m2)}</td>
              <td className="border px-1 py-1 text-right font-mono">{fmtBRL(calc.valor_por_m2)}</td>
              <td className="border px-1 py-1 text-right font-mono">
                {fmtBRL(calc.valor_por_m2 * it.quantidade_m2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-right font-display text-sm font-bold">
        Valor Total Geral: {fmtBRL(calc.faturamento_bruto)}
      </p>

      <h3 className="mt-4 border-y bg-primary/10 px-2 py-1 font-display text-[11px] font-bold uppercase">
        Condição de pagamento e parcelas
      </h3>
      <p className="mt-2 whitespace-pre-line">{data.condicoes_pagamento}</p>
      <p className="mt-2 whitespace-pre-line">{empresa.texto_clausulas_cobranca}</p>
      <p className="mt-2">
        A {empresa.nome_fantasia} possui conta bancária para depósitos: {empresa.dados_bancarios} — Esta proposta é válida por {template.validade_dias} ({template.validade_dias === 10 ? "dez" : "trinta"}) dias e depende de aprovação financeira / gerência para a sua validade.
      </p>

      {isMix && template.usa_mobilizacao && (
        <>
          <h3 className="mt-4 border-y bg-primary/10 px-2 py-1 font-display text-[11px] font-bold uppercase">
            Descritivo do orçamento
          </h3>
          <p className="mt-2 font-semibold">MOBILIZAÇÃO:</p>
          <p>
            A presente PROPOSTA considera que o quantitativo total será executado em 1 (uma)
            MOBILIZAÇÃO. Caso necessite de MOBILIZAÇÃO ADICIONAL para execução dos serviços,
            será cobrado o valor de {fmtBRL(data.valor_mobilizacao_adicional)} devido ao
            deslocamento do equipamento e equipes.
            {data.mobilizacoes_extras > 0 && (
              <> Foram consideradas nesta proposta <b>{data.mobilizacoes_extras}</b> mobilização(ões) adicional(is).</>
            )}
          </p>
        </>
      )}

      <h3 className="mt-4 border-y bg-primary/10 px-2 py-1 font-display text-[11px] font-bold uppercase">
        Responsabilidade da contratante
      </h3>
      <p className="mt-2 whitespace-pre-line">{template.texto_responsabilidade_contratante}</p>

      <h3 className="mt-4 border-y bg-primary/10 px-2 py-1 font-display text-[11px] font-bold uppercase">
        Termos
      </h3>
      <p className="mt-2 whitespace-pre-line">{template.texto_termos}</p>

      <h3 className="mt-4 border-y bg-primary/10 px-2 py-1 font-display text-[11px] font-bold uppercase">
        Termo de garantia
      </h3>
      <p className="mt-2 whitespace-pre-line">{template.texto_garantia}</p>

      <p className="mt-6">
        {template.despedida}, {empresa.cidade_assinatura} — DATA {fmtDate(dt)}
      </p>
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="border-t pt-1">ASSINATURA</div>
          <p className="mt-1"><b>NOME:</b> {empresa.responsavel}</p>
          <p>{empresa.nome_fantasia}</p>
        </div>
        <div className="text-center">
          <div className="border-t pt-1">ASSINATURA</div>
          <p className="mt-1"><b>NOME:</b> {cliente.nome}</p>
        </div>
      </div>
      <p className="mt-4 text-center text-[9px]">
        PROPOSTA COMERCIAL: {padProposta(data.numero)}
      </p>
    </div>
  );
}
