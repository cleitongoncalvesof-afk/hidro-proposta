import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { PropostaData } from "@/components/PropostaPreview";
import { fmtBRL, fmtDate, fmtNum, padProposta } from "@/lib/format";

const LOGO_URL = typeof window !== "undefined" ? `${window.location.origin}/icon-192.png` : "/icon-192.png";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#20241F", lineHeight: 1.35 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#8FA382", paddingBottom: 6, alignItems: "flex-start", gap: 8 },
  logoBox: { width: 54, height: 54, backgroundColor: "#1F3D2B", padding: 3, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  logoImg: { width: 48, height: 48 },
  headerCenter: { flex: 1 },
  headerRight: { width: 90, textAlign: "right", fontSize: 8 },
  bold: { fontFamily: "Helvetica-Bold" },
  title: { textAlign: "center", fontSize: 12, marginTop: 10, fontFamily: "Helvetica-Bold" },
  section: {
    marginTop: 10,
    backgroundColor: "#E8EEE3",
    paddingHorizontal: 6,
    paddingVertical: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: "#1F3D2B",
    textTransform: "uppercase",
  },
  p: { marginTop: 4 },
  grid2: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  cell: { width: "50%", paddingRight: 8, marginBottom: 2 },
  table: { marginTop: 6, borderWidth: 1, borderColor: "#8FA382" },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#8FA382" },
  th: { backgroundColor: "#E8EEE3", padding: 4, fontFamily: "Helvetica-Bold" },
  td: { padding: 4 },
  cItem: { width: "8%" },
  cDesc: { width: "42%" },
  cUn: { width: "8%" },
  cQtd: { width: "12%", textAlign: "right" },
  cVal: { width: "15%", textAlign: "right" },
  cTot: { width: "15%", textAlign: "right" },
  total: { marginTop: 6, textAlign: "right", fontSize: 12, fontFamily: "Helvetica-Bold" },
  signRow: { marginTop: 30, flexDirection: "row", gap: 20 },
  sign: { flex: 1, textAlign: "center", borderTopWidth: 1, borderColor: "#000", paddingTop: 4 },
});

