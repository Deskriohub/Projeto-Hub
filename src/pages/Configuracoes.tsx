import { useState, useEffect } from "react";
import { Settings, Eye, EyeOff, KeyRound, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const ROLE_LABELS: Record<string, string> = { admin: "Admin", gestor: "Gestor", geral: "Geral" };
const MIN_PASSWORD = 6;

export default function Configuracoes() {
  const { user } = useAuth();
  const { role } = useUserRole();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const [iaContexto, setIaContexto] = useState("");
  const [savingIA, setSavingIA] = useState(false);

  useEffect(() => {
    if (role !== "admin") return;
    supabase.from("configuracoes").select("valor").eq("id", "ia_contexto").maybeSingle()
      .then(({ data }) => setIaContexto(data?.valor ?? ""));
  }, [role]);

  const handleSaveIA = async () => {
    setSavingIA(true);
    const { error } = await supabase.from("configuracoes")
      .upsert({ id: "ia_contexto", valor: iaContexto, updated_at: new Date().toISOString() });
    setSavingIA(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
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
    toast({ title: "Senha alterada com sucesso" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

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
              Informações extras que a IA deve conhecer — processos internos, políticas, FAQ. O site da DeskRio já é consultado automaticamente.
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
    </div>
  );
}
