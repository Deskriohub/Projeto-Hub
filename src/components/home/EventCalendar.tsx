import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CalEvent {
  date: Date;
  label: string;
  emoji: string;
}

interface AbsenceItem {
  tipo: string;
  nome: string;
  inicio: Date;
  fim: Date | null;
}

const EVENTS_URL =
  "https://example.invalid/REPLACE_ME";

const ABSENCES_URL =
  "https://example.invalid/REPLACE_ME";

function getEmoji(event: string): string {
  const lower = event.toLowerCase();
  if (lower.includes("feriado") || lower.includes("holiday")) return "😎";
  if (lower.includes("folga") || lower.includes("day-off") || lower.includes("day off")) return "😎";
  if (lower.includes("happy hour")) return "🍺";
  if (lower.includes("café") || lower.includes("cafe") || lower.includes("coffee")) return "☕";
  if (lower.includes("aniversário") || lower.includes("aniversario") || lower.includes("birthday")) {
    if (lower.includes("time") || lower.includes("empresa")) return "🎉";
    return "🥳";
  }
  return "📌";
}

function parseDate(str: string): Date | null {
  const parts = str.trim().split("/");
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
}

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

function formatShortDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function formatMonthHeader(date: Date): string {
  const month = date.toLocaleDateString("pt-BR", { month: "long" });
  const year = date.getFullYear();
  const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);
  return `${capitalizedMonth}/${String(year).slice(-2)}`;
}

function formatPopupDate(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    .replace(/ De /g, " de ");
}

export function EventCalendar() {
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [absences, setAbsences] = useState<AbsenceItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    fetch(EVENTS_URL)
      .then((r) => r.text())
      .then((csv) => {
        const rows = parseCSV(csv);
        const parsed: CalEvent[] = [];
        for (const row of rows.slice(1)) {
          const date = parseDate(row[0] || "");
          if (date) {
            parsed.push({ date, label: row[1] || "", emoji: getEmoji(row[1] || "") });
          }
        }
        setEvents(parsed);
      })
      .catch(() => {});

    fetch(ABSENCES_URL)
      .then((r) => r.text())
      .then((csv) => {
        const rows = parseCSV(csv);
        const parsed: AbsenceItem[] = [];
        for (const row of rows.slice(1)) {
          const tipo = (row[0] || "").trim();
          const nome = (row[1] || "").trim();
          const inicio = parseDate(row[2] || "");
          const fim = parseDate(row[3] || "");
          if (tipo && nome && inicio) {
            parsed.push({ tipo, nome, inicio, fim });
          }
        }
        setAbsences(parsed);
      })
      .catch(() => {});
  }, []);

  const today = new Date();
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const eventsMap = new Map<number, CalEvent[]>();
  for (const e of events) {
    if (e.date.getMonth() === month && e.date.getFullYear() === year) {
      const day = e.date.getDate();
      if (!eventsMap.has(day)) eventsMap.set(day, []);
      eventsMap.get(day)!.push(e);
    }
  }

  // Filter absences for the viewed month
  const viewYM = year * 12 + month;

  const ferias = absences
    .filter((a) => {
      if (a.tipo.toLowerCase() !== "férias") return false;
      const startYM = a.inicio.getFullYear() * 12 + a.inicio.getMonth();
      const endDate = a.fim || a.inicio;
      const endYM = endDate.getFullYear() * 12 + endDate.getMonth();
      return viewYM >= startYM && viewYM <= endYM;
    })
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  const dayOffs = absences
    .filter((a) => {
      if (a.tipo.toLowerCase() !== "day off") return false;
      return a.inicio.getFullYear() === year && a.inicio.getMonth() === month;
    })
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedDateLabel = selectedDay ? formatPopupDate(year, month, selectedDay) : "";
  const selectedDayEvents = selectedDay ? eventsMap.get(selectedDay) : undefined;

  const goToPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const hasAbsences = ferias.length > 0 || dayOffs.length > 0;

  return (
    <>
      <Card className="shadow-sm flex-1 h-full">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-sm">Calendário do Mês</h3>
            <div className="ml-auto flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToPrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[120px] text-center">
                {formatMonthHeader(firstDay)}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="text-[10px] font-semibold text-muted-foreground text-center py-1"
              >
                {wd}
              </div>
            ))}
            {cells.map((day, i) => {
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const dayEvents = day ? eventsMap.get(day) : undefined;

              return (
                <div
                  key={i}
                  onClick={() => day && setSelectedDay(day)}
                  className={`min-h-[4.5rem] border border-border/50 rounded p-1 flex flex-col ${
                    day ? "bg-card cursor-pointer hover:bg-accent/30 transition-colors" : "bg-muted/30"
                  } ${isToday ? "ring-2 ring-primary/50" : ""}`}
                >
                  {day && (
                    <>
                      <span
                        className={`text-[11px] font-medium ${
                          isToday
                            ? "bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center"
                            : "text-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      {dayEvents?.map((ev, j) => (
                        <span
                          key={j}
                          className="text-[11px] leading-tight text-muted-foreground mt-0.5 truncate"
                          title={ev.label}
                        >
                          {ev.label}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {hasAbsences && (
            <>
              <Separator className="my-4" />
              <div className={`grid gap-4 ${ferias.length > 0 && dayOffs.length > 0 ? "grid-cols-[1fr_auto_1fr]" : "grid-cols-1"}`}>
                {ferias.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">🏖️ Férias</h4>
                    <div className="space-y-1">
                      {ferias.map((a, i) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const start = new Date(a.inicio); start.setHours(0, 0, 0, 0);
                        const end = new Date(a.fim || a.inicio); end.setHours(0, 0, 0, 0);
                        const active = today >= start && today <= end;
                        return (
                          <p key={i} className={`text-xs text-foreground ${active ? "font-bold" : ""}`}>
                            {a.nome} — {formatShortDate(a.inicio)}{a.fim ? ` a ${formatShortDate(a.fim)}` : ""}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
                {ferias.length > 0 && dayOffs.length > 0 && (
                  <Separator orientation="vertical" className="h-auto" />
                )}
                {dayOffs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2">🌴 Day Off</h4>
                    <div className="space-y-1">
                      {dayOffs.map((a, i) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const d = new Date(a.inicio); d.setHours(0, 0, 0, 0);
                        const active = today.getTime() === d.getTime();
                        return (
                          <p key={i} className={`text-xs text-foreground ${active ? "font-bold" : ""}`}>
                            {a.nome} — {formatShortDate(a.inicio)}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedDay !== null} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDateLabel}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {selectedDayEvents && selectedDayEvents.length > 0 ? (
              <div className="space-y-3 pr-4">
                {selectedDayEvents.map((ev, j) => (
                  <div key={j} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                    <span className="text-sm text-foreground">{ev.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum evento neste dia
              </p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}