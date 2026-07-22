import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, UserPlus, ListChecks, Calculator, Share2, Check, Sprout } from "lucide-react";
import logoUrl from "@/assets/logo.svg";

const WHATSAPP_NUMERO = "5599992051019";
const waLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(msg)}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HIDRO - PROPOSTA — Orçamento de Hidrossemeadura em Minutos" },
      {
        name: "description",
        content:
          "Sistema para empresas de hidrossemeadura: cadastre o cliente, o preço calcula sozinho e a proposta em PDF vai pelo WhatsApp na hora.",
      },
      { property: "og:title", content: "HIDRO - PROPOSTA" },
      {
        property: "og:description",
        content:
          "Orçamento pronto em minutos, direto do celular. Feito para hidrossemeadura.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={logoUrl} alt="" className="h-8 w-8" />
            <span className="font-display text-base font-bold tracking-tight">HIDRO - PROPOSTA</span>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/auth">Entrar</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sprout className="h-3.5 w-3.5" /> Feito para hidrossemeadura
            </span>
            <h1 className="mt-4 font-display text-3xl font-black leading-tight sm:text-4xl md:text-5xl">
              Orçamento pronto em minutos, direto do celular.
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Cadastre o cliente, lance os itens e o sistema calcula o preço automaticamente com base
              na sua tabela de custo de insumos. A proposta em PDF já sai pronta para enviar pelo
              WhatsApp.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <a href={waLink("Olá! Vi o HIDRO - PROPOSTA e quero saber mais.")} target="_blank" rel="noopener">
                  <MessageCircle className="mr-2 h-5 w-5" /> Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
          <Card className="hidden rounded-2xl border-2 border-primary/20 p-6 shadow-lg md:block">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-primary"><Check className="h-4 w-4" /> Cliente cadastrado</div>
              <div className="flex items-center gap-2 text-primary"><Check className="h-4 w-4" /> 3.500 m² • VERDEPLAN</div>
              <div className="flex items-center gap-2 text-primary"><Check className="h-4 w-4" /> Custo, impostos e margem</div>
              <div className="rounded-lg bg-primary p-4 text-center text-primary-foreground">
                <p className="text-xs opacity-80">Valor da proposta</p>
                <p className="font-display text-2xl font-bold">R$ 17.500,00</p>
              </div>
              <p className="text-center text-xs text-muted-foreground">PDF gerado em segundos</p>
            </div>
          </Card>
        </div>
      </section>

      {/* Como funciona */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-12">
          <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">Como funciona</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: UserPlus, t: "Cadastre o cliente", d: "Dados e endereço em uma tela só." },
              { icon: ListChecks, t: "Lance os itens", d: "Áreas, tipos de aplicação e insumos." },
              { icon: Calculator, t: "O preço calcula sozinho", d: "Custo, impostos, margem e total." },
              { icon: Share2, t: "Envie pelo WhatsApp", d: "PDF pronto para compartilhar na hora." },
            ].map((s, i) => (
              <Card key={i} className="p-5">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-semibold">{i + 1}. {s.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Para quem é */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-6 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Para quem é</h2>
            <p className="mt-3 text-muted-foreground">
              Se você calcula orçamento em planilha e depois passa manualmente para o Word ou papel
              antes de mandar pro cliente, o HIDRO - PROPOSTA resolve isso.
            </p>
            <p className="mt-3 text-muted-foreground">
              Feito especialmente para empresas de <b>hidrossemeadura</b> que usam a planilha de
              custo da VERDETEC como referência — a estrutura de cálculo já vem pronta dentro do
              sistema.
            </p>
          </div>
          <Card className="bg-primary/5 p-6">
            <ul className="space-y-2 text-sm">
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Estrutura de custo VERDETEC embutida</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> VERDEPLAN, VERDEFLEX, VERDEMAX, HIDROMANTA e mais</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Combustível calculado por m²</li>
              <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Proposta comercial editável por empresa</li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Prova social */}
      <section className="border-y bg-muted/40">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Resultado real</p>
          <p className="mt-3 font-display text-2xl font-bold sm:text-3xl">
            "De 40 minutos para 3 minutos por orçamento."
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            [Espaço reservado para depoimento — nome e empresa a inserir]
          </p>
        </div>
      </section>

      {/* Plano */}
      <section className="mx-auto max-w-3xl px-4 py-12">
        <h2 className="text-center font-display text-2xl font-bold sm:text-3xl">Plano</h2>
        <Card className="mt-6 rounded-2xl border-2 border-primary p-6 shadow-lg">
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Assinatura mensal</p>
            <p className="mt-2 font-display text-4xl font-black">
              R$ [98,90]<span className="text-base font-medium text-muted-foreground">/mês</span>
            </p>
          </div>
          <ul className="mt-6 space-y-2 text-sm">
            {[
              "Cadastro de clientes ilimitado",
              "Cálculo automático de preço",
              "Geração de PDF da proposta",
              "Envio por WhatsApp",
              "Suporte",
            ].map((it) => (
              <li key={it} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {it}</li>
            ))}
          </ul>
          <Button asChild size="lg" className="mt-6 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
            <a
              href={waLink("Olá! Quero contratar o HIDRO - PROPOSTA. Como funciona o pagamento e a liberação do acesso?")}
              target="_blank"
              rel="noopener"
            >
              <MessageCircle className="mr-2 h-5 w-5" /> Quero contratar
            </a>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            O acesso é liberado manualmente pelo Admin após a confirmação do pagamento.
          </p>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-8 text-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">HIDRO - PROPOSTA</p>
              <p className="text-muted-foreground">
                Contato:{" "}
                <a className="underline" href={waLink("Olá!")} target="_blank" rel="noopener">
                  (99) 99205-1019
                </a>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Acesso liberado manualmente após a contratação. Não há cadastro automático.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
