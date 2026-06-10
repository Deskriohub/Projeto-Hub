import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2, Pencil, Users, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { logAudit } from "@/lib/auditLog";
import { toast } from "@/hooks/use-toast";

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  dia_todo: boolean;
  visibilidade: string;
  criado_por: string | null;
  criador_nome?: string;
}

interface ReuniaoItem {
  id: string;
  titulo: string;
  data: string;
}

interface AvisoItem {
  id: string;
  titulo: string;
  data: string;
  link: string | null;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatMonthHeader(date: Date): string {
  const month = date.toLocaleDateString("pt-BR", { month: "long" });
  const year = date.getFullYear();
  return `${month.charAt(0).toUpperCase() + month.slice(1)}/${String(year).slice(-2)}`;
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EVENT_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-green-100 text-green-800 border-green-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-pink-100 text-pink-800 border-pink-200",
];

const REUNIAO_COLOR = "bg-indigo-100 text-indigo-800 border-indigo-200";
const AVISO_COLOR = "bg-amber-100 text-amber-800 border-amber-200";

function colorForEvent(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

const emptyForm = () => ({
  titulo: "",
  descricao: "",
  data_inicio: toDateStr(new Date()),
  data_fim: "",
  hora_inicio: "",
  hora_fim: "",
  dia_todo: true,
  visibilidade: "todos" as "todos" | "privado",
});

export function EventCalendar() {
  const { user } = useAuth();
  const { fullName } = useProfile();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [reunioes, setReunioes] = useState<ReuniaoItem[]>([]);
  const [avisos, setAvisos] = useState<AvisoItem[]>([]);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const startOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endOfMonth = `${year}-${String(month + 1).padStart(2, "0")}-31`;

    const [{ data: evData }, { data: reData }] = await Promise.all([
      supabase
        .from("eventos")
        .select("id, titulo, descricao, data_inicio, data_fim, hora_inicio, hora_fim, dia_todo, visibilidade, criado_por")
        .lte("data_inicio", endOfMonth)
        .gte("data_inicio", startOfMonth)
        .order("data_inicio", { ascending: true }),
      supabase
        .from("one_on_one")
        .select("id, data_reuniao, liderado_nome")
        .or(`gestor_id.eq.${user.id},liderado_id.eq.${user.id}`)
        .gte("data_reuniao", startOfMonth)
        .lte("data_reuniao", endOfMonth),
    ]);

    if (evData) {
      const userIds = Array.from(new Set((evData as any[]).map((e) => e.criado_por).filter(Boolean)));
      let nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        (profiles || []).forEach((p: any) => { nameMap[p.id] = p.full_name || ""; });
      }
      setEventos((evData as any[]).map((e) => ({
        ...e,
        criador_nome: e.criado_por ? (nameMap[e.criado_por] || "") : "",
      })));
    }

    if (reData) {
      setReunioes((reData as any[]).map((r) => ({
        id: r.id,
        titulo: `1:1 — ${r.liderado_nome}`,
        data: r.data_reuniao,
      })));
    }

    // Avisos com data definida (coluna data_evento) — tolerante caso a coluna não exista
    const { data: avData, error: avError } = await supabase
      .from("avisos")
      .select("id, titulo, link, data_evento")
      .not("data_evento", "is", null)
      .gte("data_evento", startOfMonth)
      .lte("data_evento", endOfMonth);

    if (!avError && avData) {
      setAvisos((avData as any[]).map((a) => ({
        id: a.id,
        titulo: a.titulo,
        data: a.data_evento,
        link: a.link ?? null,
      })));
    } else {
      setAvisos([]);
    }
  }, [year, month, user?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const eventsByDay = new Map<string, Evento[]>();
  for (const e of eventos) {
    const key = e.data_inicio;
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  }

  const reunioesByDay = new Map<string, ReuniaoItem[]>();
  for (const r of reunioes) {
    if (!reunioesByDay.has(r.data)) reunioesByDay.set(r.data, []);
    reunioesByDay.get(r.data)!.push(r);
  }

  const avisosByDay = new Map<string, AvisoItem[]>();
  for (const a of avisos) {
    if (!avisosByDay.has(a.data)) avisosByDay.set(a.data, []);
    avisosByDay.get(a.data)!.push(a);
  }

  const openNew = (dayStr: string) => {
    setEditingEvento(null);
    setForm({ ...emptyForm(), data_inicio: dayStr });
    setDialogOpen(true);
  };

  const openEdit = (e: Evento, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setEditingEvento(e);
    setForm({
      titulo: e.titulo,
      descricao: e.descricao || "",
      data_inicio: e.data_inicio,
      data_fim: e.data_fim || "",
      hora_inicio: e.hora_inicio || "",
      hora_fim: e.hora_fim || "",
      dia_todo: e.dia_todo,
      visibilidade: (e.visibilidade as "todos" | "privado") || "todos",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast({ title: "Título obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      hora_inicio: form.dia_todo ? null : (form.hora_inicio || null),
      hora_fim: form.dia_todo ? null : (form.hora_fim || null),
      dia_todo: form.dia_todo,
      visibilidade: form.visibilidade,
      criado_por: user?.id ?? null,
    };

    if (editingEvento) {
      const { error } = await supabase.from("eventos").update(payload).eq("id", editingEvento.id);
      if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); }
      else {
        if (user) logAudit(user.id, fullName, `Atualizou evento "${form.titulo}"`, "Calendário");
        toast({ title: "Evento atualizado" });
      }
    } else {
      const { error } = await supabase.from("eventos").insert(payload);
      if (error) { toast({ title: "Erro ao criar evento", description: error.message, variant: "destructive" }); }
      else {
        if (user) logAudit(user.id, fullName, `Criou evento "${form.titulo}" em ${form.data_inicio}`, "Calendário");
        toast({ title: "Evento criado" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!editingEvento) return;
    setDeleting(true);
    const { error } = await supabase.from("eventos").delete().eq("id", editingEvento.id);
    setDeleting(false);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); }
    else {
      if (user) logAudit(user.id, fullName, `Excluiu evento "${editingEvento.titulo}"`, "Calendário");
      toast({ title: "Evento excluído" });
      setDialogOpen(false);
      fetchAll();
    }
  };

  const canEditOrDelete = editingEvento && (editingEvento.criado_por === user?.id);

  const selectedDayEvts = selectedDay ? (eventsByDay.get(selectedDay) || []) : [];
  const selectedDayRe = selectedDay ? (reunioesByDay.get(selectedDay) || []) : [];
  const selectedDayAv = selectedDay ? (avisosByDay.get(selectedDay) || []) : [];

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-5">
          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-sm">Calendário</h3>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[120px] text-center">{formatMonthHeader(firstDay)}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDate(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-px">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-[10px] font-semibold text-muted-foreground text-center py-1">{wd}</div>
            ))}
            {cells.map((day, i) => {
              const dayStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dayEvts = dayStr ? (eventsByDay.get(dayStr) || []) : [];
              const dayRe = dayStr ? (reunioesByDay.get(dayStr) || []) : [];
              const dayAv = dayStr ? (avisosByDay.get(dayStr) || []) : [];
              const isSelected = dayStr === selectedDay;
              const totalItems = dayEvts.length + dayRe.length + dayAv.length;

              return (
                <div
                  key={i}
                  onClick={() => { if (!day) return; setSelectedDay(isSelected ? null : dayStr); }}
                  className={`min-h-[5rem] border rounded p-1 flex flex-col gap-0.5 transition-colors
                    ${day ? "cursor-pointer" : "bg-muted/30 border-transparent"}
                    ${isToday ? "ring-2 ring-primary/50 border-primary/30" : "border-border/50"}
                    ${isSelected ? "bg-primary/5" : day ? "bg-card hover:bg-accent/20" : ""}
                  `}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium leading-none
                          ${isToday ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center" : "text-foreground"}
                        `}>{day}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); openNew(dayStr); }}
                          className="opacity-0 hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-0.5 rounded"
                          style={{ opacity: isSelected ? 1 : undefined }}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {dayEvts.slice(0, 2).map((e) => (
                        <div
                          key={e.id}
                          onClick={(ev) => openEdit(e, ev)}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${colorForEvent(e.id)}`}
                          title={e.titulo}
                        >
                          {!e.dia_todo && e.hora_inicio ? `${e.hora_inicio.slice(0, 5)} ` : ""}{e.titulo}
                        </div>
                      ))}
                      {dayRe.slice(0, 1).map((r) => (
                        <div
                          key={r.id}
                          onClick={(ev) => { ev.stopPropagation(); navigate(`/meus-one-on-one/${r.id}`); }}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${REUNIAO_COLOR}`}
                          title={r.titulo}
                        >
                          👥 {r.titulo}
                        </div>
                      ))}
                      {dayAv.slice(0, 1).map((a) => (
                        <div
                          key={a.id}
                          onClick={(ev) => { ev.stopPropagation(); setSelectedDay(dayStr); }}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${AVISO_COLOR}`}
                          title={a.titulo}
                        >
                          📢 {a.titulo}
                        </div>
                      ))}
                      {totalItems > 3 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{totalItems - 3}</span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected day panel */}
          {selectedDay && (
            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
                </span>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openNew(selectedDay)}>
                  <Plus className="h-3 w-3 mr-1" /> Novo evento
                </Button>
              </div>
              {selectedDayEvts.length === 0 && selectedDayRe.length === 0 && selectedDayAv.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum evento. Clique em "Novo evento" para adicionar.</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayAv.map((a) => (
                    <div
                      key={a.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-md border ${AVISO_COLOR}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">📢</span>
                        <p className="text-sm font-medium truncate">{a.titulo}</p>
                      </div>
                      {a.link && (
                        <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-[10px] underline shrink-0" onClick={(e) => e.stopPropagation()}>
                          abrir →
                        </a>
                      )}
                    </div>
                  ))}
                  {selectedDayRe.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center justify-between gap-2 p-2 rounded-md border ${REUNIAO_COLOR} cursor-pointer hover:opacity-80`}
                      onClick={() => navigate(`/meus-one-on-one/${r.id}`)}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-sm font-medium truncate">{r.titulo}</p>
                      </div>
                      <span className="text-[10px] opacity-60 shrink-0">ver reunião →</span>
                    </div>
                  ))}
                  {selectedDayEvts.map((e) => (
                    <div key={e.id} className={`flex items-start justify-between gap-2 p-2 rounded-md border ${colorForEvent(e.id)}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-medium flex items-center gap-1">
                          {e.visibilidade === "privado" && <Lock className="h-3 w-3 opacity-60" />}
                          {e.titulo}
                        </p>
                        {!e.dia_todo && e.hora_inicio && (
                          <p className="text-xs opacity-70">{e.hora_inicio.slice(0, 5)}{e.hora_fim ? ` – ${e.hora_fim.slice(0, 5)}` : ""}</p>
                        )}
                        {e.descricao && <p className="text-xs opacity-70 mt-0.5">{e.descricao}</p>}
                        {e.criador_nome && <p className="text-[10px] opacity-50 mt-0.5">{e.criador_nome}</p>}
                      </div>
                      {e.criado_por === user?.id && (
                        <button onClick={(ev) => openEdit(e, ev)} className="shrink-0 p-1 rounded hover:bg-black/10">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEvento ? "Editar evento" : "Novo evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="evt-titulo">Título *</Label>
              <Input id="evt-titulo" value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Reunião de equipe" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="evt-inicio">Data início *</Label>
                <Input id="evt-inicio" type="date" value={form.data_inicio} onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="evt-fim">Data fim</Label>
                <Input id="evt-fim" type="date" value={form.data_fim} onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="evt-diatodo"
                type="checkbox"
                checked={form.dia_todo}
                onChange={(e) => setForm((f) => ({ ...f, dia_todo: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="evt-diatodo" className="cursor-pointer">Dia todo</Label>
            </div>
            {!form.dia_todo && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="evt-hora-inicio">Hora início</Label>
                  <Input id="evt-hora-inicio" type="time" value={form.hora_inicio} onChange={(e) => setForm((f) => ({ ...f, hora_inicio: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="evt-hora-fim">Hora fim</Label>
                  <Input id="evt-hora-fim" type="time" value={form.hora_fim} onChange={(e) => setForm((f) => ({ ...f, hora_fim: e.target.value }))} className="mt-1" />
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="evt-desc">Descrição</Label>
              <Textarea id="evt-desc" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} placeholder="Detalhes opcionais..." rows={2} className="mt-1 resize-none" />
            </div>
            <div>
              <Label htmlFor="evt-vis">Visibilidade</Label>
              <Select value={form.visibilidade} onValueChange={(v) => setForm((f) => ({ ...f, visibilidade: v as "todos" | "privado" }))}>
                <SelectTrigger id="evt-vis" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">📅 Mostrar no calendário (todos veem)</SelectItem>
                  <SelectItem value="privado">🔒 Só para mim (lembrete pessoal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 flex-wrap">
            {canEditOrDelete && (
              <Button variant="destructive" size="sm" disabled={deleting} onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />{deleting ? "Excluindo..." : "Excluir"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" disabled={saving} onClick={handleSave}>
              {saving ? "Salvando..." : editingEvento ? "Salvar" : "Criar evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
