import { useEffect, useState } from "react";
import { Lightbulb, MessageSquare, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Sugestao {
  id: string;
  created_at: string;
  texto: string;
  anonima: boolean;
  autor_nome: string | null;
  resposta: string | null;
  respondido_em: string | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const Sugestoes = () => {
  const [items, setItems] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Sugestao | null>(null);
  const [resposta, setResposta] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("sugestoes")
        .select("id, created_at, texto, anonima, autor_nome, resposta, respondido_em")
        .order("created_at", { ascending: false });
      if (error) { toast.error("Erro ao carregar sugestões."); }
      else { setItems((data as Sugestao[]) || []); }
      setLoading(false);
    })();
  }, []);

  const openSugestao = (s: Sugestao) => {
    setSelected(s);
    setResposta(s.resposta || "");
  };

  const handleSaveResposta = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from("sugestoes")
      .update({ resposta: resposta.trim() || null, respondido_em: resposta.trim() ? new Date().toISOString() : null })
      .eq("id", selected.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar resposta."); return; }
    toast.success("Resposta salva.");
    setItems((prev) => prev.map((s) => s.id === selected.id
      ? { ...s, resposta: resposta.trim() || null, respondido_em: resposta.trim() ? new Date().toISOString() : null }
      : s
    ));
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sugestões</h1>
          <p className="text-sm text-muted-foreground">Clique em uma sugestão para responder.</p>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma sugestão recebida ainda.</p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Card
              key={s.id}
              onClick={() => openSugestao(s)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-muted-foreground">{formatDate(s.created_at)}</span>
                    <Badge variant="outline" className="text-[10px] h-4">
                      {s.anonima ? "Anônimo" : (s.autor_nome || "—")}
                    </Badge>
                    {s.resposta && (
                      <Badge variant="secondary" className="text-[10px] h-4 gap-1">
                        <Check className="h-2.5 w-2.5" /> Respondida
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{s.texto}</p>
                  {s.resposta && (
                    <p className="text-xs text-muted-foreground mt-1 italic line-clamp-1">↳ {s.resposta}</p>
                  )}
                </div>
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" /> Sugestão
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(selected.created_at)}</span>
                <span>·</span>
                <span>{selected.anonima ? "Anônimo" : (selected.autor_nome || "—")}</span>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap p-3 bg-muted/40 rounded-md">{selected.texto}</p>
              <div>
                <Label htmlFor="resposta">Resposta / Devolutiva</Label>
                <Textarea
                  id="resposta"
                  value={resposta}
                  onChange={(e) => setResposta(e.target.value)}
                  placeholder="Escreva uma resposta ou agradecimento..."
                  rows={3}
                  className="mt-1 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">A resposta fica visível apenas aqui para a equipe admin.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSelected(null)}>Fechar</Button>
            <Button size="sm" disabled={saving} onClick={handleSaveResposta}>
              {saving ? "Salvando..." : "Salvar resposta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sugestoes;
