import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Notice {
  id: string;
  titulo: string;
  link: string | null;
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("avisos")
      .select("id, titulo, link")
      .eq("ativo", true)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotices((data as Notice[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <Card className="animate-pulse h-48" />;

  return (
    <Card className="shadow-sm h-full">
      <CardContent className="p-5 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <Megaphone className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-foreground text-base">Mural de Avisos</h3>
        </div>
        <ScrollArea className="flex-1 -mr-2 pr-2">
          {notices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum aviso no momento
            </p>
          ) : (
            <div className="space-y-3">
              {notices.map((notice) => (
                <div
                  key={notice.id}
                  className="p-3 rounded-md bg-muted/50 border border-border/50 flex items-center justify-between gap-2"
                >
                  <p className="text-sm font-semibold text-foreground">{notice.titulo}</p>
                  {notice.link && (
                    <a
                      href={notice.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
                    >
                      Ver link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
