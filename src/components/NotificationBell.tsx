import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarClock, Megaphone, Users, MessageCircle, Lightbulb, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpcomingItems } from "@/hooks/useUpcomingItems";
import { useNotificacoes, Notificacao } from "@/hooks/useNotificacoes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { notificar } from "@/lib/notify";

const TIPO_ICON: Record<string, { icon: React.ElementType; color: string }> = {
  sugestao: { icon: Lightbulb,     color: "text-yellow-600" },
  feedback: { icon: MessageCircle, color: "text-purple-600" },
  aviso:    { icon: Megaphone,     color: "text-amber-600" },
  evento:   { icon: CalendarClock, color: "text-blue-600" },
  reuniao:  { icon: Users,         color: "text-indigo-600" },
  geral:    { icon: Bell,          color: "text-muted-foreground" },
};

function relativo(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, naoLidas, marcarLida, marcarTodasLidas, refetch } = useNotificacoes();
  const { items: compromissos, todayStr } = useUpcomingItems();
  const expiryRef = useRef(false);

  // Avisa o criador quando um aviso dele chega à data de fim (saiu do mural)
  useEffect(() => {
    if (!user || expiryRef.current) return;
    expiryRef.current = true;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("avisos")
        .select("id, titulo, data_fim, created_by")
        .eq("created_by", user.id)
        .not("data_fim", "is", null)
        .lt("data_fim", todayStr);
      if (cancelled || !data || data.length === 0) return;
      let criou = false;
      for (const a of data as Array<{ id: string; titulo: string }>) {
        const key = `aviso-fim-notif-${a.id}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "1");
        await notificar([user.id], {
          titulo: "📢 Seu aviso expirou",
          descricao: `O aviso "${a.titulo}" chegou à data de fim e saiu do mural.`,
          tipo: "aviso",
          link: "/avisos",
        });
        criou = true;
      }
      if (criou && !cancelled) refetch();
    })();
    return () => { cancelled = true; };
  }, [user, todayStr, refetch]);

  const handleClick = (n: Notificacao) => {
    if (!n.lida) marcarLida(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {naoLidas > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {naoLidas}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="text-sm font-semibold">Notificações</p>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={marcarTodasLidas}>
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Marcar todas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {/* Notificações */}
          {items.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <Bell className="h-7 w-7 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
            </div>
          ) : (
            <div className="py-1">
              {items.map((n) => {
                const info = TIPO_ICON[n.tipo] ?? TIPO_ICON.geral;
                const Icon = info.icon;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-left ${n.lida ? "" : "bg-primary/5"}`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${info.color}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${n.lida ? "text-foreground" : "font-semibold text-foreground"}`}>{n.titulo}</p>
                        {!n.lida && <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />}
                      </div>
                      {n.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{n.descricao}</p>}
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">{relativo(n.created_at)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Próximos compromissos */}
          {compromissos.length > 0 && (
            <div className="border-t">
              <p className="px-4 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Próximos compromissos</p>
              <div className="pb-1">
                {compromissos.slice(0, 6).map((c) => {
                  const info = TIPO_ICON[c.tipo] ?? TIPO_ICON.geral;
                  const Icon = info.icon;
                  const isToday = c.data === todayStr;
                  return (
                    <button
                      key={c.id}
                      onClick={() => c.rota ? navigate(c.rota) : c.link ? window.open(c.link, "_blank") : navigate("/")}
                      className="w-full flex items-start gap-3 px-4 py-2 hover:bg-accent/40 transition-colors text-left"
                    >
                      <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${info.color}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground truncate">{c.titulo}</p>
                        <p className={`text-xs ${isToday ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                          {isToday ? "Hoje" : c.data.split("-").reverse().slice(0, 2).join("/")}{c.hora ? ` · ${c.hora}` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
