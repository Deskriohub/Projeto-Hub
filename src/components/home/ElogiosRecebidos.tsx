import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Smile, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

interface Elogio {
  id: string;
  created_at: string;
  remetente_nome: string;
  destinatario_nome: string;
  mensagem: string;
  emoji: string;
  publico: boolean;
}

export const ElogiosRecebidos = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Elogio[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"recebidos" | "todos">("recebidos");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoaded(false);
      let query = supabase
        .from("elogios")
        .select("id, created_at, remetente_nome, destinatario_nome, mensagem, emoji, publico");
      if (view === "recebidos") {
        query = query.eq("destinatario_id", user.id);
      } else {
        query = query.eq("publico", true);
      }
      const { data } = await query.order("created_at", { ascending: false }).limit(5);
      setItems((data as Elogio[]) || []);
      setLoaded(true);
    };
    load();
  }, [user, view]);

  if (!loaded) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2"><Smile className="h-5 w-5 text-primary" /> Mural de Elogios</h2>
        <div className="inline-flex rounded-md border border-border bg-background p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setView("recebidos")}
            className={`px-3 py-1 rounded-sm font-medium transition-colors ${view === "recebidos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Recebidos
          </button>
          <button
            type="button"
            onClick={() => setView("todos")}
            className={`px-3 py-1 rounded-sm font-medium transition-colors ${view === "todos" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Todos
          </button>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {view === "recebidos" ? "Você ainda não recebeu elogios." : "Nenhum elogio público ainda."}
        </p>
      ) : (
      <div className="grid gap-2">
        {items.map((el) => (
          <div key={el.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="text-2xl shrink-0">{el.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap text-sm">
                <span className="font-semibold text-foreground">{el.remetente_nome}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-semibold text-foreground">{el.destinatario_nome}</span>
                {!el.publico && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" /> Privado
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground mt-1 break-words whitespace-pre-wrap">{el.mensagem}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(el.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          </div>
        ))}
      </div>
      )}
      <Link
        to="/mural-elogios"
        className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
      >
        Ver mural de elogios →
      </Link>
    </div>
  );
};
