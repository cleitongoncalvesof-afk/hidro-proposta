import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { KeyRound, Lock, Plus, Unlock } from "lucide-react";
import { useCurrentPerfil } from "@/hooks/use-perfil";
import {
  atualizarRoleUsuario,
  atualizarStatusUsuario,
  criarUsuario,
  listarUsuarios,
  redefinirSenhaUsuario,
} from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  const perfil = useCurrentPerfil();
  const nav = useNavigate();

  useEffect(() => {
    if (perfil.data && perfil.data.role !== "admin") {
      nav({ to: "/dashboard" });
    }
  }, [perfil.data, nav]);

  const qc = useQueryClient();
  const listar = useServerFn(listarUsuarios);
  const criar = useServerFn(criarUsuario);
  const atStatus = useServerFn(atualizarStatusUsuario);
  const atRole = useServerFn(atualizarRoleUsuario);
  const redefSenha = useServerFn(redefinirSenhaUsuario);

  const usuarios = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listar(),
    enabled: perfil.data?.role === "admin",
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["usuarios"] });

  const [novoOpen, setNovoOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [role, setRole] = useState<"admin" | "usuario">("usuario");

  const criarMut = useMutation({
    mutationFn: () => criar({ data: { nome, email, senha, role } }),
    onSuccess: () => {
      toast.success("Usuário criado");
      setNovoOpen(false);
      setNome("");
      setEmail("");
      setSenha("");
      setRole("usuario");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: (v: { user_id: string; status: "ativo" | "bloqueado" }) =>
      atStatus({ data: v }),
    onSuccess: () => {
      toast.success("Status atualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleMut = useMutation({
    mutationFn: (v: { user_id: string; role: "admin" | "usuario" }) =>
      atRole({ data: v }),
    onSuccess: () => {
      toast.success("Perfil atualizado");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [resetOpen, setResetOpen] = useState<null | { user_id: string; email: string | null }>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const resetMut = useMutation({
    mutationFn: (v: { user_id: string; nova_senha: string }) => redefSenha({ data: v }),
    onSuccess: () => {
      toast.success("Senha redefinida");
      setResetOpen(null);
      setNovaSenha("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (perfil.isLoading || (perfil.data?.role === "admin" && usuarios.isLoading)) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }
  if (perfil.data?.role !== "admin") {
    return <p className="text-sm text-destructive">Acesso restrito.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-lg font-semibold">Usuários</h1>
        <Button size="sm" onClick={() => setNovoOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Novo
        </Button>
      </div>

      <div className="space-y-2">
        {(usuarios.data ?? []).map((u) => (
          <Card key={u.user_id} className="space-y-2 p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium">{u.nome || u.email}</p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={u.role === "admin" ? "default" : "secondary"}>
                  {u.role === "admin" ? "Admin" : "Usuário"}
                </Badge>
                <Badge variant={u.status === "ativo" ? "outline" : "destructive"}>
                  {u.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select
                value={u.role}
                onValueChange={(v) =>
                  roleMut.mutate({ user_id: u.user_id, role: v as "admin" | "usuario" })
                }
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>

              {u.status === "ativo" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => statusMut.mutate({ user_id: u.user_id, status: "bloqueado" })}
                >
                  <Lock className="mr-1 h-4 w-4" /> Bloquear
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => statusMut.mutate({ user_id: u.user_id, status: "ativo" })}
                >
                  <Unlock className="mr-1 h-4 w-4" /> Desbloquear
                </Button>
              )}
            </div>

            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() => setResetOpen({ user_id: u.user_id, email: u.email })}
            >
              <KeyRound className="mr-1 h-4 w-4" /> Redefinir senha
            </Button>
          </Card>
        ))}
        {(usuarios.data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum usuário cadastrado ainda.</p>
        )}
      </div>

      <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Senha inicial</Label>
              <Input
                type="text"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1"
                minLength={6}
              />
            </div>
            <div>
              <Label>Perfil</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "usuario")}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usuario">Usuário</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => criarMut.mutate()}
              disabled={criarMut.isPending || !nome || !email || senha.length < 6}
            >
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetOpen} onOpenChange={(o) => !o && setResetOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir senha</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{resetOpen?.email}</p>
          <div>
            <Label>Nova senha</Label>
            <Input
              type="text"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              className="mt-1"
              minLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                resetOpen &&
                resetMut.mutate({ user_id: resetOpen.user_id, nova_senha: novaSenha })
              }
              disabled={resetMut.isPending || novaSenha.length < 6}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
