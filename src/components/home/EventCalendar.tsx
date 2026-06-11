import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Users, Lock, Pencil, Megaphone, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EventoDialog, Evento } from "@/components/EventoDialog";

interface ReuniaoItem { id: string; titulo: string; data: string; hora: string | null; }
interface AvisoItem { id: string; titulo: string; data: string; link: string | null; observacao: string | null; }

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatMonthHeader(date: Date): string {
  const month = date.toLocaleDateString("pt-BR", { month: "long" });
  return `${month.charAt(0).toUpperCase() + month.slice(1)}/${String(date.getFullYear()).slice(-2)}`;
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

export function EventCalendar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [reunioes, setReunioes] = useState<ReuniaoItem[]>([]);
  const [avisos, setAvisos] = useState<AvisoItem[]>([]);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [newDate, setNewDate] = useState<string | undefined>(undefined);
  const [avisoSel, setAvisoSel] = useState<AvisoItem | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const pad = (n: number) => String(n).padStart(2, "0");
    const lastDayNum = new Date(year, month + 1, 0).getDate();
    const startOfMonth = `${year}-${pad(month + 1)}-01`;
    const endOfMonth = `${year}-${pad(month + 1)}-${pad(lastDayNum)}`;

    const { data: evData, error: evError } = await supabase
      .from("eventos").select("*")
      .gte("data_inicio", startOfMonth).lte("data_inicio", endOfMonth)
      .order("data_inicio", { ascending: true });
    if (evError) { console.error("[Calendário] eventos:", evError.message); setEventos([]); }
    else if (evData) {
      const userIds = Array.from(new Set((evData as any[]).map((e) => e.criado_por).filter(Boolean)));
      const nameMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
        (profs || []).forEach((p: any) => { nameMap[p.id] = p.full_name || ""; });
      }
      setEventos((evData as any[]).map((e) => ({
        ...e,
        visibilidade: e.visibilidade ?? "todos",
        participantes: e.participantes ?? null,
        criador_nome: e.criado_por ? (nameMap[e.criado_por] || "") : "",
      })));
    }

    const { data: reData, error: reError } = await supabase
      .from("one_on_one").select("id, data_reuniao, hora_reuniao, liderado_nome")
      .or(`gestor_id.eq.${user.id},liderado_id.eq.${user.id}`)
      .gte("data_reuniao", startOfMonth).lte("data_reuniao", endOfMonth);
    if (reError) { console.error("[Calendário] reuniões:", reError.message); setReunioes([]); }
    else if (reData) {
      setReunioes((reData as any[]).map((r) => ({
        id: r.id, titulo: `1:1 — ${r.liderado_nome}`, data: r.data_reuniao,
        hora: r.hora_reuniao ? r.hora_reuniao.slice(0, 5) : null,
      })));
    }

    const { data: avData, error: avError } = await supabase.from("avisos").select("*");
    if (avError) { console.error("[Calendário] avisos:", avError.message); setAvisos([]); }
    else if (avData) {
      const comData = (avData as any[]).filter(
        (a) => a.data_inicio && a.data_inicio >= startOfMonth && a.data_inicio <= endOfMonth
          && (!a.destinatarios || a.destinatarios.length === 0 || a.destinatarios.includes(user.id) || a.created_by === user.id)
      );
      setAvisos(comData.map((a) => ({ id: a.id, titulo: a.titulo, data: a.data_inicio, link: a.link ?? null, observacao: a.observacao ?? null })));
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
    if (!eventsByDay.has(e.data_inicio)) eventsByDay.set(e.data_inicio, []);
    eventsByDay.get(e.data_inicio)!.push(e);
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

  const openNew = (dayStr: string) => { setEditingEvento(null); setNewDate(dayStr); setDialogOpen(true); };
  const openEdit = (e: Evento, ev: React.MouseEvent) => { ev.stopPropagation(); setEditingEvento(e); setNewDate(undefined); setDialogOpen(true); };

  const selectedDayEvts = selectedDay ? (eventsByDay.get(selectedDay) || []) : [];
  const selectedDayRe = selectedDay ? (reunioesByDay.get(selectedDay) || []) : [];
  const selectedDayAv = selectedDay ? (avisosByDay.get(selectedDay) || []) : [];

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-5">
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
                <div key={i}
                  onClick={() => { if (!day) return; setSelectedDay(isSelected ? null : dayStr); }}
                  className={`min-h-[5rem] border rounded p-1 flex flex-col gap-0.5 transition-colors
                    ${day ? "cursor-pointer" : "bg-muted/30 border-transparent"}
                    ${isToday ? "ring-2 ring-primary/50 border-primary/30" : "border-border/50"}
                    ${isSelected ? "bg-primary/5" : day ? "bg-card hover:bg-accent/20" : ""}`}
                >
                  {day && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-medium leading-none
                          ${isToday ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center" : "text-foreground"}`}>{day}</span>
                        <button onClick={(e) => { e.stopPropagation(); openNew(dayStr); }}
                          className="opacity-0 hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-0.5 rounded"
                          style={{ opacity: isSelected ? 1 : undefined }}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      {dayEvts.slice(0, 2).map((e) => (
                        <div key={e.id} onClick={(ev) => openEdit(e, ev)}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${colorForEvent(e.id)}`} title={e.titulo}>
                          {!e.dia_todo && e.hora_inicio ? `${e.hora_inicio.slice(0, 5)} ` : ""}{e.titulo}
                        </div>
                      ))}
                      {dayRe.slice(0, 1).map((r) => (
                        <div key={r.id} onClick={(ev) => { ev.stopPropagation(); navigate(`/meus-one-on-one/${r.id}`); }}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${REUNIAO_COLOR}`} title={r.titulo}>
                          👥 {r.titulo}
                        </div>
                      ))}
                      {dayAv.slice(0, 1).map((a) => (
                        <div key={a.id} onClick={(ev) => { ev.stopPropagation(); setAvisoSel(a); }}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${AVISO_COLOR}`} title={a.titulo}>
                          📢 {a.titulo}
                        </div>
                      ))}
                      {totalItems > 3 && (<span className="text-[10px] text-muted-foreground pl-1">+{totalItems - 3}</span>)}
                    </>
                  )}
                </div>
              );
            })}
          </div>

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
                    <div key={a.id} onClick={() => setAvisoSel(a)}
                      className={`flex items-center justify-between gap-2 p-2 rounded-md border cursor-pointer hover:opacity-90 ${AVISO_COLOR}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">📢</span>
                        <p className="text-sm font-medium truncate">{a.titulo}</p>
                      </div>
                      <span className="text-[10px] opacity-60 shrink-0">ver aviso →</span>
                    </div>
                  ))}
                  {selectedDayRe.map((r) => (
                    <div key={r.id} className={`flex items-center justify-between gap-2 p-2 rounded-md border ${REUNIAO_COLOR} cursor-pointer hover:opacity-80`} onClick={() => navigate(`/meus-one-on-one/${r.id}`)}>
                      <div className="flex items-center gap-2 min-w-0">
                        <Users className="h-3.5 w-3.5 shrink-0" />
                        <p className="text-sm font-medium truncate">{r.titulo}{r.hora ? ` · ${r.hora}` : ""}</p>
                      </div>
                      <span className="text-[10px] opacity-60 shrink-0">ver reunião →</span>
                    </div>
                  ))}
                  {selectedDayEvts.map((e) => (
                    <div key={e.id} className={`flex items-start justify-between gap-2 p-2 rounded-md border cursor-pointer hover:opacity-90 ${colorForEvent(e.id)}`}
                      onClick={(ev) => openEdit(e, ev)}>
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
                      <Pencil className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <EventoDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        editing={editingEvento}
        defaultDate={newDate}
        onSaved={fetchAll}
      />

      <Dialog open={!!avisoSel} onOpenChange={(o) => !o && setAvisoSel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> {avisoSel?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {avisoSel?.observacao ? (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{avisoSel.observacao}</p>
            ) : (
              <p className="text-sm text-muted-foreground">Sem descrição adicional.</p>
            )}
            {avisoSel?.link && (
              <a href={avisoSel.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                <ExternalLink className="h-4 w-4" /> Abrir link
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
