import { useEffect, useState, useCallback } from "react";
import { CalendarRange, Plus, Lock, Users, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EventoDialog, Evento } from "@/components/EventoDialog";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function labelMes(ym: string): string {
  const [y, m] = ym.split("-");
  return `${MESES[parseInt(m, 10) - 1]} ${y}`;
}
function diaDoMes(dateStr: string): string {
  return dateStr.split("-")[2];
}

const Eventos = () => {
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Evento | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("eventos")
      .select("*")
      .order("data_inicio", { ascending: true });
    if (error) { console.error("[Eventos]", error.message); setEventos([]); }
    else setEventos((data as any[]).map((e) => ({
      ...e,
      visibilidade: e.visibilidade ?? "todos",
      participantes: e.participantes ?? null,
    })) as Evento[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Agrupa por ano-mês mantendo a ordem cronológica
  const grupos: { ym: string; itens: Evento[] }[] = [];
  for (const e of eventos) {
    const ym = e.data_inicio.slice(0, 7);
    let g = grupos.find((x) => x.ym === ym);
    if (!g) { g = { ym, itens: [] }; grupos.push(g); }
    g.itens.push(e);
  }

  const openNew = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (e: Evento) => { setEditing(e); setDialogOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <CalendarRange className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Eventos</h1>
            <p className="text-sm text-muted-foreground">Crie e gerencie eventos. Eles aparecem automaticamente no calendário.</p>
          </div>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo Evento
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : eventos.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum evento ainda. Clique em "Novo Evento" para criar.</p>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <div key={g.ym}>
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-2">{labelMes(g.ym)}</h2>
              <div className="space-y-2">
                {g.itens.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => openEdit(e)}
                    className="w-full text-left rounded-lg border border-border bg-card p-3 hover:bg-accent/30 transition-colors flex items-start gap-3"
                  >
                    <div className="flex flex-col items-center justify-center rounded-md bg-primary/10 text-primary px-3 py-1.5 shrink-0 min-w-[3rem]">
                      <span className="text-lg font-bold leading-none">{diaDoMes(e.data_inicio)}</span>
                      <span className="text-[10px] uppercase">{MESES[parseInt(e.data_inicio.split("-")[1], 10) - 1].slice(0, 3)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{e.titulo}</p>
                        {e.visibilidade === "privado" && (
                          <Badge variant="outline" className="text-[10px] h-4 gap-1"><Lock className="h-2.5 w-2.5" /> Só você</Badge>
                        )}
                        {e.participantes && e.participantes.length > 0 && (
                          <Badge variant="secondary" className="text-[10px] h-4 gap-1"><Users className="h-2.5 w-2.5" /> {e.participantes.length}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        {!e.dia_todo && e.hora_inicio && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {e.hora_inicio.slice(0, 5)}{e.hora_fim ? ` – ${e.hora_fim.slice(0, 5)}` : ""}
                          </span>
                        )}
                        {e.data_fim && e.data_fim !== e.data_inicio && (
                          <span>até {e.data_fim.split("-").reverse().join("/")}</span>
                        )}
                      </div>
                      {e.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{e.descricao}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <EventoDialog open={dialogOpen} onClose={() => setDialogOpen(false)} editing={editing} onSaved={load} />
    </div>
  );
};

export default Eventos;
