import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "@/hooks/use-toast";
import OneOnOneComentarios from "@/components/OneOnOneComentarios";

type Responsavel = "" | "Líder" | "Liderado";

interface Todo {
  id: string;
  texto: string;
  concluido: boolean;
  responsavel: Responsavel;
  concluido_por_nome: string | null;
  concluido_em: string | null;
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

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

const MeusOneOnOneView = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [liderado, setLiderado] = useState<string>("");
  const [data, setData] = useState<string>("");
  const [anotacoes, setAnotacoes] = useState<string>("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user || !id) return;
      setLoading(true);
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, full_name");
      setProfiles((allProfiles || []) as Profile[]);

      const { data: rec, error } = await supabase
        .from("one_on_one")
        .select("liderado_id, data_reuniao, anotacoes")
        .eq("id", id)
        .maybeSingle();
      if (error || !rec) {
        toast({ title: "Erro ao carregar", description: error?.message || "Não encontrado", variant: "destructive" });
        setLoading(false);
        return;
      }
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
    };
    load();
  }, [user, id]);

  const handleToggleTodo = async (todoId: string, current: boolean, responsavel: Responsavel) => {
    if (responsavel !== "Liderado") return;
    const newVal = !current;
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
    setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, concluido: newVal, concluido_por_nome: nome, concluido_em: when } : t)));
    const { error } = await supabase
      .from("one_on_one_todos")
      .update({
        concluido: newVal,
        concluido_por_id: newVal ? user?.id ?? null : null,
        concluido_por_nome: nome,
        concluido_em: when,
      })
      .eq("id", todoId);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      setTodos((prev) => prev.map((t) => (t.id === todoId ? { ...t, concluido: current } : t)));
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Button variant="ghost" onClick={() => navigate("/meus-one-on-one")} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Visualizar One-on-One
          </h1>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="liderado" className="mb-2 block">Liderado</Label>
              <Select value={liderado} onValueChange={() => {}} disabled>
                <SelectTrigger id="liderado">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name || "—"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="data" className="mb-2 block">Data da reunião</Label>
              <Input id="data" type="date" value={data} disabled readOnly />
            </div>
          </div>

          <div>
            <Label htmlFor="anotacoes" className="mb-2 block">Anotações</Label>
            <Textarea
              id="anotacoes"
              value={anotacoes}
              readOnly
              disabled
              className="min-h-[300px] font-mono text-sm"
            />
          </div>

          <div>
            <Label className="mb-2 block">Próximos Passos</Label>
            {todos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum item.</p>
            ) : (
              <TooltipProvider delayDuration={150}>
                <ul className="space-y-2">
                  {todos.map((t) => {
                    const canToggle = t.responsavel === "Liderado";
                    return (
                      <li key={t.id} className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2">
                        <OneOnOneTodoRow
                          checked={t.concluido}
                          disabled={!canToggle}
                          onToggle={() => handleToggleTodo(t.id, t.concluido, t.responsavel)}
                          concluidoPorNome={t.concluido_por_nome}
                          concluidoEm={t.concluido_em}
                          checkboxClassName={!canToggle ? "opacity-40 cursor-not-allowed" : ""}
                          text={t.texto}
                          textClassName="text-sm"
                          gapClassName="gap-3"
                        />
                        {t.responsavel && (
                          <span
                            className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${
                              t.responsavel === "Líder"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {t.responsavel}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </TooltipProvider>
            )}
          </div>
        </div>
      )}

      {!loading && id && (
        <div className="mt-6">
          <OneOnOneComentarios oneOnOneId={id} canComment={true} />
        </div>
      )}
    </div>
  );
};

export default MeusOneOnOneView;
