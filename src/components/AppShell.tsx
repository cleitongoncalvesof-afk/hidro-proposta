import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Plus, Settings } from "lucide-react";
import type { ReactNode } from "react";
import logoUrl from "@/assets/logo.svg";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-primary text-primary-foreground">
        <div className="mx-auto flex h-14 max-w-[480px] items-center gap-3 px-4">
          <img src={logoUrl} alt="4G AGROVERDE" className="h-8 w-8 rounded-sm bg-primary-foreground/90 p-0.5" />
          <div className="leading-tight">
            <p className="font-display text-sm font-semibold">4G AGROVERDE</p>
            <p className="text-[10px] opacity-80">Orçamentos & Propostas</p>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[480px] flex-1 px-4 py-4 pb-24">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t bg-card">
        <div className="mx-auto grid max-w-[480px] grid-cols-3">
          <NavItem to="/dashboard" label="Início" icon={<Home className="h-5 w-5" />} active={pathname === "/dashboard" || pathname === "/"} />
          <NavItem to="/novo" label="Novo" icon={<Plus className="h-5 w-5" />} active={pathname.startsWith("/novo")} highlight />
          <NavItem to="/configuracoes" label="Ajustes" icon={<Settings className="h-5 w-5" />} active={pathname.startsWith("/configuracoes")} />
        </div>
      </nav>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon,
  active,
  highlight,
}: {
  to: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      } ${highlight ? "relative" : ""}`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          highlight
            ? "bg-accent text-accent-foreground shadow"
            : active
              ? "bg-primary/10 text-primary"
              : ""
        }`}
      >
        {icon}
      </span>
      {label}
    </Link>
  );
}
