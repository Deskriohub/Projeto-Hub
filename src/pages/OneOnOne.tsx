import { useEffect, useMemo, useState } from "react";
import { Users, Plus, ChevronDown, ChevronRight, Trash2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OneOnOneTodoRow } from "@/components/OneOnOneTodoCheck";
import { BulkOneOnOneDialog } from "@/components/BulkOneOnOneDialog";
import { toast } from "@/hooks/use-toast";
import { CalendarPlus, User } from "lucide-react";

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
  const monthIdx = parseInt(m, 10) - 1;
  return `${MESES_PT[monthIdx]}/${y.slice(2)}`;
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const OneOnOne = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isAdmin = role === "admin";
  const navigate = useNavigate();
  const [records, setRecords] = useState<OneOnOneRecord[]>([]);
  const [gestorNames, setGestorNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterLiderado, setFilterLiderado] = useState<string>("all");
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
        .neq("liderado_id", user.id)
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

  // Fetch gestor names for admin view
  useEffect(() => {
    const fetchGestorNames = async () => {
      if (!isAdmin || records.length === 0) return;
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
  }, [isAdmin, records]);

  const liderados = useMemo(() => {
    const set = new Map<string, string>();
    records.forEach((r) => set.set(r.liderado_nome, r.liderado_nome));
    return Array.from(set.keys()).sort((a, b) => a.localeCompare(b));
  }, [records]);

  const mesesAnos = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.data_reuniao.slice(0, 7)));
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [records]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (filterLiderado !== "all" && r.liderado_nome !== filterLiderado) return false;
      if (filterMes !== "all" && r.data_reuniao.slice(0, 7) !== filterMes) return false;
      if (filterPendencias === "pending") {
        const hasPending = r.todos.some((t) => !t.concluido);
        if (!hasPending) return false;
      }
      return true;
    });
  }, [records, filterLiderado, filterMes, filterPendencias]);

  const pendStats = useMemo(() => {
    const liderados = new Set<string>();
    let itens = 0;
    records.forEach((r) => {
      const pend = r.todos.filter((t) => !t.concluido).length;
      if (pend > 0) { liderados.add(r.liderado_id); itens += pend; }
    });
    return { liderados: liderados.size, itens };
  }, [records]);

  const handleToggleTodo = async (recordId: string, todoId: string, current: boolean) => {
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

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  const reload = () => {
    if (!user) return;
    supabase
      .from("one_on_one")
      .select("id, data_reuniao, liderado_id, liderado_nome, gestor_id, anotacoes, one_on_one_todos(id, texto, concluido, responsavel, concluido_por_nome, concluido_em)")
      .neq("liderado_id", user.id)
      .order("data_reuniao", { ascending: false })
      .then(({ data }) => {
        const mapped: OneOnOneRecord[] = (data || []).map((r: any) => ({
          id: r.id, data_reuniao: r.data_reuniao, liderado_id: r.liderado_id,
          liderado_nome: r.liderado_nome, gestor_id: r.gestor_id, anotacoes: r.anotacoes,
          todos: (r.one_on_one_todos || []).map((t: any) => ({
            id: t.id, texto: t.texto, concluido: t.concluido, responsavel: t.responsavel,
            concluido_por_nome: t.concluido_por_nome ?? null, concluido_em: t.concluido_em ?? null,
          })),
        }));
        setRecords(mapped);
      });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from("one_on_one_todos").delete().eq("one_on_one_id", deleteTarget);
    const { error } = await supabase.from("one_on_one").delete().eq("id", deleteTarget);
    setDeleting(false);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget));
    toast({ title: "One-on-One excluído" });
    setDeleteTarget(null);
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Todas as reuniões
          </h1>
          <p className="text-muted-foreground mt-1">Acompanhe os 1:1 dos liderados e os próximos passos de cada um.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4 mr-2" /> Novo One-on-One
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigate("/one-on-one/novo")} className="cursor-pointer">
              <User className="h-4 w-4 mr-2" /> Reunião individual
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setBulkOpen(true)} className="cursor-pointer">
              <CalendarPlus className="h-4 w-4 mr-2" /> Agendar para o time
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <BulkOneOnOneDialog open={bulkOpen} onClose={() => setBulkOpen(false)} onCreated={reload} />

      {pendStats.itens > 0 && (
        <button
          onClick={() => setFilterPendencias("pending")}
          className="w-full sm:w-auto mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left hover:bg-amber-100/70 transition-colors"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-200 text-amber-800 font-bold">
            {pendStats.liderados}
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pendStats.liderados} {pendStats.liderados === 1 ? "liderado com itens em aberto" : "liderados com itens em aberto"}
            </p>
            <p className="text-xs text-amber-700">{pendStats.itens} próximo(s) passo(s) pendente(s) · clique para filtrar</p>
          </div>
        </button>
      )}

      <div className="mb-6 rounded-md border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
        <p>📋 <strong className="text-foreground">Como acompanhar:</strong> cada card é um 1:1 de um liderado. Os cards <span className="text-amber-700 font-medium">amarelos</span> têm próximos passos <strong className="text-foreground">pendentes</strong>.</p>
        <p>🔎 Use o filtro <strong className="text-foreground">Pendências → Com itens pendentes</strong> para ver só quem tem tarefa em aberto. Clique em <strong className="text-foreground">"Ver próximos passos"</strong> para abrir os itens e ver quem é o responsável e o que já foi concluído.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Liderado</label>
          <Select value={filterLiderado} onValueChange={setFilterLiderado}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {liderados.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            const canDelete = isAdmin || r.gestor_id === user?.id;
            return (
              <div
                key={r.id}
                className={`rounded-xl border p-4 transition-all relative ${cardCls}`}
              >
                {canDelete && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(r.id); }}
                    className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <div className="w-full text-left">
                  <div className="flex items-center justify-between gap-3 flex-wrap pr-8">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{formatDateBR(r.data_reuniao)}</span>
                      <span className="text-foreground font-semibold">{r.liderado_nome}</span>
                      {isAdmin && (
                        <span className="text-xs text-muted-foreground">
                          Líder: <span className="text-foreground">{gestorNames[r.gestor_id] || "—"}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {done}/{total} itens concluídos
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 break-words">{previewText}</p>
                </div>

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
                            return (
                              <li key={t.id} className="flex items-center gap-2 text-sm">
                                <OneOnOneTodoRow
                                  checked={t.concluido}
                                  onToggle={() => handleToggleTodo(r.id, t.id, t.concluido)}
                                  concluidoPorNome={t.concluido_por_nome}
                                  concluidoEm={t.concluido_em}
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
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/one-on-one/${r.id}`)}>
                    Visualizar one-on-one <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
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

export default OneOnOne;
