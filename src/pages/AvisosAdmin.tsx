import { useEffect, useState } from "react";
import { Megaphone, Trash2, Plus, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { logAudit } from "@/lib/auditLog";

interface Aviso {
  id: string;
  titulo: string;
  link: string | null;
  observacao: string | null;
  publico: string;
  data_inicio: string | null;
  data_fim: string | null;
  created_at: string;
}

const emptyForm = () => ({ titulo: "", link: "", observacao: "", publico: "todos" as "todos" | "admin", data_inicio: "", data_fim: "" });

function fmtDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function AvisosAdmin() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const { fullName } = useProfile();
  const isAdmin = role === "admin";
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const fetchAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("id, titulo, link, observacao, publico, data_inicio, data_fim, created_at")
      .order("created_at", { ascending: false });
    if (!error) setAvisos((data as Aviso[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAvisos(); }, []);

  const handleAdd = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);

    const payload = {
      titulo: form.titulo.trim(),
      link: form.link.trim() || null,
      observacao: form.observacao.trim() || null,
      publico: form.publico,
      data_inicio: form.data_inicio || null,
      data_fim: form.data_fim || null,
      created_by: user?.id ?? null,
    };

    const { error } = await supabase.from("avisos").insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar aviso", description: error.message, variant: "destructive" });
      return;
    }

    if (user) {
      const janela = form.data_inicio || form.data_fim
        ? `\nVisível: ${form.data_inicio ? fmtDate(form.data_inicio) : "..."}${form.data_fim ? ` até ${fmtDate(form.data_fim)}` : " (sem fim)"}`
        : "";
      logAudit(user.id, fullName, `Publicou o aviso "${form.titulo.trim()}"`, "Avisos", {
        depois: `Título: ${form.titulo.trim()}${form.observacao ? `\nObservação: ${form.observacao.trim()}` : ""}\nVisível para: ${form.publico === "admin" ? "Só admins" : "Todos"}${janela}`,
      });
    }

    setForm(emptyForm());
    setOpen(false);
    toast({ title: "Aviso publicado com sucesso!" });
    fetchAvisos();
  };

  const handleDelete = async (id: string) => {
    const alvo = avisos.find((a) => a.id === id);
    const { error } = await supabase.from("avisos").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover aviso", description: error.message, variant: "destructive" });
    } else {
      setAvisos((prev) => prev.filter((a) => a.id !== id));
      if (user && alvo) {
        logAudit(user.id, fullName, `Removeu o aviso "${alvo.titulo}"`, "Avisos", {
          antes: `Título: ${alvo.titulo}${alvo.observacao ? `\nObservação: ${alvo.observacao}` : ""}`,
        });
      }
      toast({ title: "Aviso removido" });
    }
  };

  const openNew = () => { setForm(emptyForm()); setOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Megaphone className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Avisos</h1>
        </div>
        {isAdmin && (
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Novo Aviso
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Avisos publicados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : avisos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum aviso publicado.</p>
          ) : (
            <div className="space-y-2">
              {avisos.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 p-3 rounded-md border bg-muted/30">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{a.titulo}</p>
                      {a.publico && (
                        <Badge variant={a.publico === "admin" ? "destructive" : "secondary"} className="text-[10px] h-4">
                          {a.publico === "admin" ? "Só admins" : "Todos"}
                        </Badge>
                      )}
                      {(a.data_inicio || a.data_fim) && (
                        <Badge variant="outline" className="text-[10px] h-4 border-amber-300 text-amber-700">
                          📅 {a.data_inicio ? fmtDate(a.data_inicio) : "..."}{a.data_fim ? ` → ${fmtDate(a.data_fim)}` : ""}
                        </Badge>
                      )}
                    </div>
                    {a.observacao && <p className="text-xs text-muted-foreground">{a.observacao}</p>}
                    {a.link && (
                      <a href={a.link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        {a.link} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { if (!saving) setOpen(v); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Novo aviso
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="av-titulo">Título *</Label>
              <Input
                id="av-titulo"
                placeholder="Ex: Reunião geral na sexta às 15h"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="av-obs">Observação</Label>
              <Textarea
                id="av-obs"
                placeholder="Detalhes adicionais sobre o aviso..."
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="av-link">Link (opcional)</Label>
              <Input
                id="av-link"
                placeholder="https://..."
                value={form.link}
                onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                type="url"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="av-inicio">Início (opcional)</Label>
                <Input
                  id="av-inicio"
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="av-fim">Fim (opcional)</Label>
                <Input
                  id="av-fim"
                  type="date"
                  value={form.data_fim}
                  onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground -mt-1">
              Com data de início, o aviso aparece no calendário e só fica visível a partir dela.
              Com data de fim, ele some automaticamente depois. Sem datas, fica sempre visível.
            </p>
            <div className="flex flex-col gap-1.5">
              <Label>Visível para</Label>
              <Select value={form.publico} onValueChange={(v) => setForm((f) => ({ ...f, publico: v as "todos" | "admin" }))}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os usuários</SelectItem>
                  <SelectItem value="admin">Somente admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving || !form.titulo.trim()}>
              {saving ? "Publicando..." : "Publicar aviso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
