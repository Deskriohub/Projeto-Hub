import { useEffect, useState, useRef } from "react";
import { BookOpen, Upload, FileText, Trash2, Download, Loader2, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { logAudit } from "@/lib/auditLog";
import { extractDocumentText } from "@/lib/pdfExtract";
import { toast } from "@/hooks/use-toast";

interface Documento {
  id: string;
  nome: string;
  conteudo: string;
  arquivo_url: string | null;
  tamanho: number;
  created_at: string;
}

function formatBytes(chars: number): string {
  if (chars < 1000) return `${chars} caracteres`;
  return `${(chars / 1000).toFixed(1)}k caracteres`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export default function BaseConhecimento() {
  const { user } = useAuth();
  const { fullName } = useProfile();
  const [docs, setDocs] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const { data } = await supabase
      .from("ia_documentos")
      .select("id, nome, conteudo, arquivo_url, tamanho, created_at")
      .order("created_at", { ascending: false });
    setDocs((data as Documento[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    const suportado = /\.(pdf|docx|pptx|txt|md)$/i.test(file.name);
    if (!suportado) {
      toast({ title: "Formato não suportado", description: "Envie PDF, DOCX, PPTX, TXT ou MD.", variant: "destructive" });
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Use um arquivo menor que 15MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      // 1. Extrai o texto (PDF, DOCX, PPTX ou texto)
      setProgress("Lendo o conteúdo do arquivo...");
      const texto = await extractDocumentText(file);

      if (!texto || texto.length < 20) {
        toast({
          title: "Não consegui ler o texto",
          description: "O arquivo pode estar vazio ou ser um PDF/imagem escaneada. Tente um arquivo com texto selecionável.",
          variant: "destructive",
        });
        setUploading(false);
        setProgress("");
        return;
      }

      // 2. Sobe o arquivo original para o storage
      setProgress("Salvando o arquivo...");
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const path = `${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from("documentos").upload(path, file, { upsert: true });

      let arquivoUrl: string | null = null;
      if (!upErr) {
        const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(path);
        arquivoUrl = urlData.publicUrl;
      }

      // 3. Salva o texto extraído na base de conhecimento
      setProgress("Registrando na base de conhecimento...");
      const { data: inserted, error: insErr } = await supabase
        .from("ia_documentos")
        .insert({
          nome: file.name,
          conteudo: texto,
          arquivo_url: arquivoUrl,
          tamanho: texto.length,
          created_by: user.id,
        })
        .select("id, nome, conteudo, arquivo_url, tamanho, created_at")
        .single();

      if (insErr) {
        toast({ title: "Erro ao salvar", description: insErr.message, variant: "destructive" });
      } else {
        setDocs((prev) => [inserted as Documento, ...prev]);
        logAudit(user.id, fullName, `Adicionou o documento "${file.name}" à base de conhecimento`, "Base de Conhecimento", {
          depois: `${file.name}\n${texto.length} caracteres extraídos`,
        });
        toast({ title: "Documento adicionado", description: "O Deskinho já pode usar esse conteúdo." });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: "Erro ao processar arquivo", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  const handleDelete = async (doc: Documento) => {
    const { error } = await supabase.from("ia_documentos").delete().eq("id", doc.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
      return;
    }
    // Remove o arquivo do storage também (best-effort)
    if (doc.arquivo_url) {
      const path = doc.arquivo_url.split("/documentos/")[1];
      if (path) await supabase.storage.from("documentos").remove([path]);
    }
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    if (user) logAudit(user.id, fullName, `Removeu o documento "${doc.nome}" da base de conhecimento`, "Base de Conhecimento", {
      antes: `${doc.nome}\n${doc.tamanho} caracteres`,
    });
    toast({ title: "Documento removido" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">Materiais que o Deskinho usa para responder dúvidas da DeskRio.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" /> Como funciona
          </CardTitle>
          <CardDescription>
            Envie os materiais da DeskRio (manuais, processos, FAQs) em PDF ou texto.
            O sistema extrai o conteúdo automaticamente e o Deskinho passa a usá-lo nas respostas.
            O arquivo original fica guardado para consulta e download.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.md"
            className="hidden"
            onChange={handleFile}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {progress || "Processando..."}</>
              : <><Upload className="h-4 w-4 mr-2" /> Enviar documento</>}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            PDF, Word (.docx), PowerPoint (.pptx), .txt ou .md — máx. 15MB.
            PDFs escaneados (imagem) não são suportados.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documentos cadastrados ({docs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento ainda. Envie o primeiro material acima.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-start justify-between gap-3 p-3 rounded-md border bg-muted/30">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(doc.tamanho)} · {formatDate(doc.created_at)}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2 italic">
                        {doc.conteudo.slice(0, 200)}…
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.arquivo_url && (
                      <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer"
                        className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-primary" title="Baixar arquivo">
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                    <button onClick={() => handleDelete(doc)}
                      className="p-2 rounded hover:bg-accent text-muted-foreground hover:text-destructive" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
