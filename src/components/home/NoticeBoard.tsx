import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Notice {
  id: string;
  titulo: string;
  link: string | null;
  observacao: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  destinatarios: string[] | null;
  created_by: string | null;
}

function todayStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtDiaMes(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export function NoticeBoard() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notice | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("avisos")
      .select("id, titulo, link, observacao, data_inicio, data_fim, destinatarios, created_by")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const hoje = todayStr();
        const all = (data as Notice[]) ?? [];
        const visiveis = all.filter((n) => {
          // direcionamento: sem destinatários = todos; com destinatários = só quem está na lista (ou o criador)
          const paraMim = n.created_by === user.id || !n.destinatarios || n.destinatarios.length === 0 || n.destinatarios.includes(user.id);
          // some só quando passa do fim — avisos agendados (início futuro) já aparecem aqui,
          // igual ao calendário, marcados como "a partir de" (consistência entre mural e calendário)
          const naoExpirou = !n.data_fim || n.data_fim >= hoje;
          return paraMim && naoExpirou;
        });
        setNotices(visiveis);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <Card className="animate-pulse h-32" />;

  return (
    <>
      <Card className="shadow-sm">
        <CardContent className="p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-base">Mural de Avisos</h3>
          </div>
          <ScrollArea className="max-h-48 -mr-2 pr-2">
            {notices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum aviso no momento</p>
            ) : (
              <div className="space-y-2">
                {notices.map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => setSelected(notice)}
                    className="p-3 rounded-md bg-muted/50 border border-border/50 flex items-start justify-between gap-2 cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-foreground truncate">{notice.titulo}</p>
                        {notice.data_inicio && notice.data_inicio > todayStr() && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">
                            a partir de {fmtDiaMes(notice.data_inicio)}
                          </span>
                        )}
                      </div>
                      {notice.observacao && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notice.observacao}</p>
                      )}
                    </div>
                    {notice.link && (
                      <a href={notice.link} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0 mt-0.5">
                        Ver link <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> {selected?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selected?.observacao && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selected.observacao}</p>
            )}
            {selected?.link && (
              <a href={selected.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                <ExternalLink className="h-4 w-4" /> Abrir link
              </a>
            )}
            {!selected?.observacao && !selected?.link && (
              <p className="text-sm text-muted-foreground">Sem detalhes adicionais.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
