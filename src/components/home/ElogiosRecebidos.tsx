import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Smile, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ElogioAnexo } from "@/components/elogios/ElogioAnexo";
import { categoriaDisplay } from "@/lib/elogios";

interface Elogio {
  id: string;
  created_at: string;
  remetente_id: string;
  destinatario_id: string | null;
  remetente_nome: string;
  destinatario_nome: string | null;
  mensagem: string | null;
  emoji: string;
  publico: boolean;
  origem: string;
  cliente_nome: string | null;
  categoria: string | null;
  categoria_detalhe: string | null;
  anexo_url: string | null;
  anexo_tipo: string | null;
  anexo_nome: string | null;
}

function getInitials(name: string): string {
  const parts = (name || "").trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const ElogiosRecebidos = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Elogio[]>([]);
  const [avatarMap, setAvatarMap] = useState<Record<string, string | null>>({});
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"recebidos" | "todos">("recebidos");
  const [selected, setSelected] = useState<Elogio | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoaded(false);
      let query = supabase
        .from("elogios")
        .select("id, created_at, remetente_id, destinatario_id, remetente_nome, destinatario_nome, mensagem, emoji, publico, origem, cliente_nome, categoria, categoria_detalhe, anexo_url, anexo_tipo, anexo_nome");
      if (view === "recebidos") {
        query = query.eq("destinatario_id", user.id);
      } else {
        query = query.eq("publico", true);
      }
      const { data } = await query.order("created_at", { ascending: false }).limit(5);
      const list = (data as Elogio[]) || [];
      setItems(list);

      const ids = Array.from(new Set(list.flatMap((e) => [e.remetente_id, e.destinatario_id]).filter(Boolean)));
      if (ids.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, avatar_url").in("id", ids);
        const map: Record<string, string | null> = {};
        (profiles as any[] || []).forEach((p) => { map[p.id] = p.avatar_url ?? null; });
        setAvatarMap(map);
      }
      setLoaded(true);
    };
    load();
  }, [user, view]);

  if (!loaded) return null;

  const miniAvatar = (id: string, nome: string) => (
    <Avatar className="h-6 w-6 shrink-0">
      <AvatarImage src={avatarMap[id] ?? ""} alt={nome} />
      <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">{getInitials(nome)}</AvatarFallback>
    </Avatar>
  );

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
          <button
            key={el.id}
            onClick={() => setSelected(el)}
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3 text-left hover:bg-accent/30 transition-colors"
          >
            <div className="text-2xl shrink-0">{el.origem === "cliente" ? "💬" : el.emoji}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap text-sm">
                {el.origem === "cliente" ? (
                  <>
                    <span className="font-semibold text-foreground">Cliente: {el.cliente_nome || "—"}</span>
                    <Badge variant="outline" className="text-xs">{categoriaDisplay(el.categoria, el.categoria_detalhe)}</Badge>
                    {el.destinatario_nome && (
                      <>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{el.destinatario_nome}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {miniAvatar(el.remetente_id, el.remetente_nome)}
                    <span className="font-semibold text-foreground">{el.remetente_nome}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    {miniAvatar(el.destinatario_id ?? "", el.destinatario_nome ?? "")}
                    <span className="font-semibold text-foreground">{el.destinatario_nome}</span>
                  </>
                )}
                {!el.publico && (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" /> Privado
                  </Badge>
                )}
              </div>
              {el.mensagem && <p className="text-sm text-foreground mt-1 break-words whitespace-pre-wrap line-clamp-2">{el.mensagem}</p>}
              {el.origem === "cliente" && el.anexo_url && (
                <p className="text-xs text-primary mt-1">📎 {el.anexo_tipo === "imagem" ? "Imagem" : el.anexo_tipo === "video" ? "Vídeo" : "Áudio"} anexado</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(el.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
          </button>
        ))}
      </div>
      )}
      <Link
        to="/mural-elogios"
        className="inline-block mt-3 text-sm font-medium text-primary hover:underline"
      >
        Ver mural de elogios →
      </Link>

      {/* Detalhe com fotos grandes */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selected?.emoji}</span> Elogio
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {selected.origem === "cliente" ? (
                <div className="text-center">
                  <p className="font-semibold text-foreground">Cliente: {selected.cliente_nome || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {categoriaDisplay(selected.categoria, selected.categoria_detalhe)}
                    {selected.destinatario_nome ? ` · sobre ${selected.destinatario_nome}` : ""}
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarMap[selected.remetente_id] ?? ""} alt={selected.remetente_nome} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(selected.remetente_nome)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-center">{selected.remetente_nome}</span>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-col items-center gap-1">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={avatarMap[selected.destinatario_id ?? ""] ?? ""} alt={selected.destinatario_nome ?? ""} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(selected.destinatario_nome ?? "?")}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-center">{selected.destinatario_nome}</span>
                  </div>
                </div>
              )}
              {selected.mensagem && <p className="text-sm text-foreground whitespace-pre-wrap p-3 bg-muted/40 rounded-md text-center">{selected.mensagem}</p>}
              <ElogioAnexo url={selected.anexo_url} tipo={selected.anexo_tipo} nome={selected.anexo_nome} />
              <p className="text-xs text-muted-foreground text-center">{new Date(selected.created_at).toLocaleString("pt-BR")}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
