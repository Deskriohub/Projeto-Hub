import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Megaphone } from "lucide-react";

interface Notice {
  title: string;
  link: string;
}

const NOTICES_URL =
  "https://example.invalid/REPLACE_ME";

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  const lines = csv.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cols.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current);
    rows.push(cols);
  }
  return rows;
}

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(NOTICES_URL)
      .then((r) => r.text())
      .then((csv) => {
        const rows = parseCSV(csv);
        const headers = rows[0]?.map((h) => h.trim().toLowerCase()) || [];
        const data = rows.slice(1).map((r) => ({
          title: r[0]?.trim() || "",
          link: r[1]?.trim() || "",
        })).filter((n) => n.title);
        setNotices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
              {notices.map((notice, i) => (
                <div
                  key={i}
                  className="p-3 rounded-md bg-muted/50 border border-border/50 flex items-center justify-between gap-2"
                >
                  <p className="text-sm font-semibold text-foreground">{notice.title}</p>
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
