import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Destaque {
  id: string;
  mes: string;
  criterio: string | null;
  posicao: number;
  nome: string;
  foto_url: string | null;
}

export function DestaquesPodium() {
  const [data, setData] = useState<Destaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("destaques")
      .select("id, mes, criterio, posicao, nome, foto_url")
      .order("created_at", { ascending: true })
      .then(({ data: rows }) => {
        setData((rows as Destaque[]) ?? []);
        setLoading(false);
      });
  }, []);

  const meses = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const d of data) {
      if (!seen.has(d.mes)) { seen.add(d.mes); list.push(d.mes); }
    }
    return list.filter((m) => {
      const entries = data.filter((d) => d.mes === m && d.nome.trim());
      const pos = entries.map((e) => e.posicao);
      return pos.includes(1) && pos.includes(2) && pos.includes(3);
    });
  }, [data]);

  useEffect(() => {
    if (!selectedMes && meses.length > 0) {
      setSelectedMes(meses[meses.length - 1]);
    }
  }, [meses, selectedMes]);

  const entries = useMemo(() => {
    if (!selectedMes) return [];
    return data.filter((d) => d.mes === selectedMes && d.nome.trim()).sort((a, b) => a.posicao - b.posicao);
  }, [data, selectedMes]);

  if (loading) return <Card className="animate-pulse h-64" />;

  if (!entries.length) {
    return (
      <Card className="shadow-sm h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 min-h-[200px]">
          <Trophy className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground text-center">
            Nenhum destaque cadastrado ainda.
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentIdx = meses.indexOf(selectedMes!);
  const goOlder = () => currentIdx > 0 && setSelectedMes(meses[currentIdx - 1]);
  const goNewer = () => currentIdx < meses.length - 1 && setSelectedMes(meses[currentIdx + 1]);

  const first  = entries.find((e) => e.posicao === 1);
  const second = entries.find((e) => e.posicao === 2);
  const third  = entries.find((e) => e.posicao === 3);

  const podiumOrder = [second, first, third];
  const heights = ["h-24", "h-36", "h-20"];
  const colors  = ["bg-gray-300", "bg-yellow-400", "bg-amber-600"];
  const sizes   = ["h-20 w-20", "h-28 w-28", "h-20 w-20"];

  return (
    <Card className="shadow-sm h-full">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            <h3 className="font-bold text-foreground text-base">Destaque do Mês</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goOlder} disabled={currentIdx <= 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground min-w-[80px] text-center">
              {selectedMes?.replace(/^./, (c) => c.toUpperCase())}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNewer} disabled={currentIdx >= meses.length - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-base font-medium text-muted-foreground mb-6 text-center italic">
          {entries[0]?.criterio}
        </p>
        <div className="flex items-end justify-center gap-6">
          {podiumOrder.map((entry, i) => {
            if (!entry) return <div key={i} className="w-24" />;
            return (
              <div key={entry.posicao} className="flex flex-col items-center gap-2">
                <Avatar className={sizes[i]}>
                  <AvatarImage src={entry.foto_url ?? ""} alt={entry.nome} />
                  <AvatarFallback className="text-sm">{entry.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-semibold text-foreground text-center">{entry.nome}</span>
                <div className={`w-24 ${heights[i]} ${colors[i]} rounded-t-md flex items-center justify-center`}>
                  <span className="text-xl font-bold text-foreground/80">{entry.posicao}º</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
