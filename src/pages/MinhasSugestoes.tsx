import { useEffect, useState } from "react";
import { Lightbulb, Check, MessageSquare, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SugestaoModal } from "@/components/SugestaoModal";

interface Sugestao {
  id: string;
  created_at: string;
  texto: string;
  anonima: boolean;
  resposta: string | null;
  respondido_em: string | null;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MinhasSugestoes = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Sugestao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("sugestoes")
      .select("id, created_at, texto, anonima, resposta, respondido_em")
      .eq("autor_id", user.id)
      .order("created_at", { ascending: false });
    setItems((data as Sugestao[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Lightbulb className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Minhas Sugestões</h1>
            <p className="text-sm text-muted-foreground">Acompanhe suas sugestões e as respostas recebidas.</p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nova sugestão
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Você ainda não enviou sugestões (ou enviou de forma anônima, que não fica vinculada ao seu perfil).
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-muted-foreground">{formatDate(s.created_at)}</span>
                  {s.anonima && <Badge variant="outline" className="text-[10px] h-4">Anônima</Badge>}
                  {s.resposta ? (
                    <Badge variant="secondary" className="text-[10px] h-4 gap-1">
                      <Check className="h-2.5 w-2.5" /> Respondida
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground">Aguardando resposta</Badge>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{s.texto}</p>
                {s.resposta && (
                  <div className="mt-3 p-3 rounded-md bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageSquare className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary">Resposta da equipe</span>
                      {s.respondido_em && <span className="text-[10px] text-muted-foreground">· {formatDate(s.respondido_em)}</span>}
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{s.resposta}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SugestaoModal open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) load(); }} />
    </div>
  );
};

export default MinhasSugestoes;
