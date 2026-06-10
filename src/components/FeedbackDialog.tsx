import { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { logAudit } from "@/lib/auditLog";
import { notificar } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface FeedbackRecord {
  id: string;
  one_on_one_id: string | null;
  de_user_id: string;
  de_user_nome: string;
  para_user_id: string;
  para_user_nome: string;
  tipo: string;
  conteudo: string;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string | null;
}

export const TIPO_CONFIG = {
  positivo:    { label: "Positivo",    color: "bg-green-100 text-green-700 border-green-200" },
  construtivo: { label: "Construtivo", color: "bg-orange-100 text-orange-700 border-orange-200" },
  negativo:    { label: "Negativo",    color: "bg-red-100 text-red-700 border-red-200" },
};

interface FeedbackDialogProps {
  open: boolean;
  onClose: (created?: FeedbackRecord) => void;
  profiles: Profile[];
  preFilledParaId?: string;
  preFilledParaNome?: string;
  preFilledOneOnOneId?: string;
}

export function FeedbackDialog({
  open, onClose, profiles, preFilledParaId, preFilledParaNome, preFilledOneOnOneId,
}: FeedbackDialogProps) {
  const { user } = useAuth();
  const { fullName } = useProfile();
  const [paraId, setParaId] = useState(preFilledParaId ?? "");
  const [tipo, setTipo] = useState("positivo");
  const [conteudo, setConteudo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setParaId(preFilledParaId ?? "");
      setTipo("positivo");
      setConteudo("");
    }
  }, [open, preFilledParaId]);

  const handleSave = async () => {
    if (!user) return;
    if (!paraId) { toast.error("Selecione o destinatário."); return; }
    if (!conteudo.trim()) { toast.error("Escreva o conteúdo do feedback."); return; }

    const paraNome = profiles.find((p) => p.id === paraId)?.full_name ?? preFilledParaNome ?? "—";
    const deNome = fullName || "—";

    setSaving(true);
    const { data, error } = await supabase
      .from("feedbacks")
      .insert({
        de_user_id: user.id,
        de_user_nome: deNome,
        para_user_id: paraId,
        para_user_nome: paraNome,
        tipo,
        conteudo: conteudo.trim(),
        one_on_one_id: preFilledOneOnOneId ?? null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) { toast.error("Erro ao enviar feedback."); return; }

    logAudit(user.id, deNome, `Enviou feedback ${tipo} para ${paraNome}`, "Feedbacks", {
      depois: `Tipo: ${tipo}\nPara: ${paraNome}\nConteúdo: ${conteudo.trim()}`,
    });
    notificar([paraId], {
      titulo: `Você recebeu um feedback ${tipo}`,
      descricao: `De ${deNome}: ${conteudo.trim()}`,
      tipo: "feedback",
      link: "/feedbacks",
    });
    toast.success("Feedback enviado!");
    onClose(data as FeedbackRecord);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" /> Novo Feedback
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Para</Label>
            {preFilledParaId ? (
              <p className="mt-1 text-sm font-medium p-2 bg-muted/40 rounded-md">{preFilledParaNome}</p>
            ) : (
              <Select value={paraId} onValueChange={setParaId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {profiles.filter((p) => p.id !== user?.id).map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name || "—"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label>Tipo</Label>
            <div className="flex gap-2 mt-1">
              {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTipo(key)}
                  className={`flex-1 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                    tipo === key
                      ? cfg.color + " border-current"
                      : "border-border text-muted-foreground hover:bg-accent/40"
                  }`}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="fb-conteudo">Feedback</Label>
            <Textarea
              id="fb-conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Escreva seu feedback..."
              rows={4}
              className="mt-1 resize-none"
            />
          </div>

          {preFilledOneOnOneId && (
            <p className="text-xs text-muted-foreground bg-muted/40 px-3 py-2 rounded-md">
              Este feedback será vinculado ao one-on-one.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onClose()}>Cancelar</Button>
          <Button size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
