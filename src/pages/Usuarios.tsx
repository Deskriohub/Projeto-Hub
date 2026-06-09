import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Search, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AppRole } from "@/config/permissions";
import { ROLE_LABELS } from "@/config/permissions";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role: AppRole;
}

const Usuarios = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_users_with_emails");

    if (error) {
      toast({ title: "Erro ao carregar usuários", variant: "destructive" });
      setLoading(false);
      return;
    }

    const mapped: UserProfile[] = (data || []).map((p: any) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      created_at: p.created_at,
      role: (p.role as AppRole) || "geral",
    }));
    mapped.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
    setUsers(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from("user_roles")
      .update({ role: newRole })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    toast({ title: "Perfil atualizado com sucesso" });
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (u.email || "").toLowerCase().includes(q) ||
      (u.full_name || "").toLowerCase().includes(q);
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as "all" | AppRole)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="geral">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isProtected = u.email === "admin@deskrio.com.br";
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.email || "—"}</TableCell>
                    <TableCell>
                      {isProtected ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <Select value={u.role} disabled>
                                  <SelectTrigger className="w-32 opacity-60 cursor-not-allowed">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>Perfil protegido</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Select
                          value={u.role}
                          onValueChange={(val) => updateRole(u.id, val as AppRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue>{ROLE_LABELS[u.role] ?? u.role}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="geral">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.created_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Usuarios;
