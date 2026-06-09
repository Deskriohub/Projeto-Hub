import { useEffect, useRef, useState } from "react";
import { MessageSquare, Pencil, Trash2, Bold, Italic, List, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";

interface Comentario {
  id: string;
  autor_id: string;
  autor_nome: string;
  texto: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  oneOnOneId: string;
  canComment: boolean;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatInline = (s: string) =>
  s
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\*)([^*\n]+?)\*(?!\*)/g, "$1<em>$2</em>");

const renderMarkdown = (text: string) => {
  const lines = text.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const isItem = /^- (.*)/.test(raw);
    if (isItem) {
      if (!inList) {
        out.push('<ul class="list-disc ml-5 space-y-0.5">');
        inList = true;
      }
      out.push(`<li>${formatInline(escapeHtml(raw.replace(/^- /, "")))}</li>`);
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      const content = formatInline(escapeHtml(raw));
      out.push(content === "" ? "<br/>" : `<p>${content}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return { __html: out.join("") };
};

const OneOnOneComentarios = ({ oneOnOneId, canComment }: Props) => {
  const { user } = useAuth();
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(false);
  const [novo, setNovo] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const novoRef = useRef<HTMLTextAreaElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const EMOJIS = ["👍", "❤️", "😊", "🎯", "🚀", "💡", "👏", "✅", "⚠️", "😂"];

  const insertAt = (target: "novo" | "edit", before: string, after: string = "") => {
    const ta = target === "novo" ? novoRef.current : editRef.current;
    const value = target === "novo" ? novo : editText;
    const setValue = target === "novo" ? setNovo : setEditText;
    if (!ta) {
      setValue(value + before + after);
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertList = (target: "novo" | "edit") => {
    const ta = target === "novo" ? novoRef.current : editRef.current;
    const value = target === "novo" ? novo : editText;
    const setValue = target === "novo" ? setNovo : setEditText;
    if (!ta) {
      setValue(value + "\n- ");
      return;
    }
    const start = ta.selectionStart ?? value.length;
    const before = value.slice(0, start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insert = (needsNewline ? "\n" : "") + "- ";
    const next = before + insert + value.slice(start);
    setValue(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const Toolbar = ({ target }: { target: "novo" | "edit" }) => (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-border bg-muted/30 p-1">
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertAt(target, "**", "**")} aria-label="Negrito">
        <Bold className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertAt(target, "*", "*")} aria-label="Itálico">
        <Italic className="h-4 w-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => insertList(target)} aria-label="Lista">
        <List className="h-4 w-4" />
      </Button>
      <div className="w-px h-6 bg-border mx-1" />
      <Smile className="h-4 w-4 text-muted-foreground ml-1" />
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => insertAt(target, e)}
          className="h-8 w-8 rounded text-lg hover:bg-accent/40 transition-all"
          aria-label={`Inserir ${e}`}
        >
          {e}
        </button>
      ))}
    </div>
  );

  const load = async () => {
    if (!oneOnOneId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("one_on_one_comentarios")
      .select("id, autor_id, autor_nome, texto, created_at, updated_at")
      .eq("one_on_one_id", oneOnOneId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao carregar comentários", description: error.message, variant: "destructive" });
      return;
    }
    setComentarios((data || []) as Comentario[]);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oneOnOneId]);

  const handlePost = async () => {
    if (!user) return;
    const texto = novo.trim();
    if (!texto) return;
    setPosting(true);
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    const autor_nome = profile?.full_name || "Usuário";
    const { error } = await supabase.from("one_on_one_comentarios").insert({
      one_on_one_id: oneOnOneId,
      autor_id: user.id,
      autor_nome,
      texto,
    });
    setPosting(false);
    if (error) {
      toast({ title: "Erro ao comentar", description: error.message, variant: "destructive" });
      return;
    }
    setNovo("");
    await load();
  };

  const startEdit = (c: Comentario) => {
    setEditingId(c.id);
    setEditText(c.texto);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const texto = editText.trim();
    if (!texto) return;
    setSavingEdit(true);
    const { error } = await supabase
      .from("one_on_one_comentarios")
      .update({ texto, updated_at: new Date().toISOString() })
      .eq("id", editingId);
    setSavingEdit(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    cancelEdit();
    await load();
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .from("one_on_one_comentarios")
      .delete()
      .eq("id", confirmDeleteId);
    setDeleting(false);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setConfirmDeleteId(null);
    await load();
  };

  if (!canComment) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <Label className="flex items-center gap-2 text-base">
        <MessageSquare className="h-4 w-4 text-primary" /> Comentários
      </Label>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : comentarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-3">
          {comentarios.map((c) => {
            const isMine = c.autor_id === user?.id;
            const isEditing = editingId === c.id;
            return (
              <li key={c.id} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.autor_nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(c.created_at)}
                      {c.updated_at && c.updated_at !== c.created_at ? " · editado" : ""}
                    </p>
                  </div>
                  {isMine && !isEditing && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)} aria-label="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setConfirmDeleteId(c.id)} aria-label="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <Toolbar target="edit" />
                    <Textarea
                      ref={editRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[80px] font-mono text-sm"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={cancelEdit} disabled={savingEdit}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={saveEdit} disabled={savingEdit}>
                        {savingEdit ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mt-2 text-sm text-foreground [&_p]:mb-1 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={renderMarkdown(c.texto)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-2 pt-2 border-t border-border">
        <Toolbar target="novo" />
        <Textarea
          ref={novoRef}
          value={novo}
          onChange={(e) => setNovo(e.target.value)}
          placeholder="Escreva um comentário..."
          className="min-h-[80px] font-mono text-sm"
        />
        <div className="flex justify-end">
          <Button onClick={handlePost} disabled={posting || !novo.trim()}>
            {posting ? "Enviando..." : "Comentar"}
          </Button>
        </div>
      </div>

      <AlertDialog open={!!confirmDeleteId} onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OneOnOneComentarios;
