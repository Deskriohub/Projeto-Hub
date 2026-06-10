import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, ChevronDown, ChevronRight, MessageSquare, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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

interface TodoItem {
  id: string;
  texto: string;
  concluido: boolean;
  responsavel: string | null;
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

interface OneOnOneRecord {
  id: string;
  data_reuniao: string;
  liderado_id: string;
  liderado_nome: string;
  gestor_id: string;
  anotacoes: string | null;
  todos: TodoItem[];
}

const MESES_PT = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatMesAno(dateStr: string): string {
  const [y, m] = dateStr.split("-");
  return `${MESES_PT[parseInt(m, 10) - 1]}/${y.slice(2)}`;
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const MeusOneOnOne = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<OneOnOneRecord[]>([]);
  const [gestorNames, setGestorNames] = useState<Record<string, string>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filterMes, setFilterMes] = useState<string>("all");
  const [filterPendencias, setFilterPendencias] = useState<string>("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("one_on_one")
        .select("id, data_reuniao, liderado_id, liderado_nome, gestor_id, anotacoes, one_on_one_todos(id, texto, concluido, responsavel, concluido_por_nome, concluido_em)")
        .or(`liderado_id.eq.${user.id},gestor_id.eq.${user.id}`)
        .order("data_reuniao", { ascending: false });
      if (error) {
        toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      const mapped: OneOnOneRecord[] = (data || []).map((r: any) => ({
        id: r.id,
        data_reuniao: r.data_reuniao,
        liderado_id: r.liderado_id,
        liderado_nome: r.liderado_nome,
        gestor_id: r.gestor_id,
        anotacoes: r.anotacoes,
        todos: (r.one_on_one_todos || []).map((t: any) => ({
          id: t.id,
          texto: t.texto,
          concluido: t.concluido,
          responsavel: t.responsavel,
          concluido_por_nome: t.concluido_por_nome ?? null,
          concluido_em: t.concluido_em ?? null,
        })),
      }));
      setRecords(mapped);
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => {
    const fetchGestorNames = async () => {
      if (records.length === 0) return;
      const ids = Array.from(new Set(records.map((r) => r.gestor_id)));
      const missing = ids.filter((id) => !gestorNames[id]);
      if (missing.length === 0) return;
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", missing);
      const map: Record<string, string> = { ...gestorNames };
      (data || []).forEach((p: any) => {
        map[p.id] = p.full_name || p.id;
      });
      setGestorNames(map);
    };
    fetchGestorNames();
  }, [records]);

  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (records.length === 0) return;
      const ids = records.map((r) => r.id);
      const { data } = await supabase
        .from("one_on_one_comentarios")
        .select("one_on_one_id")
        .in("one_on_one_id", ids);
      const counts: Record<string, number> = {};
      (data || []).forEach((c: any) => {
        counts[c.one_on_one_id] = (counts[c.one_on_one_id] || 0) + 1;
      });
      setCommentCounts(counts);
    };
    fetchCommentCounts();
  }, [records]);

  const mesesAnos = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.data_reuniao.slice(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterMes !== "all" && r.data_reuniao.slice(0, 7) !== filterMes) return false;
      if (filterPendencias === "pending") {
        const hasPending = r.todos.some((t) => !t.concluido);
        if (!hasPending) return false;
      }
      return true;
    });
  }, [records, filterMes, filterPendencias]);

  const handleToggleTodo = async (recordId: string, todoId: string, current: boolean, responsavel: string | null) => {
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
    setRecords((prev) =>
      prev.map((r) =>
        r.id !== recordId
          ? r
          : { ...r, todos: r.todos.map((t) => (t.id === todoId ? { ...t, concluido: newVal, concluido_por_nome: nome, concluido_em: when } : t)) }
      )
    );
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
      setRecords((prev) =>
        prev.map((r) =>
          r.id !== recordId
            ? r
            : { ...r, todos: r.todos.map((t) => (t.id === todoId ? { ...t, concluido: current } : t)) }
        )
      );
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Minhas reuniões
        </h1>
        <p className="text-muted-foreground mt-1">One-on-ones em que você participa como líder ou liderado.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mês/Ano</label>
          <Select value={filterMes} onValueChange={setFilterMes}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {mesesAnos.map((m) => (
                <SelectItem key={m} value={m}>{formatMesAno(m + "-01")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Pendências</label>
          <Select value={filterPendencias} onValueChange={setFilterPendencias}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Com itens pendentes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma reunião registrada.</p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => {
            const preview = (r.anotacoes || "").trim();
            const previewText = preview ? preview.slice(0, 100) + (preview.length > 100 ? "..." : "") : "Sem anotações";
            const total = r.todos.length;
            const done = r.todos.filter((t) => t.concluido).length;
            const hasPending = r.todos.some((t) => !t.concluido);
            const cardCls = hasPending
              ? "bg-amber-50 border-amber-200 hover:bg-amber-100/60"
              : "bg-card border-border hover:bg-accent/30";
            const cc = commentCounts[r.id] || 0;
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-4 transition-all ${cardCls}`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{formatDateBR(r.data_reuniao)}</span>
                    <span className="text-xs text-muted-foreground">
                      Líder: <span className="text-foreground">{gestorNames[r.gestor_id] || "—"}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {done}/{total} itens concluídos
                    </span>
                    {cc > 0 && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {cc} {cc === 1 ? "comentário" : "comentários"}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 break-words">{previewText}</p>

                {r.todos.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpanded((p) => ({ ...p, [r.id]: !p[r.id] }))}
                      className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {expanded[r.id] ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {expanded[r.id] ? "Ocultar" : "Ver"} próximos passos ({r.todos.length})
                      </span>
                    </button>
                    {expanded[r.id] && (
                      <TooltipProvider delayDuration={150}>
                        <ul className="mt-2 space-y-1.5 border-t border-border/60 pt-3">
                          {r.todos.map((t) => {
                            const canToggle = t.responsavel === "Liderado";
                            return (
                              <li key={t.id} className="flex items-center gap-2 text-sm">
                                <OneOnOneTodoRow
                                  checked={t.concluido}
                                  disabled={!canToggle}
                                  onToggle={() => handleToggleTodo(r.id, t.id, t.concluido, t.responsavel)}
                                  concluidoPorNome={t.concluido_por_nome}
                                  concluidoEm={t.concluido_em}
                                  checkboxClassName={!canToggle ? "opacity-40 cursor-not-allowed" : ""}
                                  text={t.texto}
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
                  </>
                )}

                <div className="mt-3 flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/meus-one-on-one/${r.id}`)}>
                    Visualizar one-on-one <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MeusOneOnOne;