function PropostaPDF({ data }: { data: PropostaData }) {
  const { empresa, template, cliente, calc, itens } = data;
  const dt = new Date(data.criado_em);
  const isMix = data.proposta_tipo === "mix_sementes";
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.logoBox}>
            <Image src={LOGO_URL} style={styles.logoImg} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.bold}>
              4G SERVIÇOS LTDA — RAZÃO SOCIAL: {empresa.razao_social}
            </Text>
            <Text>{empresa.endereco}</Text>
            <Text>CNPJ: {empresa.cnpj} — Fone: {empresa.telefone}</Text>
            <Text>E-mail: {empresa.email}</Text>
            <Text>WebSite: {empresa.site}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text>Página: 1</Text>
            <Text>Data: {fmtDate(dt)}</Text>
            <Text>Hora: {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</Text>
            <Text>Resp: {empresa.responsavel}</Text>
          </View>
        </View>

        <Text style={styles.title}>PROPOSTA COMERCIAL: {padProposta(data.numero)}</Text>

        <Text style={styles.p}>{template.texto_abertura}</Text>
        {isMix && data.obra_descricao ? (
          <Text style={[styles.p, styles.bold]}>OBRA: {data.obra_descricao}</Text>
        ) : null}

        <Text style={styles.section}>Dados do cliente e endereço de cobrança</Text>
        <View style={styles.grid2}>
          <Text style={styles.cell}><Text style={styles.bold}>Cliente: </Text>{cliente.nome}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>Telefone: </Text>{cliente.telefone || "—"}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>Contato: </Text>{cliente.contato || "—"}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>Bairro: </Text>{cliente.bairro || "—"}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>Endereço: </Text>{cliente.endereco || "—"}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>Município/UF: </Text>{cliente.municipio_uf || "—"}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>CEP: </Text>{cliente.cep || "—"}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>CNPJ/CPF: </Text>{cliente.cnpj_cpf || "—"}</Text>
          <Text style={styles.cell}><Text style={styles.bold}>Insc. Estadual: </Text>{cliente.inscricao_estadual || "—"}</Text>
        </View>

        <Text style={styles.section}>Detalhes do orçamento</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, styles.cItem]}>Item</Text>
            <Text style={[styles.th, styles.cDesc]}>Descrição</Text>
            <Text style={[styles.th, styles.cUn]}>Un</Text>
            <Text style={[styles.th, styles.cQtd]}>Qtdade</Text>
            <Text style={[styles.th, styles.cVal]}>Valor</Text>
            <Text style={[styles.th, styles.cTot]}>Total</Text>
          </View>
          {itens.map((it, i) => (
            <View style={styles.tr} key={i}>
              <Text style={[styles.td, styles.cItem]}>{String(i + 1).padStart(2, "0")}</Text>
              <Text style={[styles.td, styles.cDesc]}>{it.descricao}</Text>
              <Text style={[styles.td, styles.cUn]}>M²</Text>
              <Text style={[styles.td, styles.cQtd]}>{fmtNum(it.quantidade_m2)}</Text>
              <Text style={[styles.td, styles.cVal]}>{fmtBRL(calc.valor_por_m2)}</Text>
              <Text style={[styles.td, styles.cTot]}>{fmtBRL(calc.valor_por_m2 * it.quantidade_m2)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.total}>Valor Total Geral: {fmtBRL(calc.faturamento_bruto)}</Text>

        <Text style={styles.section}>Condição de pagamento e parcelas</Text>
        <Text style={styles.p}>{data.condicoes_pagamento}</Text>
        <Text style={styles.p}>{empresa.texto_clausulas_cobranca}</Text>
        <Text style={styles.p}>
          A {empresa.nome_fantasia} possui conta bancária para depósitos: {empresa.dados_bancarios} — Esta proposta é válida por {template.validade_dias} ({template.validade_dias === 10 ? "dez" : "trinta"}) dias e depende de aprovação financeira / gerência para a sua validade.
        </Text>

        {isMix && template.usa_mobilizacao ? (
          <>
            <Text style={styles.section}>Descritivo do orçamento</Text>
            <Text style={[styles.p, styles.bold]}>MOBILIZAÇÃO:</Text>
            <Text style={styles.p}>
              A presente PROPOSTA considera que o quantitativo total será executado em 1 (uma) MOBILIZAÇÃO. Caso necessite de MOBILIZAÇÃO ADICIONAL para execução dos serviços, será cobrado o valor de {fmtBRL(data.valor_mobilizacao_adicional)} devido ao deslocamento do equipamento e equipes.
              {data.mobilizacoes_extras > 0
                ? ` Foram consideradas nesta proposta ${data.mobilizacoes_extras} mobilização(ões) adicional(is).`
                : ""}
            </Text>
          </>
        ) : null}

        <Text style={styles.section}>Responsabilidade da contratante</Text>
        <Text style={styles.p}>{template.texto_responsabilidade_contratante}</Text>

        <Text style={styles.section}>Termos</Text>
        <Text style={styles.p}>{template.texto_termos}</Text>

        <Text style={styles.section}>Termo de garantia</Text>
        <Text style={styles.p}>{template.texto_garantia}</Text>

        <Text style={styles.p}>
          {template.despedida}, {empresa.cidade_assinatura} — DATA {fmtDate(dt)}
        </Text>

        <View style={styles.signRow}>
          <View style={styles.sign}>
            <Text>ASSINATURA</Text>
            <Text style={styles.bold}>NOME: {empresa.responsavel}</Text>
            <Text>{empresa.nome_fantasia}</Text>
          </View>
          <View style={styles.sign}>
            <Text>ASSINATURA</Text>
            <Text style={styles.bold}>NOME: {cliente.nome}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function gerarPropostaPDF(data: PropostaData): Promise<Blob> {
  return await pdf(<PropostaPDF data={data} />).toBlob();
}

export async function baixarPropostaPDF(data: PropostaData) {
  const blob = await gerarPropostaPDF(data);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Proposta-${padProposta(data.numero)}-${data.cliente.nome.replace(/\s+/g, "_")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
