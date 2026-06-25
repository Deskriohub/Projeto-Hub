import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Trash2, Lock, Globe, ArrowLeft, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { UserPicker } from "@/components/UserPicker";
import { toast } from "@/hooks/use-toast";
import { ElogioReacoes } from "@/components/elogios/ElogioReacoes";
import { ElogioAnexo } from "@/components/elogios/ElogioAnexo";
import { CATEGORIAS_CLIENTE, categoriaDisplay, anexoTipoFromMime, ANEXO_MAX_BYTES } from "@/lib/elogios";

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
  destinatario_id: string | null;
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

type Origem = "interno" | "cliente";

const Elogios = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [origem, setOrigem] = useState<Origem>("interno");
  const [destinatarioId, setDestinatarioId] = useState<string>("");
  const [mensagem, setMensagem] = useState<string>("");
  const [publico, setPublico] = useState<boolean>(true);
  const [clienteNome, setClienteNome] = useState<string>("");
  const [categoria, setCategoria] = useState<string>("atendimento");
  const [categoriaDetalhe, setCategoriaDetalhe] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [enviados, setEnviados] = useState<Elogio[]>([]);
  const [meuNome, setMeuNome] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePickFile = (f: File | null) => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    if (!f) {
      setFile(null);
      setFilePreview(null);
      return;
    }
    const tipo = anexoTipoFromMime(f.type);
    if (!tipo) {
      toast({ title: "Tipo não suportado", description: "Envie imagem, vídeo ou áudio.", variant: "destructive" });
      return;
    }
    if (f.size > ANEXO_MAX_BYTES) {
      toast({ title: "Arquivo muito grande", description: "Limite de 50 MB.", variant: "destructive" });
      return;
    }
    setFile(f);
    setFilePreview(tipo === "imagem" ? URL.createObjectURL(f) : null);
  };

  const resetForm = () => {
    setMensagem("");
    setDestinatarioId("");
    setPublico(true);
    setClienteNome("");
    setCategoria("atendimento");
    setCategoriaDetalhe("");
    handlePickFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (origem === "interno") {
      if (!destinatarioId) {
        toast({ title: "Selecione um destinatário", variant: "destructive" });
        return;
      }
      if (!mensagem.trim()) {
        toast({ title: "Escreva uma mensagem", variant: "destructive" });
        return;
      }
    } else {
      if (!clienteNome.trim()) {
        toast({ title: "Informe o nome do cliente", variant: "destructive" });
        return;
      }
      if (categoria === "colaborador" && !destinatarioId) {
        toast({ title: "Selecione o colaborador elogiado", variant: "destructive" });
        return;
      }
      if (categoria === "outro" && !categoriaDetalhe.trim()) {
        toast({ title: "Especifique sobre o quê é o elogio", variant: "destructive" });
        return;
      }
      if (!mensagem.trim() && !file) {
        toast({ title: "Adicione uma mensagem ou um anexo", description: "Print, vídeo ou áudio do cliente.", variant: "destructive" });
        return;
      }
    }
    if (mensagem.length > 1000) {
      toast({ title: "Mensagem muito longa (máx. 1000)", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    // Upload do anexo (se houver)
    let anexo_url: string | null = null;
    let anexo_tipo: string | null = null;
    let anexo_nome: string | null = null;
    if (file) {
      const tipo = anexoTipoFromMime(file.type);
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("elogios")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) {
        setSubmitting(false);
        toast({ title: "Erro ao enviar anexo", description: upErr.message, variant: "destructive" });
        return;
      }
      anexo_url = supabase.storage.from("elogios").getPublicUrl(path).data.publicUrl;
      anexo_tipo = tipo;
      anexo_nome = file.name;
    }

    const base = {
      remetente_id: user.id,
      remetente_nome: meuNome,
      origem,
      publico,
      emoji: "",
    };
    const payload =
      origem === "interno"
        ? {
            ...base,
            destinatario_id: destinatarioId,
            destinatario_nome: destinatarioNome,
            mensagem: mensagem.trim(),
          }
        : {
            ...base,
            cliente_nome: clienteNome.trim(),
            categoria,
            categoria_detalhe: categoria === "outro" ? categoriaDetalhe.trim() : null,
            destinatario_id: categoria === "colaborador" ? destinatarioId : null,
            destinatario_nome: categoria === "colaborador" ? destinatarioNome : null,
            mensagem: mensagem.trim() || null,
            anexo_url,
            anexo_tipo,
            anexo_nome,
          };

    const { error } = await supabase.from("elogios").insert(payload);
    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao salvar elogio", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Elogio registrado!" });
    resetForm();
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
          <Send className="h-6 w-6 text-primary" /> Registrar Elogio
        </h1>
        <p className="text-muted-foreground mt-1">Reconheça um colega ou guarde o elogio de um cliente</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 mb-10">
        <Tabs value={origem} onValueChange={(v) => setOrigem(v as Origem)} className="mb-5">
          <TabsList>
            <TabsTrigger value="interno">De um colega</TabsTrigger>
            <TabsTrigger value="cliente">De um cliente</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid gap-5">
          {origem === "cliente" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="cliente" className="mb-2 block">Cliente</Label>
                <Input
                  id="cliente"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  placeholder="Nome do cliente"
                  maxLength={120}
                />
              </div>
              <div>
                <Label htmlFor="categoria" className="mb-2 block">Sobre o quê</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="categoria"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_CLIENTE.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {origem === "cliente" && categoria === "outro" && (
            <div>
              <Label htmlFor="categoria-detalhe" className="mb-2 block">Especifique</Label>
              <Input
                id="categoria-detalhe"
                value={categoriaDetalhe}
                onChange={(e) => setCategoriaDetalhe(e.target.value)}
                placeholder="Sobre o quê é o elogio?"
                maxLength={120}
              />
            </div>
          )}

          {(origem === "interno" || categoria === "colaborador") && (
            <div>
              <Label htmlFor="destinatario" className="mb-2 block">
                {origem === "interno" ? "Para" : "Colaborador elogiado"}
              </Label>
              <UserPicker
                id="destinatario"
                options={profiles}
                value={destinatarioId}
                onChange={setDestinatarioId}
                placeholder="Selecione um colega"
              />
            </div>
          )}

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
            <Label htmlFor="mensagem" className="mb-2 block">
              Mensagem {origem === "cliente" && <span className="text-muted-foreground font-normal">(opcional se anexar mídia)</span>}
            </Label>
            <Textarea
              id="mensagem"
              ref={textareaRef}
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder={origem === "interno" ? "Escreva seu elogio..." : "Transcreva ou resuma o elogio do cliente..."}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1">{mensagem.length}/1000</p>
          </div>

          {origem === "cliente" && (
            <div>
              <Label className="mb-2 block">Anexo (print, vídeo ou áudio do cliente)</Label>
              {!file ? (
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-2" /> Anexar arquivo
                </Button>
              ) : (
                <div className="flex items-center gap-3 rounded-md border border-border bg-background p-3">
                  {filePreview ? (
                    <img src={filePreview} alt="prévia" className="h-14 w-14 rounded object-cover" />
                  ) : (
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-sm text-foreground truncate flex-1">{file.name}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => handlePickFile(null)} aria-label="Remover anexo">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                className="hidden"
                onChange={(e) => handlePickFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground mt-1">Imagem, vídeo ou áudio — até 50 MB.</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch id="publico" checked={publico} onCheckedChange={setPublico} />
              <Label htmlFor="publico" className="cursor-pointer flex items-center gap-1.5">
                {publico ? (<><Globe className="h-4 w-4" /> Público</>) : (<><Lock className="h-4 w-4" /> Privado</>)}
              </Label>
            </div>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Salvando..." : "Registrar Elogio"}
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Elogios registrados por você</h2>
        {enviados.length === 0 ? (
          <p className="text-muted-foreground text-sm">Você ainda não registrou nenhum elogio.</p>
        ) : (
          <div className="grid gap-3">
            {enviados.map((el) => {
              const isCliente = el.origem === "cliente";
              const titulo = isCliente
                ? `Cliente: ${el.cliente_nome || "—"}`
                : `Para: ${el.destinatario_nome || "—"}`;
              return (
                <div key={el.id} className="group rounded-xl border border-border bg-card p-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{titulo}</span>
                      {isCliente && (
                        <Badge variant="outline" className="text-xs">{categoriaDisplay(el.categoria, el.categoria_detalhe)}</Badge>
                      )}
                      {isCliente && el.destinatario_nome && (
                        <span className="text-xs text-muted-foreground">sobre {el.destinatario_nome}</span>
                      )}
                      {el.publico ? (
                        <Badge className="text-xs border-transparent bg-purple-600 text-white hover:bg-purple-600/90">Público</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs"><Lock className="h-3 w-3 mr-1" /> Privado</Badge>
                      )}
                    </div>
                    {el.mensagem && <p className="text-foreground mt-1 break-words">{el.mensagem}</p>}
                    <ElogioAnexo url={el.anexo_url} tipo={el.anexo_tipo} nome={el.anexo_nome} />
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(el.created_at).toLocaleString("pt-BR")}
                    </p>
                    <ElogioReacoes elogioId={el.id} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(el.id)} aria-label="Excluir elogio">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Elogios;
