import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bold,
  Italic,
  List,
  Smile,
  Save,
  Plus,
  Trash2,
  Users,
  Pencil,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OneOnOneTodoRow } from "@/components/OneOnOneTodoCheck";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPicker } from "@/components/UserPicker";
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
import OneOnOneComentarios from "@/components/OneOnOneComentarios";

const EMOJIS = ["🌟", "💪", "🤝", "🎯", "🚀", "💡", "❤️", "🏆", "👏", "😊"];

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

type Responsavel = "" | "Líder" | "Liderado";

interface Todo {
  id?: string;
  texto: string;
  concluido: boolean;
  responsavel: Responsavel;
  concluido_por_nome?: string | null;
  concluido_em?: string | null;
  _isNew?: boolean;
  _toDelete?: boolean;
}

const formatTooltipDate = (iso: string) => {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
};

const todayStr = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const OneOnOneForm = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== "novo";

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [liderado, setLiderado] = useState<string>("");
  const [data, setData] = useState<string>(todayStr());
  const [anotacoes, setAnotacoes] = useState<string>("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [novoTodo, setNovoTodo] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState<boolean>(!isEdit);
  const [gestorId, setGestorId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("id", user.id);
      const sorted = (allProfiles || []).sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      );
      setProfiles(sorted as Profile[]);

      if (isEdit && id) {
        setLoading(true);
        const { data: rec, error } = await supabase
          .from("one_on_one")
          .select("liderado_id, data_reuniao, anotacoes, gestor_id")
          .eq("id", id)
          .maybeSingle();
        if (error || !rec) {
          toast({ title: "Erro ao carregar", description: error?.message || "Não encontrado", variant: "destructive" });
          setLoading(false);
          return;
        }
        setGestorId(rec.gestor_id);
        setLiderado(rec.liderado_id);
        setData(rec.data_reuniao);
        setAnotacoes(rec.anotacoes || "");

        const { data: ts } = await supabase
          .from("one_on_one_todos")
          .select("id, texto, concluido, responsavel, concluido_por_nome, concluido_em")
          .eq("one_on_one_id", id)
          .order("created_at", { ascending: true });
        setTodos((ts || []).map((t: any) => ({
          id: t.id,
          texto: t.texto,
          concluido: t.concluido,
          responsavel: (t.responsavel as Responsavel) || "",
          concluido_por_nome: t.concluido_por_nome ?? null,
          concluido_em: t.concluido_em ?? null,
        })));
        setLoading(false);
      }
    };
    load();
  }, [user, id, isEdit]);

  const liderado_nome = useMemo(() => {
    const p = profiles.find((x) => x.id === liderado);
    return p?.full_name || "";
  }, [liderado, profiles]);

  const readOnly = !editMode;

  const insertAtCursor = (before: string, after: string = "") => {
    const ta = textareaRef.current;
    if (!ta) {
      setAnotacoes((prev) => prev + before + after);
      return;
    }
    const start = ta.selectionStart ?? anotacoes.length;
    const end = ta.selectionEnd ?? anotacoes.length;
    const selected = anotacoes.slice(start, end);
    const next = anotacoes.slice(0, start) + before + selected + after + anotacoes.slice(end);
    setAnotacoes(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + before.length + selected.length + after.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const insertList = () => {
    const ta = textareaRef.current;
    if (!ta) {
      setAnotacoes((p) => p + "\n- ");
      return;
    }
    const start = ta.selectionStart ?? anotacoes.length;
    const before = anotacoes.slice(0, start);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insert = (needsNewline ? "\n" : "") + "- ";
    const next = before + insert + anotacoes.slice(start);
    setAnotacoes(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleAddTodo = () => {
    const t = novoTodo.trim();
    if (!t) {
      toast({ title: "Digite o item antes de adicionar", variant: "destructive" });
      return;
    }
    setTodos((prev) => [...prev, { texto: t, concluido: false, responsavel: "", _isNew: true }]);
    setNovoTodo("");
  };

  const handleToggleTodo = async (idx: number) => {
    const target = todos[idx];
    if (!target) return;
    const newVal = !target.concluido;
    let nome: string | null = null;
    let when: string | null = null;
    if (newVal && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      nome = profile?.full_name || "Usuário";
      when = new Date().toISOString();
    }
    setTodos((prev) => prev.map((t, i) => (i === idx ? { ...t, concluido: newVal, concluido_por_nome: nome, concluido_em: when } : t)));
    if (target.id) {
      const { error } = await supabase
        .from("one_on_one_todos")
        .update({
          concluido: newVal,
          concluido_por_id: newVal ? user?.id ?? null : null,
          concluido_por_nome: nome,
          concluido_em: when,
        })
        .eq("id", target.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
        setTodos((prev) => prev.map((t, i) => (i === idx ? { ...t, concluido: !newVal } : t)));
      }
    }
  };

  const handleSetResponsavel = (idx: number, value: Responsavel) => {
    setTodos((prev) => prev.map((t, i) => (i === idx ? { ...t, responsavel: value } : t)));
  };

  const handleDeleteTodo = (idx: number) => {
    setTodos((prev) => {
      const t = prev[idx];
      if (t._isNew) return prev.filter((_, i) => i !== idx);
      return prev.map((x, i) => (i === idx ? { ...x, _toDelete: true } : x));
    });
  };

  const visibleTodos = todos
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !t._toDelete);

  const handleSave = async () => {
    if (!user) return;
    if (!liderado) {
      toast({ title: "Selecione um liderado", variant: "destructive" });
      return;
    }
    if (!data) {
      toast({ title: "Selecione uma data", variant: "destructive" });
      return;
    }
    const missingResp = visibleTodos.some(({ t }) => !t.responsavel);
    if (missingResp) {
      toast({
        title: "Responsável obrigatório",
        description: "Defina o responsável (Líder ou Liderado) em todos os Próximos Passos.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    let recordId = id && isEdit ? id : null;

    if (isEdit && recordId) {
      const { error } = await supabase
        .from("one_on_one")
        .update({
          liderado_id: liderado,
          liderado_nome,
          data_reuniao: data,
          anotacoes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", recordId);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("one_on_one")
        .insert({
          gestor_id: user.id,
          liderado_id: liderado,
          liderado_nome,
          data_reuniao: data,
          anotacoes,
        })
        .select("id")
        .single();
      if (error || !inserted) {
        toast({ title: "Erro ao salvar", description: error?.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      recordId = inserted.id;
    }

    const toDelete = todos.filter((t) => t._toDelete && t.id).map((t) => t.id!) ;
    const toInsert = todos.filter((t) => t._isNew && !t._toDelete);
    const toUpdate = todos.filter((t) => !t._isNew && !t._toDelete && t.id);

    if (toDelete.length > 0) {
      await supabase.from("one_on_one_todos").delete().in("id", toDelete);
    }
    if (toInsert.length > 0) {
      await supabase.from("one_on_one_todos").insert(
        toInsert.map((t) => ({
          one_on_one_id: recordId!,
          texto: t.texto,
          concluido: t.concluido,
          responsavel: t.responsavel,
        }))
      );
    }
    for (const t of toUpdate) {
      await supabase
        .from("one_on_one_todos")
        .update({ texto: t.texto, concluido: t.concluido, responsavel: t.responsavel })
        .eq("id", t.id!);
    }

    setSaving(false);
    toast({ title: "One-on-One salvo com sucesso!" });

    navigate("/one-on-one");
  };

  const isLiderado = isEdit && liderado !== "" && liderado === user?.id && gestorId !== user?.id;
  const canDelete = isEdit && !isLiderado && (isAdmin || (gestorId !== null && gestorId === user?.id));

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    await supabase.from("one_on_one_todos").delete().eq("one_on_one_id", id);
    const { error } = await supabase.from("one_on_one").delete().eq("id", id);
    setDeleting(false);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "One-on-One excluído" });
    setConfirmDelete(false);
    navigate("/one-on-one");
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Button variant="ghost" onClick={() => navigate("/one-on-one")} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> {isEdit ? (readOnly ? "Visualizar One-on-One" : "Editar One-on-One") : "Novo One-on-One"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isEdit && readOnly && canDelete && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          )}
          {isEdit && readOnly && !isLiderado && (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </Button>
          )}
          {!readOnly && (
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="liderado" className="mb-2 block">Liderado</Label>
              <UserPicker
                id="liderado"
                options={profiles}
                value={liderado}
                onChange={setLiderado}
                disabled={readOnly}
                placeholder="Selecione um colaborador"
              />
            </div>
            <div>
              <Label htmlFor="data" className="mb-2 block">Data da reunião</Label>
              <Input
                id="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="anotacoes" className="mb-2 block">Anotações</Label>
            {!readOnly && (
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
            )}
            <Textarea
              id="anotacoes"
              ref={textareaRef}
              value={anotacoes}
              onChange={(e) => setAnotacoes(e.target.value)}
              placeholder="Escreva suas anotações da reunião..."
              className="min-h-[300px] font-mono text-sm"
              readOnly={readOnly}
              disabled={readOnly}
            />
          </div>

          <div>
            <Label className="mb-1 block">Próximos Passos</Label>
            <div className="mb-3 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p>📋 São os <strong className="text-foreground">combinados que saem da reunião</strong> — o que cada um vai fazer até o próximo encontro.</p>
              <p>👤 Em cada item, escolha o <strong className="text-foreground">Responsável</strong>: <strong>Líder</strong> (gestor) ou <strong>Liderado</strong> (funcionário).</p>
              <p>✅ Quem é responsável marca como concluído depois — fica registrado <strong className="text-foreground">quem fez e quando</strong>. O liderado acompanha em "Minhas Reuniões".</p>
              <p>🕓 Pode preencher <strong className="text-foreground">durante ou depois</strong> da reunião (é só editar o 1:1). Ao agendar, pode deixar vazio.</p>
            </div>
            {!readOnly && (
              <div className="flex gap-2 mb-3">
                <Input
                  value={novoTodo}
                  onChange={(e) => setNovoTodo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTodo();
                    }
                  }}
                  placeholder="Novo item..."
                />
                <Button type="button" onClick={handleAddTodo} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>
            )}
            {visibleTodos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item.</p>
            ) : (
              <TooltipProvider delayDuration={150}>
                <ul className="space-y-2">
                  {visibleTodos.map(({ t, i }) => (
                    <li key={i} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                      <OneOnOneTodoRow
                        checked={t.concluido}
                        disabled={readOnly}
                        onToggle={() => handleToggleTodo(i)}
                        concluidoPorNome={t.concluido_por_nome ?? null}
                        concluidoEm={t.concluido_em ?? null}
                        text={t.texto}
                        textClassName="text-sm"
                        gapClassName="gap-3"
                      />
                      <Select
                        value={t.responsavel || undefined}
                        onValueChange={(v) => handleSetResponsavel(i, v as Responsavel)}
                        disabled={readOnly}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue placeholder="Responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Líder">Líder</SelectItem>
                          <SelectItem value="Liderado">Liderado</SelectItem>
                        </SelectContent>
                      </Select>
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTodo(i)}
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </TooltipProvider>
            )}
          </div>
          {!readOnly && (
            <div className="flex justify-end gap-2 pt-2">
              {isEdit && canDelete && (
                <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </Button>
              )}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </div>
      )}

      {isEdit && id && (
        <div className="mt-6">
          <OneOnOneComentarios
            oneOnOneId={id}
            canComment={isAdmin || gestorId === user?.id || liderado === user?.id}
          />
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir One-on-One</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este One-on-One? Esta ação não pode ser desfeita.
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

export default OneOnOneForm;
