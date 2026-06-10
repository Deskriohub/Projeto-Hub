import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { logAudit } from "@/lib/auditLog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { Search, Users, Camera, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { AppRole } from "@/config/permissions";
import { ROLE_LABELS } from "@/config/permissions";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const Usuarios = () => {
  const { user } = useAuth();
  const { fullName } = useProfile();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetUserRef = useRef<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const [{ data, error }, { data: profiles }] = await Promise.all([
      supabase.rpc("get_users_with_emails"),
      supabase.from("profiles").select("id, avatar_url"),
    ]);

    if (error) {
      toast({ title: "Erro ao carregar usuários", variant: "destructive" });
      setLoading(false);
      return;
    }

    const avatarMap: Record<string, string | null> = {};
    (profiles as any[] || []).forEach((p) => { avatarMap[p.id] = p.avatar_url ?? null; });

    const mapped: UserProfile[] = (data || []).map((p: any) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      avatar_url: avatarMap[p.id] ?? null,
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
    const alvo = users.find((u) => u.id === userId);
    const roleAntes = alvo ? (ROLE_LABELS[alvo.role] ?? alvo.role) : "—";

    const { error } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: newRole }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
      return;
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
    if (user) {
      logAudit(user.id, fullName, `Alterou o perfil de ${alvo?.full_name || alvo?.email || "usuário"}`, "Usuários", {
        antes: `Perfil: ${roleAntes}`,
        depois: `Perfil: ${ROLE_LABELS[newRole] ?? newRole}`,
      });
    }
    toast({ title: "Perfil atualizado com sucesso" });
  };

  const triggerUpload = (userId: string) => {
    targetUserRef.current = userId;
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const userId = targetUserRef.current;
    e.target.value = ""; // permite reenviar o mesmo arquivo depois
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Use uma imagem menor que 5MB.", variant: "destructive" });
      return;
    }

    setUploadingId(userId);
    const ext = file.name.split(".").pop();
    const path = `${userId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
      setUploadingId(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", userId);

    setUploadingId(null);

    if (profileError) {
      toast({ title: "Erro ao salvar foto", description: profileError.message, variant: "destructive" });
      return;
    }

    const alvo = users.find((u) => u.id === userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, avatar_url: publicUrl } : u)));
    if (user) logAudit(user.id, fullName, `Atualizou a foto de ${alvo?.full_name || alvo?.email || "usuário"}`, "Usuários", {
      antes: alvo?.avatar_url ? "Tinha uma foto" : "Sem foto",
      depois: "Nova foto enviada",
    });
    toast({ title: "Foto atualizada" });
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

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />

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
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Criado em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isProtected = u.email === "admin@deskrio.com.br";
                const isUploading = uploadingId === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <button
                        onClick={() => triggerUpload(u.id)}
                        disabled={isUploading}
                        className="relative group rounded-full"
                        title="Clique para alterar a foto"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={u.avatar_url ?? ""} alt={u.full_name || ""} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {getInitials(u.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isUploading
                            ? <Loader2 className="h-4 w-4 text-white animate-spin" />
                            : <Camera className="h-4 w-4 text-white" />}
                        </span>
                      </button>
                    </TableCell>
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
