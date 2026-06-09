import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Trash2, Lock, Globe, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UserPicker } from "@/components/UserPicker";
import { toast } from "@/hooks/use-toast";
import { ElogioReacoes } from "@/components/elogios/ElogioReacoes";

const EMOJIS = ["🌟", "💪", "🤝", "🎯", "🚀", "💡", "❤️", "🏆", "👏", "😊", "😂"];

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
}

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

const Elogios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [destinatarioId, setDestinatarioId] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");
  const [publico, setPublico] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [enviados, setEnviados] = useState<Elogio[]>([]);
  const [meuNome, setMeuNome] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertEmoji = (e: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setMensagem((prev) => (prev + e).slice(0, 1000));
      return;
    }
    const start = ta.selectionStart ?? mensagem.length;
    const end = ta.selectionEnd ?? mensagem.length;
    const next = (mensagem.slice(0, start) + e + mensagem.slice(end)).slice(0, 1000);
    setMensagem(next);
    requestAnimationFrame(() => {
      ta.focus();
      const pos = Math.min(start + e.length, next.length);
      ta.setSelectionRange(pos, pos);
    });
  };

  const loadEnviados = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("elogios")
      .select("*")
      .eq("remetente_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setEnviados(data as Elogio[]);
  };

  useEffect(() => {
    const load = async () => {
      if (!user) return;

      const { data: meProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      setMeuNome(meProfile?.full_name || user.email || "Usuário");

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .neq("id", user.id);
      const sorted = (allProfiles || []).sort((a, b) =>
        (a.full_name || "").localeCompare(b.full_name || "")
      );
      setProfiles(sorted as Profile[]);

      await loadEnviados();
    };
    load();
  }, [user]);

  const destinatarioNome = useMemo(() => {
    const p = profiles.find((x) => x.id === destinatarioId);
    return p?.full_name || "";
  }, [destinatarioId, profiles]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!destinatarioId) {
      toast({ title: "Selecione um destinatário", variant: "destructive" });
      return;
    }
    if (!mensagem.trim()) {
      toast({ title: "Escreva uma mensagem", variant: "destructive" });
      return;
    }
    if (mensagem.length > 1000) {
      toast({ title: "Mensagem muito longa (máx. 1000)", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("elogios").insert({
      remetente_id: user.id,
      remetente_nome: meuNome,
      destinatario_id: destinatarioId,
      destinatario_nome: destinatarioNome,
      mensagem: mensagem.trim(),
      emoji: "",
      publico,
    });
    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao enviar elogio", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Elogio enviado!", description: `Para ${destinatarioNome}` });
    setMensagem("");
    setDestinatarioId("");
    setPublico(true);
    await loadEnviados();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("elogios").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    setEnviados((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div>
      <Button variant="ghost" onClick={() => navigate("/mural-elogios")} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
      </Button>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Send className="h-6 w-6 text-primary" /> Enviar Elogio
        </h1>
        <p className="text-muted-foreground mt-1">Reconheça seus colegas com uma mensagem</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-10">
        <div className="grid gap-5">
          <div>
            <Label htmlFor="destinatario" className="mb-2 block">Para</Label>
            <UserPicker
              id="destinatario"
              options={profiles}
              value={destinatarioId}
              onChange={setDestinatarioId}
              placeholder="Selecione um colega"
            />
          </div>

          <div>
            <Label className="mb-2 block">Emojis</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => insertEmoji(e)}
                  className="h-11 w-11 rounded-lg text-2xl border border-border bg-background hover:bg-accent/40 transition-all"
                  aria-label={`Inserir ${e}`}
                >
                  {e}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Clique para inserir no texto</p>
          </div>

          <div>
            <Label htmlFor="mensagem" className="mb-2 block">Mensagem</Label>
            <Textarea
              id="mensagem"
              ref={textareaRef}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva seu elogio..."
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">{mensagem.length}/1000</p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch id="publico" checked={publico} onCheckedChange={setPublico} />
              <Label htmlFor="publico" className="cursor-pointer flex items-center gap-1.5">
                {publico ? (
                  <>
                    <Globe className="h-4 w-4" /> Público
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" /> Privado
                  </>
                )}
              </Label>
            </div>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Enviando..." : "Enviar Elogio"}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Elogios Enviados</h2>
        {enviados.length === 0 ? (
          <p className="text-muted-foreground text-sm">Você ainda não enviou nenhum elogio.</p>
        ) : (
          <div className="grid gap-3">
            {enviados.map((el) => (
              <div
                key={el.id}
                className="group rounded-xl border border-border bg-card p-4 flex items-start gap-4"
              >
                <div className="text-3xl shrink-0">{el.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">Para: {el.destinatario_nome}</span>
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
                  <p className="text-foreground mt-1 break-words">{el.mensagem}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(el.created_at).toLocaleString("pt-BR")}
                  </p>
                  <ElogioReacoes elogioId={el.id} />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(el.id)}
                  aria-label="Excluir elogio"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Elogios;
