import { useEffect, useState } from "react";
import { Smile, Trash2, Lock, ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { ElogioReacoes } from "@/components/elogios/ElogioReacoes";

interface Elogio {
  id: string;
  created_at: string;
  remetente_id: string;
  remetente_nome: string;
  destinatario_id: string;
  destinatario_nome: string;
  mensagem: string;
  emoji: string;
  publico: boolean;
}

const MuralElogios = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [elogios, setElogios] = useState<Elogio[]>([]);
  const [filter, setFilter] = useState<"todos" | "recebidos" | "enviados">("todos");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("elogios")
      .select("*")
      .order("created_at", { ascending: false });
    setElogios((data as Elogio[]) || []);
  };

  useEffect(() => {
    load();
  }, [user]);

  const canDelete = (el: Elogio) =>
    !!user && (el.remetente_id === user.id || el.destinatario_id === user.id || role === "admin");

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("elogios").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setElogios((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Smile className="h-6 w-6 text-primary" /> Mural de Elogios
          </h1>
          <p className="text-muted-foreground mt-1">Reconhecimentos compartilhados pelo time</p>
        </div>
        <Button
          onClick={() => navigate("/elogios")}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> Novo Elogio
        </Button>
      </div>

      <div className="mb-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as "todos" | "recebidos" | "enviados")}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="recebidos">Recebidos</TabsTrigger>
            <TabsTrigger value="enviados">Enviados</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {(() => {
        const visible =
          filter === "recebidos"
            ? elogios.filter((e) => user && e.destinatario_id === user.id)
            : filter === "enviados"
              ? elogios.filter((e) => user && e.remetente_id === user.id)
              : elogios;
        return visible.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum elogio para exibir.</p>
      ) : (
        <div className="grid gap-3">
          {visible.map((el) => (
            <div
              key={el.id}
              className="group rounded-xl border border-border bg-card p-5 flex items-start gap-4"
            >
              <div className="text-3xl shrink-0">{el.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-sm">
                  <span className="font-semibold text-foreground">{el.remetente_nome}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">{el.destinatario_nome}</span>
                  {el.publico ? (
                    <Badge className="text-xs border-transparent bg-purple-600 text-white hover:bg-purple-600/90">
                      Público
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Lock className="h-3 w-3 mr-1" /> Privado
                    </Badge>
                  )}
                </div>
                <p className="text-foreground mt-2 break-words">{el.mensagem}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(el.created_at).toLocaleString("pt-BR")}
                </p>
                <ElogioReacoes elogioId={el.id} />
              </div>
              {canDelete(el) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(el.id)}
                  aria-label="Excluir elogio"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>
      );
      })()}
    </div>
  );
};

export default MuralElogios;
