import { useEffect, useMemo, useState } from "react";
import { NotebookPen, Plus, Search, Pencil, Trash2, CalendarRange, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamProfiles } from "@/hooks/useTeamProfiles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { renderMarkdownLite } from "@/lib/markdownLite";
import AnotacaoComposer, { Anotacao } from "@/components/AnotacaoComposer";

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

const Anotacoes = () => {
  const { user } = useAuth();
  const { profiles, loading: loadingProfiles } = useTeamProfiles();
  const [busca, setBusca] = useState("");
  const [selId, setSelId] = useState<string>("");
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Anotacao | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Anotacao | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lideradosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => (p.full_name || p.email || "").toLowerCase().includes(q));
  }, [profiles, busca]);

  const selecionado = useMemo(() => profiles.find((p) => p.id === selId), [profiles, selId]);

  const loadAnotacoes = async (lideradoId: string) => {
    if (!lideradoId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("anotacoes")
      .select("*")
      .eq("liderado_id", lideradoId)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao carregar anotações", description: error.message, variant: "destructive" });
      return;
    }
    setAnotacoes((data || []) as Anotacao[]);
  };

  useEffect(() => {
    if (selId) loadAnotacoes(selId);
    else setAnotacoes([]);
  }, [selId]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("anotacoes").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setAnotacoes((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
    toast({ title: "Anotação excluída" });
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <NotebookPen className="h-6 w-6 text-primary" /> Anotações
        </h1>
        <p className="text-muted-foreground mt-1">
          Escolha um liderado e veja todas as anotações dele por data. Anote livremente — não precisa de um 1:1.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[260px_1fr]">
        {/* Coluna esquerda: liderados */}
        <aside className="rounded-xl border border-border bg-card p-3 h-fit md:sticky md:top-4">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar liderado..."
              className="pl-8 h-9"
            />
          </div>
          {loadingProfiles ? (
            <p className="text-sm text-muted-foreground px-1">Carregando...</p>
          ) : lideradosFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground px-1">Nenhum liderado encontrado.</p>
          ) : (
            <ul className="space-y-0.5 max-h-[60vh] overflow-auto">
              {lideradosFiltrados.map((p) => {
                const active = p.id === selId;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelId(p.id)}
                      className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      {p.full_name || p.email || "—"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Coluna direita: anotações do liderado */}
        <section className="min-w-0">
          {!selecionado ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
              <NotebookPen className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Selecione um liderado à esquerda para ver as anotações.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-lg font-semibold text-foreground">{selecionado.full_name || selecionado.email}</h2>
                <Button
                  onClick={() => { setEditing(null); setComposerOpen(true); }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Nova anotação
                </Button>
              </div>

              {loading ? (
                <p className="text-muted-foreground text-sm">Carregando...</p>
              ) : anotacoes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
                  <p className="text-sm">Nenhuma anotação ainda. Clique em <strong className="text-foreground">Nova anotação</strong> para começar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anotacoes.map((a) => {
                    const isMine = a.autor_id === user?.id;
                    return (
                      <article key={a.id} className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CalendarRange className="h-4 w-4" />
                            <span className="font-medium text-foreground">{formatDateBR(a.data)}</span>
                            {a.one_on_one_id && (
                              <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 font-medium">
                                <Link2 className="h-3 w-3" /> 1:1
                              </span>
                            )}
                          </div>
                          {isMine && (
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(a); setComposerOpen(true); }} aria-label="Editar">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(a)} aria-label="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div
                          className="text-sm text-foreground [&_p]:mb-1 [&_p:last-child]:mb-0"
                          dangerouslySetInnerHTML={renderMarkdownLite(a.conteudo || "")}
                        />
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {selecionado && (
        <AnotacaoComposer
          open={composerOpen}
          onClose={(saved) => {
            setComposerOpen(false);
            setEditing(null);
            if (saved) loadAnotacoes(selecionado.id);
          }}
          lideradoId={selecionado.id}
          lideradoNome={selecionado.full_name || selecionado.email || "Liderado"}
          existing={editing}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anotação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta anotação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Anotacoes;
