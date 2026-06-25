import { useEffect, useRef, useState } from "react";
import { Bold, Italic, List, Smile, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export interface Anotacao {
  id: string;
  liderado_id: string;
  autor_id: string | null;
  one_on_one_id: string | null;
  data: string;
  conteudo: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Props {
  open: boolean;
  onClose: (saved?: boolean) => void;
  lideradoId: string;
  lideradoNome: string;
  /** Quando criada a partir de um 1:1, vincula a anotação à reunião. Anotação livre = null. */
  oneOnOneId?: string | null;
  /** Anotação existente para edição; ausente = nova. */
  existing?: Anotacao | null;
}

const EMOJIS = ["🌟", "💪", "🤝", "🎯", "🚀", "💡", "❤️", "🏆", "👏", "😊"];

const todayStr = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const AnotacaoComposer = ({ open, onClose, lideradoId, lideradoNome, oneOnOneId = null, existing = null }: Props) => {
  const { user } = useAuth();
  const isEdit = !!existing;
  const [data, setData] = useState<string>(todayStr());
  const [conteudo, setConteudo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    setData(existing?.data || todayStr());
    setConteudo(existing?.conteudo || "");
  }, [open, existing]);

  const insertAtCursor = (before: string, after: string = "") => {
    const ta = textareaRef.current;
    if (!ta) {
      setConteudo((prev) => prev + before + after);
      return;
    }
    const start = ta.selectionStart ?? conteudo.length;
    const end = ta.selectionEnd ?? conteudo.length;
    const selected = conteudo.slice(start, end);
    const next = conteudo.slice(0, start) + before + selected + after + conteudo.slice(end);
    setConteudo(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertList = () => {
    const ta = textareaRef.current;
    if (!ta) {
      setConteudo((p) => p + "\n- ");
      return;
    }
    const start = ta.selectionStart ?? conteudo.length;
    const before = conteudo.slice(0, start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insert = (needsNewline ? "\n" : "") + "- ";
    const next = before + insert + conteudo.slice(start);
    setConteudo(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleSave = async () => {
    if (!user) return;
    const texto = conteudo.trim();
    if (!texto) {
      toast({ title: "Escreva algo antes de salvar", variant: "destructive" });
      return;
    }
    if (!data) {
      toast({ title: "Selecione uma data", variant: "destructive" });
      return;
    }
    setSaving(true);
    if (isEdit && existing) {
      const { error } = await supabase
        .from("anotacoes")
        .update({ conteudo: texto, data, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      setSaving(false);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("anotacoes").insert({
        liderado_id: lideradoId,
        autor_id: user.id,
        one_on_one_id: oneOnOneId,
        data,
        conteudo: texto,
      });
      setSaving(false);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        return;
      }
    }
    toast({ title: isEdit ? "Anotação atualizada" : "Anotação criada" });
    onClose(true);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose(false)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar anotação" : "Nova anotação"}</DialogTitle>
          <DialogDescription>
            {lideradoNome}
            {oneOnOneId ? " · vinculada a este 1:1" : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="w-40">
            <Label htmlFor="anotacao-data" className="mb-2 block">Data</Label>
            <Input
              id="anotacao-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="anotacao-conteudo" className="mb-2 block">Anotação</Label>
            <div className="flex flex-wrap items-center gap-1 mb-2 rounded-md border border-border bg-muted/30 p-1">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertAtCursor("**", "**")} aria-label="Negrito">
                <Bold className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertAtCursor("*", "*")} aria-label="Itálico">
                <Italic className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={insertList} aria-label="Lista">
                <List className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Smile className="h-4 w-4 text-muted-foreground ml-1" />
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insertAtCursor(e)}
                  className="h-8 w-8 rounded text-lg hover:bg-accent/40 transition-all"
                  aria-label={`Inserir ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <Textarea
              id="anotacao-conteudo"
              ref={textareaRef}
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva a anotação..."
              className="min-h-[240px] font-mono text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onClose(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !conteudo.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AnotacaoComposer;
