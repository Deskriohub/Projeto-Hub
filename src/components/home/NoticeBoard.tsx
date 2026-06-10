import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface Notice {
  id: string;
  titulo: string;
  link: string | null;
  observacao: string | null;
  publico: string;
}

export function NoticeBoard() {
  const { role } = useUserRole();
  const isAdmin = role === "admin";
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notice | null>(null);

  useEffect(() => {
    supabase
      .from("avisos")
      .select("id, titulo, link, observacao, publico")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const all = (data as Notice[]) ?? [];
        setNotices(isAdmin ? all : all.filter((n) => n.publico === "todos"));
        setLoading(false);
      });
  }, [isAdmin]);

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
                    className="p-3 rounded-md bg-muted/50 border border-border/50 flex items-center justify-between gap-2 cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <p className="text-sm font-semibold text-foreground truncate">{notice.titulo}</p>
                    {notice.link && (
                      <a href={notice.link} target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
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
