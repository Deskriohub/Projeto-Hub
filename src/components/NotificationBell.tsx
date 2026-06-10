import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarClock, Megaphone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUpcomingItems, UpcomingItem } from "@/hooks/useUpcomingItems";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

function hojeStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const TIPO_INFO = {
  evento:  { icon: CalendarClock, color: "text-blue-600",   label: "Evento" },
  aviso:   { icon: Megaphone,     color: "text-amber-600",  label: "Aviso" },
  reuniao: { icon: Users,         color: "text-indigo-600", label: "Reunião 1:1" },
};

function formatRelative(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "Hoje";
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date(todayStr + "T12:00:00");
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 1) return "Amanhã";
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, todayItems, todayStr } = useUpcomingItems();
  const notifiedRef = useRef(false);

  // Avisa o criador quando um aviso dele chega à data de fim (saiu do mural)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const hoje = hojeStr();
      const { data } = await supabase
        .from("avisos")
        .select("id, titulo, data_fim, created_by")
        .eq("created_by", user.id)
        .not("data_fim", "is", null)
        .lt("data_fim", hoje);
      if (cancelled || !data) return;
      for (const a of data as Array<{ id: string; titulo: string }>) {
        const key = `aviso-expirado-${a.id}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "1");
        toast({
          title: "📢 Seu aviso expirou",
          description: `O aviso "${a.titulo}" chegou à data de fim e saiu do mural.`,
        });
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Toast na tela para itens de hoje — uma vez por dia
  useEffect(() => {
    if (notifiedRef.current || todayItems.length === 0) return;
    const key = `notif-shown-${todayStr}`;
    if (localStorage.getItem(key)) { notifiedRef.current = true; return; }

    notifiedRef.current = true;
    localStorage.setItem(key, "1");
    const titulos = todayItems.slice(0, 3).map((i) => i.titulo).join(", ");
    const extra = todayItems.length > 3 ? ` e mais ${todayItems.length - 3}` : "";
    toast({
      title: `🔔 Você tem ${todayItems.length} ${todayItems.length === 1 ? "compromisso" : "compromissos"} hoje`,
      description: `${titulos}${extra}`,
    });
  }, [todayItems, todayStr]);

  const handleClick = (item: UpcomingItem) => {
    if (item.rota) navigate(item.rota);
    else if (item.link) window.open(item.link, "_blank", "noopener");
    else navigate("/");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {todayItems.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {todayItems.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="px-4 py-3 border-b">
          <p className="text-sm font-semibold">Próximos compromissos</p>
          <p className="text-xs text-muted-foreground">Eventos, avisos e reuniões dos próximos 7 dias</p>
        </div>
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum compromisso próximo.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="py-1">
              {items.map((item) => {
                const info = TIPO_INFO[item.tipo];
                const Icon = info.icon;
                const isToday = item.data === todayStr;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleClick(item)}
                    className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors text-left"
                  >
                    <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${info.color}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{item.titulo}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${isToday ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                          {formatRelative(item.data, todayStr)}
                        </span>
                        {item.hora && <span className="text-xs text-muted-foreground">· {item.hora}</span>}
                        <span className="text-[10px] text-muted-foreground/60">{info.label}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
