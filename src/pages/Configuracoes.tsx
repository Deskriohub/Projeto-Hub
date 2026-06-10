import { useState, useEffect, useRef } from "react";
import { Settings, Eye, EyeOff, KeyRound, Bot, Camera, ShieldCheck, RefreshCw, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/auditLog";
import { toast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", gestor: "Admin", geral: "Usuário" };
const MIN_PASSWORD = 6;

interface AuditEntry {
  id: string;
  user_nome: string | null;
  acao: string;
  modulo: string;
  detalhes: string | null;
  created_at: string;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MODULE_COLORS: Record<string, string> = {
  "Feedbacks":   "bg-purple-100 text-purple-700",
  "Sugestões":   "bg-yellow-100 text-yellow-700",
  "Calendário":  "bg-blue-100 text-blue-700",
  "Avisos":      "bg-orange-100 text-orange-700",
  "One-on-One":  "bg-green-100 text-green-700",
  "Perfil":      "bg-pink-100 text-pink-700",
};

function AuditoriaLog() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("auditoria")
      .select("id, user_nome, acao, modulo, detalhes, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setEntries((data || []) as AuditEntry[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">Últimas 100 ações realizadas na plataforma.</p>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum registro ainda. Ações na plataforma serão registradas aqui.</p>
      ) : (
        <ScrollArea className="h-80 -mx-1 px-1">
          <div className="space-y-1.5">
            {entries.map((e) => {
              const modColor = MODULE_COLORS[e.modulo] ?? "bg-gray-100 text-gray-700";
              return (
                <div key={e.id} className="flex items-start gap-3 p-2.5 rounded-md bg-muted/40 border border-border/50">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 min-w-[110px]">
                    {formatDateTime(e.created_at)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-medium text-foreground">{e.user_nome || "—"}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${modColor}`}>
                        {e.modulo}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.acao}</p>
                    {e.detalhes && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">{e.detalhes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export default function Configuracoes() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const { fullName, initials, avatarUrl } = useProfile();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [iaContexto, setIaContexto] = useState("");
  const [savingIA, setSavingIA] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(avatarUrl);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setCurrentAvatar(avatarUrl); }, [avatarUrl]);

  useEffect(() => {
    if (role !== "admin") return;
    supabase.from("configuracoes").select("valor").eq("id", "ia_contexto").maybeSingle()
      .then(({ data }) => setIaContexto(data?.valor ?? ""));
  }, [role]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Use uma imagem menor que 5MB.", variant: "destructive" });
      return;
    }

    setUploadingPhoto(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro ao enviar foto", description: uploadError.message, variant: "destructive" });
      setUploadingPhoto(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", user.id);

    setUploadingPhoto(false);

    if (profileError) {
      toast({ title: "Erro ao salvar foto", description: profileError.message, variant: "destructive" });
    } else {
      setCurrentAvatar(publicUrl);
      logAudit(user.id, fullName, "Atualizou foto de perfil", "Perfil");
      toast({ title: "Foto atualizada" });
    }
  };

  const handleSaveIA = async () => {
    setSavingIA(true);
    const { error } = await supabase.from("configuracoes")
      .upsert({ id: "ia_contexto", valor: iaContexto, updated_at: new Date().toISOString() });
    setSavingIA(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      if (user) logAudit(user.id, fullName, "Atualizou contexto da IA", "Configurações");
      toast({ title: "Contexto da IA salvo" });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_PASSWORD) {
      toast({ title: "Senha muito curta", description: `Use pelo menos ${MIN_PASSWORD} caracteres.`, variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não conferem", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao alterar senha", description: error.message, variant: "destructive" });
      return;
    }
    setPassword("");
    setConfirm("");
    if (user) logAudit(user.id, fullName, "Alterou a senha", "Perfil");
    toast({ title: "Senha alterada com sucesso" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      {/* Foto de perfil */}
      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> Foto de perfil</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20">
              <AvatarImage src={currentAvatar ?? ""} alt={fullName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-2">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={uploadingPhoto}
                onClick={() => photoInputRef.current?.click()}
              >
                {uploadingPhoto ? "Enviando..." : "Alterar foto"}
              </Button>
              <p className="text-xs text-muted-foreground">JPG, PNG ou WebP — máx. 5MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Informações da conta</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">E-mail</span>
            <span className="text-sm font-medium">{user?.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Perfil</span>
            <Badge variant="secondary">{ROLE_LABELS[role] || role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-primary" /> Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-sm">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">Nova senha</Label>
              <div className="relative">
                <Input id="new-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="new-password" className="pr-10" />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirmar nova senha</Label>
              <Input id="confirm-password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                required autoComplete="new-password" />
            </div>
            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Salvando..." : "Alterar senha"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> Contexto da IA
            </CardTitle>
            <CardDescription>
              Informações extras que a IA deve conhecer — processos internos, políticas, FAQ.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Textarea
              placeholder="Ex: Nossa política de férias é... O processo de onboarding funciona assim..."
              value={iaContexto}
              onChange={(e) => setIaContexto(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <Button onClick={handleSaveIA} disabled={savingIA} className="self-start">
              {savingIA ? "Salvando..." : "Salvar contexto"}
            </Button>
          </CardContent>
        </Card>
      )}

      {role === "admin" && (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/base-conhecimento")}
        >
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" /> Base de Conhecimento da IA
            </CardTitle>
            <CardDescription>
              Envie materiais (PDF ou texto) com processos e procedimentos da DeskRio.
              O Deskinho usa esse conteúdo para responder dúvidas da equipe.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/base-conhecimento")}>
              Gerenciar documentos
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {role === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Auditoria
            </CardTitle>
            <CardDescription>
              Registro de ações realizadas pelos usuários na plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuditoriaLog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
