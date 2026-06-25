import { useCallback, useEffect, useState } from "react";
import { NotebookPen, Plus, Pencil, Trash2, ArrowDownToLine, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { renderMarkdownLite } from "@/lib/markdownLite";
import AnotacaoComposer, { Anotacao } from "@/components/AnotacaoComposer";

interface Props {
  oneOnOneId: string;
  lideradoId: string;
  lideradoNome: string;
  dataReuniao: string; // yyyy-mm-dd
  canEdit: boolean;
}

function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Anotações dentro do 1:1. A reunião NÃO é dona das anotações: ela puxa as
 * anotações do liderado no período (desde o 1:1 anterior) pra você levar pra
 * conversa e marcar quais entram na pauta (vincula one_on_one_id a esta reunião).
 */
const OneOnOneAnotacoes = ({ oneOnOneId, lideradoId, lideradoNome, dataReuniao, canEdit }: Props) => {
  const { user } = useAuth();
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [periodoInicio, setPeriodoInicio] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<Anotacao | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Anotacao | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!lideradoId) return;
    setLoading(true);
    // 1:1 anterior deste liderado → início do período ("desde o último 1:1")
    const { data: prev } = await supabase
      .from("one_on_one")
      .select("data_reuniao")
      .eq("liderado_id", lideradoId)
      .lt("data_reuniao", dataReuniao)
      .order("data_reuniao", { ascending: false })
      .limit(1);
    const inicio = prev && prev.length > 0 ? (prev[0] as { data_reuniao: string }).data_reuniao : null;
    setPeriodoInicio(inicio);

    // Anotações do liderado: as da pauta desta reunião + as do período (até a data da reunião)
    let q = supabase
      .from("anotacoes")
      .select("*")
      .eq("liderado_id", lideradoId)
      .lte("data", dataReuniao)
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });
    if (inicio) q = q.gte("data", inicio);
    const { data: doPeriodo, error } = await q;
    if (error) {
      setLoading(false);
      toast({ title: "Erro ao carregar anotações", description: error.message, variant: "destructive" });
      return;
    }
    // Garante que as já vinculadas a esta reunião apareçam mesmo que fora da janela do período
    const idsCarregados = new Set((doPeriodo || []).map((a) => a.id));
    const { data: vinculadasFora } = await supabase
      .from("anotacoes")
      .select("*")
      .eq("one_on_one_id", oneOnOneId)
      .order("data", { ascending: false });
    const extras = (vinculadasFora || []).filter((a) => !idsCarregados.has(a.id));
    setAnotacoes([...(doPeriodo || []), ...extras] as Anotacao[]);
    setLoading(false);
  }, [lideradoId, dataReuniao, oneOnOneId]);

  useEffect(() => {
    load();
  }, [load]);

  const naPauta = anotacoes.filter((a) => a.one_on_one_id === oneOnOneId);
  const disponiveis = anotacoes.filter((a) => a.one_on_one_id !== oneOnOneId);

  const setPauta = async (a: Anotacao, entra: boolean) => {
    const { error } = await supabase
      .from("anotacoes")
      .update({ one_on_one_id: entra ? oneOnOneId : null, updated_at: new Date().toISOString() })
      .eq("id", a.id);
    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("anotacoes").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setDeleteTarget(null);
    await load();
  };

  const renderItem = (a: Anotacao, contexto: "pauta" | "disponivel") => {
    const isMine = a.autor_id === user?.id;
    return (
      <li key={a.id} className="rounded-md border border-border bg-background p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-medium text-foreground">{formatDateBR(a.data)}</span>
          <div className="flex items-center gap-1">
            {canEdit && contexto === "disponivel" && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPauta(a, true)}>
                <ArrowDownToLine className="h-3.5 w-3.5 mr-1" /> Trazer p/ pauta
              </Button>
            )}
            {canEdit && contexto === "pauta" && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPauta(a, false)}>
                <X className="h-3.5 w-3.5 mr-1" /> Tirar da pauta
              </Button>
            )}
            {isMine && (
              <>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditing(a); setComposerOpen(true); }} aria-label="Editar">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteTarget(a)} aria-label="Excluir">
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </>
            )}
          </div>
        </div>
        <div
          className="text-sm text-foreground [&_p]:mb-1 [&_p:last-child]:mb-0"
          dangerouslySetInnerHTML={renderMarkdownLite(a.conteudo || "")}
        />
      </li>
    );
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Label className="flex items-center gap-2 text-base">
          <NotebookPen className="h-4 w-4 text-primary" /> Anotações
        </Label>
        {canEdit && (
          <Button size="sm" onClick={() => { setEditing(null); setComposerOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Nova anotação
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        As anotações pertencem ao liderado. Aqui você puxa as do período
        {periodoInicio ? ` (desde ${formatDateBR(periodoInicio)})` : ""} e marca quais entram na pauta deste 1:1.
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Na pauta deste 1:1</p>
            {naPauta.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma anotação na pauta ainda.</p>
            ) : (
              <ul className="space-y-2">{naPauta.map((a) => renderItem(a, "pauta"))}</ul>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground mb-2">Do período (não estão na pauta)</p>
            {disponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada no período.</p>
            ) : (
              <ul className="space-y-2">{disponiveis.map((a) => renderItem(a, "disponivel"))}</ul>
            )}
          </div>
        </div>
      )}

      <AnotacaoComposer
        open={composerOpen}
        onClose={(saved) => {
          setComposerOpen(false);
          setEditing(null);
          if (saved) load();
        }}
        lideradoId={lideradoId}
        lideradoNome={lideradoNome}
        oneOnOneId={editing ? editing.one_on_one_id : oneOnOneId}
        existing={editing}
      />

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

export default OneOnOneAnotacoes;
