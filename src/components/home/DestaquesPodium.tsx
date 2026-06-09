import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, ChevronLeft, ChevronRight } from "lucide-react";

interface PodiumEntry {
  month: string;
  criteria: string;
  position: number;
  name: string;
  photo: string;
}

const SHEET_URL =
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

export function DestaquesPodium() {
  const [allData, setAllData] = useState<PodiumEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    fetch(SHEET_URL)
      .then((r) => r.text())
      .then((csv) => {
        const rows = parseCSV(csv);
        const data = rows.slice(1).map((r) => ({
          month: r[0] || "",
          criteria: r[1] || "",
          position: parseInt(r[2] || "0"),
          name: r[3] || "",
          photo: r[4] || "",
        }));
        setAllData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Months with all 3 positions filled, ordered as in sheet
  const completeMonths = useMemo(() => {
    const months: string[] = [];
    for (const d of allData) {
      if (d.month && !months.includes(d.month)) months.push(d.month);
    }
    return months.filter((m) => {
      const monthEntries = allData.filter((d) => d.month === m && d.name.trim());
      const positions = monthEntries.map((e) => e.position);
      return positions.includes(1) && positions.includes(2) && positions.includes(3);
    });
  }, [allData]);

  // Most recent is the last one in sheet order
  useEffect(() => {
    if (!selectedMonth && completeMonths.length > 0) {
      setSelectedMonth(completeMonths[completeMonths.length - 1]);
    }
  }, [completeMonths, selectedMonth]);

  const entries = useMemo(() => {
    if (!selectedMonth) return [];
    return allData
      .filter((d) => d.month === selectedMonth && d.name.trim())
      .sort((a, b) => a.position - b.position);
  }, [allData, selectedMonth]);

  if (loading) return <Card className="animate-pulse h-64" />;
  if (!entries.length) return null;

  const currentIdx = selectedMonth ? completeMonths.indexOf(selectedMonth) : -1;
  const canGoOlder = currentIdx > 0;
  const canGoNewer = currentIdx >= 0 && currentIdx < completeMonths.length - 1;

  const goOlder = () => canGoOlder && setSelectedMonth(completeMonths[currentIdx - 1]);
  const goNewer = () => canGoNewer && setSelectedMonth(completeMonths[currentIdx + 1]);

  const first = entries.find((e) => e.position === 1);
  const second = entries.find((e) => e.position === 2);
  const third = entries.find((e) => e.position === 3);

  const podiumOrder = [second, first, third];
  const heights = ["h-24", "h-36", "h-20"];
  const colors = ["bg-gray-300", "bg-yellow-400", "bg-amber-600"];
  const sizes = ["h-20 w-20", "h-28 w-28", "h-20 w-20"];

  return (
    <Card className="shadow-sm h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h3 className="font-bold text-foreground text-base">Destaque do Mês</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goOlder}
              disabled={!canGoOlder}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[80px] text-center">
              {selectedMonth?.replace(/^./, (c) => c.toUpperCase())}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goNewer}
              disabled={!canGoNewer}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-base font-medium text-muted-foreground mb-6 text-center italic">
          {entries[0]?.criteria}
        </p>

        <div className="flex items-end justify-center gap-6">
          {podiumOrder.map((entry, i) => {
            if (!entry) return <div key={i} className="w-24" />;
            return (
              <div key={entry.position} className="flex flex-col items-center gap-2">
                <Avatar className={sizes[i]}>
                  <AvatarImage src={entry.photo} alt={entry.name} />
                  <AvatarFallback className="text-sm">
                    {entry.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground">{entry.name}</span>
                <div
                  className={`w-24 ${heights[i]} ${colors[i]} rounded-t-md flex items-center justify-center`}
                >
                  <span className="text-xl font-bold text-foreground/80">
                    {entry.position}º
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
