import { useEffect, useState } from "react";
import { Megaphone, Trash2, Plus, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Aviso {
  id: string;
  titulo: string;
  link: string | null;
  created_at: string;
}

export default function AvisosAdmin() {
  const { role } = useUserRole();
  const isAdmin = role === "admin";
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("id, titulo, link, created_at")
      .order("created_at", { ascending: false });
    if (!error) setAvisos((data as Aviso[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchAvisos(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("avisos").insert({
      titulo: titulo.trim(),
      link: link.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar aviso", description: error.message, variant: "destructive" });
    } else {
      setTitulo("");
      setLink("");
      toast({ title: "Aviso criado" });
      fetchAvisos();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("avisos").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover aviso", description: error.message, variant: "destructive" });
    } else {
      setAvisos((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Aviso removido" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Avisos</h1>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Novo aviso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="flex flex-col gap-3 max-w-lg">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Reunião geral na sexta às 15h"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="link">Link (opcional)</Label>
                <Input
                  id="link"
                  placeholder="https://..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  type="url"
                />
              </div>
              <Button type="submit" disabled={saving || !titulo.trim()} className="self-start">
                {saving ? "Salvando..." : "Publicar aviso"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md border bg-muted/30"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-sm font-medium truncate">{a.titulo}</p>
                    {a.link && (
                      <a
                        href={a.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        {a.link} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
