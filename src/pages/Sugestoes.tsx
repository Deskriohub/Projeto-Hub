import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface Sugestao {
  id: string;
  created_at: string;
  texto: string;
  anonima: boolean;
  autor_nome: string | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const Sugestoes = () => {
  const [items, setItems] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("sugestoes")
        .select("id, created_at, texto, anonima, autor_nome")
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Erro ao carregar sugestões.");
      } else {
        setItems((data as Sugestao[]) || []);
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Lightbulb className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sugestões</h1>
          <p className="text-sm text-muted-foreground">Sugestões enviadas pela equipe.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[170px]">Data</TableHead>
                <TableHead>Sugestão</TableHead>
                <TableHead className="w-[220px]">Autor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhuma sugestão recebida ainda.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(s.created_at)}
                    </TableCell>
                    <TableCell className="whitespace-pre-wrap text-sm">{s.texto}</TableCell>
                    <TableCell className="text-sm">
                      {s.anonima ? (
                        <span className="italic text-muted-foreground">Anônimo</span>
                      ) : (
                        s.autor_nome || "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Sugestoes;
