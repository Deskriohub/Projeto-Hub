import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const MAX_LEN = 1000;
const EMOJIS = ["💡", "🚀", "✅", "❤️", "👏", "😊", "🎯", "⚠️", "🙏", "😂"];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SugestaoModal({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [texto, setTexto] = useState("");
  const [anonima, setAnonima] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const userName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name ||
    user?.email ||
    "Usuário";

  const reset = () => {
    setTexto("");
    setAnonima(false);
  };

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    const start = ta?.selectionStart ?? texto.length;
    const end = ta?.selectionEnd ?? texto.length;
    const next = (texto.slice(0, start) + emoji + texto.slice(end)).slice(0, MAX_LEN);
    setTexto(next);
    requestAnimationFrame(() => {
      if (!ta) return;
      const pos = Math.min(start + emoji.length, MAX_LEN);
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  };

  const handleSubmit = async () => {
    const trimmed = texto.trim();
    if (!trimmed) {
      toast.error("Escreva sua sugestão antes de enviar.");
      return;
    }
    if (trimmed.length > MAX_LEN) {
      toast.error(`Limite de ${MAX_LEN} caracteres.`);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("sugestoes").insert({
      texto: trimmed,
      anonima,
      autor_id: user?.id ?? null,
      autor_nome: anonima ? null : userName,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar sugestão.");
      return;
    }
    toast.success("Sugestão enviada com sucesso!");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dar uma sugestão</DialogTitle>
          <DialogDescription>
            Compartilhe uma ideia para melhorar a DeskRio.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insertEmoji(e)}
                  className="h-8 w-8 rounded-md hover:bg-muted text-lg flex items-center justify-center transition-colors"
                  aria-label={`Inserir ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <Textarea
              ref={textareaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, MAX_LEN))}
              placeholder="Escreva sua sugestão..."
              rows={6}
              maxLength={MAX_LEN}
            />
            <div className="text-xs text-muted-foreground text-right">
              {texto.length}/{MAX_LEN}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Switch id="anonima" checked={anonima} onCheckedChange={setAnonima} />
              <Label htmlFor="anonima" className="cursor-pointer">
                Enviar anonimamente
              </Label>
            </div>
            {anonima ? (
              <div className="text-xs rounded-md border border-border bg-muted/60 text-muted-foreground px-3 py-2">
                🔒 Sua sugestão será enviada anonimamente
              </div>
            ) : (
              <div className="text-xs rounded-md border border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400 px-3 py-2">
                ✅ Enviando como: <span className="font-medium">{userName}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !texto.trim()}>
            {submitting ? "Enviando..." : "Enviar Sugestão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
